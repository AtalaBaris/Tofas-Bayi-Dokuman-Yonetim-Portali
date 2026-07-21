using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Helpers;
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Enums;
using BayiPortal.Core.Exceptions;

namespace BayiPortal.Application.Services;

public sealed class MaterialService : IMaterialService
{
    private const string DealerUserRole = "DealerUser";
    private const int DueBatchSize = 50;

    private readonly IMaterialRepository _materialRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IFileUploadPolicy _fileUploadPolicy;
    private readonly IAccessLogService _accessLogService;
    private readonly INotificationService _notificationService;

    public MaterialService(
        IMaterialRepository materialRepository,
        IFileStorageService fileStorageService,
        IFileUploadPolicy fileUploadPolicy,
        IAccessLogService accessLogService,
        INotificationService notificationService)
    {
        _materialRepository = materialRepository;
        _fileStorageService = fileStorageService;
        _fileUploadPolicy = fileUploadPolicy;
        _accessLogService = accessLogService;
        _notificationService = notificationService;
    }

    public async Task<List<MaterialResponse>> GetListAsync(
        MaterialListQuery query, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        IReadOnlyCollection<int>? restrictToBrandIds = null;
        var status = query.Status;
        var isDealerUser = requestingUser.Role == DealerUserRole;

        if (isDealerUser)
        {
            restrictToBrandIds = await GetDealerBrandIdsOrThrowAsync(requestingUser, cancellationToken);
            status = nameof(MaterialStatus.Active);
        }

        var materials = await _materialRepository.GetListAsync(
            query.CategoryId, query.BrandId, query.Keyword, status, restrictToBrandIds,
            excludeExpired: isDealerUser, cancellationToken);

        var responses = materials.Select(ToResponse).ToList();

        if (isDealerUser && responses.Count > 0)
        {
            var statuses = await _accessLogService.GetAccessStatusesAsync(
                requestingUser.UserId, responses.Select(r => r.Id).ToList(), cancellationToken);
            foreach (var response in responses)
            {
                if (statuses.TryGetValue(response.Id, out var accessStatus))
                {
                    response.MyAccessStatus = accessStatus;
                }
            }
        }

        return responses;
    }

    public async Task<MaterialResponse> GetByIdAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await GetAuthorizedMaterialAsync(id, requestingUser, cancellationToken);
        await _accessLogService.LogAsync(requestingUser.UserId, null, id, "Döküman Görüntüleme", $"\"{material.Title}\" dökümanı görüntülendi.", "N/A", cancellationToken);
        return ToResponse(material);
    }

    public async Task<MaterialResponse> CreateAsync(
        CreateMaterialRequest request, Stream fileContent, string originalFileName, string mimeType, long fileSize,
        RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Title, request.Description, request.CategoryId, request.BrandIds, cancellationToken);
        _fileUploadPolicy.ValidateOrThrow(originalFileName, mimeType, fileSize);

        var status = ParseCreateStatus(request.Status);
        var (recurrenceKind, dayOfWeek, dayOfMonth, scheduledAt) = ParseScheduleFields(
            status, request.ScheduledPublishAt, request.RecurrenceKind,
            request.RecurrenceDayOfWeek, request.RecurrenceDayOfMonth);

        var (storedFileName, relativePath) = await _fileStorageService.SaveAsync(fileContent, originalFileName, cancellationToken);

        var now = DateTime.UtcNow;
        var material = new Material
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            CategoryId = request.CategoryId,
            FileName = originalFileName,
            StoredFileName = storedFileName,
            FilePath = relativePath,
            MimeType = mimeType,
            FileSize = fileSize,
            Status = status,
            PublishedAt = status == MaterialStatus.Active ? now : (scheduledAt ?? now),
            ExpiresAt = NormalizeExpiresAt(request.ExpiresAt),
            ScheduledPublishAt = status == MaterialStatus.Scheduled ? scheduledAt : null,
            RecurrenceKind = status == MaterialStatus.Scheduled ? recurrenceKind : RecurrenceKind.None,
            RecurrenceDayOfWeek = status == MaterialStatus.Scheduled ? dayOfWeek : null,
            RecurrenceDayOfMonth = status == MaterialStatus.Scheduled ? dayOfMonth : null,
            CreatedBy = requestingUser.UserId,
            CreatedAt = now,
            UpdatedAt = now,
            MaterialBrands = request.BrandIds.Distinct().Select(brandId => new MaterialBrand { BrandId = brandId }).ToList()
        };

        _materialRepository.Add(material);
        await _materialRepository.SaveChangesAsync(cancellationToken);

        if (status == MaterialStatus.Active)
        {
            var savedForNotify = await _materialRepository.GetByIdAsync(material.Id, cancellationToken)
                ?? throw new MaterialNotFoundException(material.Id);
            await _notificationService.NotifyDealerUsersForMaterialAsync(savedForNotify, cancellationToken);
        }

        await _accessLogService.LogAsync(requestingUser.UserId, null, material.Id, "Döküman Yükleme", $"\"{material.Title}\" dökümanı yüklendi.", "N/A", cancellationToken);

        var saved = await _materialRepository.GetByIdAsync(material.Id, cancellationToken)
            ?? throw new MaterialNotFoundException(material.Id);
        return ToResponse(saved);
    }

    public async Task<MaterialResponse> UpdateAsync(
        int id, UpdateMaterialRequest request, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Title, request.Description, request.CategoryId, request.BrandIds, cancellationToken);

        var material = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        material.Title = request.Title;
        material.Description = request.Description;
        material.CategoryId = request.CategoryId;
        material.ExpiresAt = request.ExpiresAt;
        material.UpdatedAt = DateTime.UtcNow;

        material.MaterialBrands.Clear();
        foreach (var brandId in request.BrandIds.Distinct())
        {
            material.MaterialBrands.Add(new MaterialBrand { MaterialId = id, BrandId = brandId });
        }

        await _materialRepository.SaveChangesAsync(cancellationToken);

        var saved = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        await _accessLogService.LogAsync(requestingUser.UserId, null, id, "Döküman Güncelleme", $"\"{saved.Title}\" dökümanı güncellendi.", "N/A", cancellationToken);

        return ToResponse(saved);
    }

    public async Task ArchiveAsync(int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        material.Status = MaterialStatus.Archived;
        material.ScheduledPublishAt = null;
        material.RecurrenceKind = RecurrenceKind.None;
        material.RecurrenceDayOfWeek = null;
        material.RecurrenceDayOfMonth = null;
        material.UpdatedAt = DateTime.UtcNow;
        await _materialRepository.SaveChangesAsync(cancellationToken);

        await _accessLogService.LogAsync(requestingUser.UserId, null, id, "Döküman Arşivleme", $"\"{material.Title}\" dökümanı arşivlendi.", "N/A", cancellationToken);
    }

    public async Task<(Stream Content, string FileName, string MimeType)> GetDownloadStreamAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await GetAuthorizedMaterialAsync(id, requestingUser, cancellationToken);
        var stream = _fileStorageService.OpenRead(material.FilePath);
        await _accessLogService.LogAsync(requestingUser.UserId, null, id, "Döküman İndirme", $"\"{material.Title}\" dökümanı indirildi.", "N/A", cancellationToken);
        return (stream, material.FileName, material.MimeType);
    }

    public async Task<List<MaterialScheduleItemResponse>> GetScheduleCalendarAsync(
        DateTime fromUtc, DateTime toUtc, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        EnsureManager(requestingUser);
        fromUtc = ScheduleRecurrenceHelper.NormalizeUtc(fromUtc);
        toUtc = ScheduleRecurrenceHelper.NormalizeUtc(toUtc);
        if (toUtc <= fromUtc)
        {
            throw new ValidationException("Takvim aralığı geçersiz.");
        }

        var materials = await _materialRepository.GetScheduleCalendarAsync(fromUtc, toUtc, cancellationToken);
        return materials.Select(m => new MaterialScheduleItemResponse
        {
            Id = m.Id,
            Title = m.Title,
            Status = m.Status.ToString(),
            At = m.Status == MaterialStatus.Scheduled
                ? m.ScheduledPublishAt!.Value
                : m.PublishedAt,
            RecurrenceKind = m.RecurrenceKind.ToString(),
            RecurrenceDayOfWeek = m.RecurrenceDayOfWeek,
            RecurrenceDayOfMonth = m.RecurrenceDayOfMonth,
            BrandIds = m.MaterialBrands.Select(mb => mb.BrandId).ToList()
        }).ToList();
    }

    public async Task<MaterialResponse> UpdateScheduleAsync(
        int id, UpdateMaterialScheduleRequest request, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        EnsureManager(requestingUser);
        var material = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        if (material.Status is not (MaterialStatus.Scheduled or MaterialStatus.Draft))
        {
            throw new ValidationException("Yalnızca taslak veya zamanlanmış dokümanların yayın takvimi güncellenebilir.");
        }

        var (recurrenceKind, dayOfWeek, dayOfMonth, scheduledAt) = ParseScheduleFields(
            MaterialStatus.Scheduled, request.ScheduledPublishAt, request.RecurrenceKind,
            request.RecurrenceDayOfWeek, request.RecurrenceDayOfMonth);

        material.Status = MaterialStatus.Scheduled;
        material.ScheduledPublishAt = scheduledAt;
        material.RecurrenceKind = recurrenceKind;
        material.RecurrenceDayOfWeek = dayOfWeek;
        material.RecurrenceDayOfMonth = dayOfMonth;
        material.PublishedAt = scheduledAt!.Value;
        material.UpdatedAt = DateTime.UtcNow;

        await _materialRepository.SaveChangesAsync(cancellationToken);

        var saved = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);
        return ToResponse(saved);
    }

    public async Task<MaterialResponse> PublishNowAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        EnsureManager(requestingUser);
        var material = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        if (material.Status is not (MaterialStatus.Scheduled or MaterialStatus.Draft))
        {
            throw new ValidationException("Yalnızca taslak veya zamanlanmış dokümanlar hemen yayınlanabilir.");
        }

        await ActivateOneShotAsync(material, cancellationToken);

        var saved = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);
        return ToResponse(saved);
    }

    public async Task<MaterialResponse> CancelScheduleAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        EnsureManager(requestingUser);
        var material = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        if (material.Status != MaterialStatus.Scheduled)
        {
            throw new ValidationException("Yalnızca zamanlanmış dokümanlar iptal edilebilir.");
        }

        material.Status = MaterialStatus.Draft;
        // Takvimden çıkarılan doküman "havuz" gibi davranır: yüklenme tarihi (CreatedAt) görünmelidir.
        material.PublishedAt = material.CreatedAt;
        material.ScheduledPublishAt = null;
        material.RecurrenceKind = RecurrenceKind.None;
        material.RecurrenceDayOfWeek = null;
        material.RecurrenceDayOfMonth = null;
        material.UpdatedAt = DateTime.UtcNow;
        await _materialRepository.SaveChangesAsync(cancellationToken);

        var saved = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);
        return ToResponse(saved);
    }

    public async Task ProcessDueSchedulesAsync(CancellationToken cancellationToken = default)
    {
        var due = await _materialRepository.GetDueScheduledAsync(DateTime.UtcNow, DueBatchSize, cancellationToken);
        foreach (var material in due)
        {
            if (material.RecurrenceKind == RecurrenceKind.None)
            {
                await ActivateOneShotAsync(material, cancellationToken);
            }
            else
            {
                await PublishRecurringOccurrenceAsync(material, cancellationToken);
            }
        }
    }

    private async Task ActivateOneShotAsync(Material material, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        material.Status = MaterialStatus.Active;
        material.PublishedAt = now;
        material.ScheduledPublishAt = null;
        material.RecurrenceKind = RecurrenceKind.None;
        material.RecurrenceDayOfWeek = null;
        material.RecurrenceDayOfMonth = null;
        material.UpdatedAt = now;
        await _materialRepository.SaveChangesAsync(cancellationToken);

        var saved = await _materialRepository.GetByIdAsync(material.Id, cancellationToken)
            ?? throw new MaterialNotFoundException(material.Id);
        await _notificationService.NotifyDealerUsersForMaterialAsync(saved, cancellationToken);
    }

    private async Task PublishRecurringOccurrenceAsync(Material template, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var brandIds = template.MaterialBrands.Select(mb => mb.BrandId).ToList();

        var copy = new Material
        {
            Title = template.Title,
            Description = template.Description,
            CategoryId = template.CategoryId,
            FileName = template.FileName,
            StoredFileName = template.StoredFileName,
            FilePath = template.FilePath,
            MimeType = template.MimeType,
            FileSize = template.FileSize,
            Status = MaterialStatus.Active,
            PublishedAt = now,
            ExpiresAt = template.ExpiresAt,
            ScheduleTemplateId = template.Id,
            CreatedBy = template.CreatedBy,
            CreatedAt = now,
            UpdatedAt = now,
            MaterialBrands = brandIds.Select(brandId => new MaterialBrand { BrandId = brandId }).ToList()
        };

        _materialRepository.Add(copy);

        var nextAt = ScheduleRecurrenceHelper.ComputeNextOccurrence(
            template.ScheduledPublishAt ?? now,
            template.RecurrenceKind,
            template.RecurrenceDayOfWeek,
            template.RecurrenceDayOfMonth);

        template.ScheduledPublishAt = nextAt;
        template.PublishedAt = nextAt;
        template.UpdatedAt = now;

        await _materialRepository.SaveChangesAsync(cancellationToken);

        var savedCopy = await _materialRepository.GetByIdAsync(copy.Id, cancellationToken)
            ?? throw new MaterialNotFoundException(copy.Id);
        await _notificationService.NotifyDealerUsersForMaterialAsync(savedCopy, cancellationToken);
    }

    private async Task<Material> GetAuthorizedMaterialAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken)
    {
        var material = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        if (requestingUser.Role == DealerUserRole)
        {
            var dealerBrandIds = await GetDealerBrandIdsOrThrowAsync(requestingUser, cancellationToken);
            var hasMatchingBrand = material.MaterialBrands.Any(mb => dealerBrandIds.Contains(mb.BrandId));
            var isExpired = material.ExpiresAt.HasValue && material.ExpiresAt.Value <= DateTime.UtcNow;

            if (material.Status != MaterialStatus.Active || isExpired || !hasMatchingBrand)
            {
                throw new ForbiddenAccessException();
            }
        }

        return material;
    }

    private static MaterialStatus ParseCreateStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return MaterialStatus.Active;
        }

        if (Enum.TryParse<MaterialStatus>(status.Trim(), ignoreCase: true, out var parsed)
            && parsed is MaterialStatus.Draft or MaterialStatus.Active or MaterialStatus.Scheduled)
        {
            return parsed;
        }

        throw new ValidationException("Durum yalnızca Taslak (Draft), Aktif (Active) veya Zamanlanmış (Scheduled) olabilir.");
    }

    private static (RecurrenceKind Kind, int? DayOfWeek, int? DayOfMonth, DateTime? ScheduledAt) ParseScheduleFields(
        MaterialStatus status,
        DateTime? scheduledPublishAt,
        string? recurrenceKindRaw,
        int? dayOfWeek,
        int? dayOfMonth)
    {
        if (status != MaterialStatus.Scheduled)
        {
            return (RecurrenceKind.None, null, null, null);
        }

        if (!scheduledPublishAt.HasValue)
        {
            throw new ValidationException("Zamanlanmış doküman için yayın tarihi/saati zorunludur.");
        }

        var scheduledAt = ScheduleRecurrenceHelper.NormalizeUtc(scheduledPublishAt.Value);
        var kind = RecurrenceKind.None;
        if (!string.IsNullOrWhiteSpace(recurrenceKindRaw)
            && Enum.TryParse<RecurrenceKind>(recurrenceKindRaw.Trim(), ignoreCase: true, out var parsedKind))
        {
            kind = parsedKind;
        }
        else if (!string.IsNullOrWhiteSpace(recurrenceKindRaw))
        {
            throw new ValidationException("Geçersiz tekrar türü. None, Weekly veya MonthlyDay kullanın.");
        }

        ScheduleRecurrenceHelper.ValidateRecurrence(kind, dayOfWeek, dayOfMonth);

        if (kind == RecurrenceKind.Weekly)
        {
            dayOfMonth = null;
        }
        else if (kind == RecurrenceKind.MonthlyDay)
        {
            dayOfWeek = null;
        }
        else
        {
            dayOfWeek = null;
            dayOfMonth = null;
        }

        return (kind, dayOfWeek, dayOfMonth, scheduledAt);
    }

    private static DateTime? NormalizeExpiresAt(DateTime? expiresAt)
    {
        if (!expiresAt.HasValue)
        {
            return null;
        }

        return ScheduleRecurrenceHelper.NormalizeUtc(expiresAt.Value);
    }

    private static void EnsureManager(RequestingUser requestingUser)
    {
        if (requestingUser.Role is not ("Admin" or "ContentManager"))
        {
            throw new ForbiddenAccessException();
        }
    }

    private async Task ValidateAsync(
        string title, string description, int categoryId, List<int> brandIds, CancellationToken cancellationToken)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(title))
        {
            errors.Add("Başlık zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            errors.Add("Açıklama zorunludur.");
        }

        var distinctBrandIds = brandIds.Distinct().ToList();
        if (distinctBrandIds.Count == 0)
        {
            errors.Add("En az bir marka seçilmelidir.");
        }

        if (!await _materialRepository.CategoryExistsAsync(categoryId, cancellationToken))
        {
            errors.Add("Seçilen kategori bulunamadı.");
        }

        if (distinctBrandIds.Count > 0)
        {
            var existingBrandIds = await _materialRepository.GetExistingBrandIdsAsync(distinctBrandIds, cancellationToken);
            var missingBrandIds = distinctBrandIds.Except(existingBrandIds).ToList();
            if (missingBrandIds.Count > 0)
            {
                errors.Add($"Geçersiz marka id'leri: {string.Join(", ", missingBrandIds)}.");
            }
        }

        if (errors.Count > 0)
        {
            throw new ValidationException(string.Join(" ", errors));
        }
    }

    private async Task<IReadOnlyCollection<int>> GetDealerBrandIdsOrThrowAsync(
        RequestingUser requestingUser, CancellationToken cancellationToken)
    {
        if (!requestingUser.DealerId.HasValue)
        {
            throw new ForbiddenAccessException();
        }

        return await _materialRepository.GetDealerBrandIdsAsync(requestingUser.DealerId.Value, cancellationToken);
    }

    private static MaterialResponse ToResponse(Material material) => new()
    {
        Id = material.Id,
        Title = material.Title,
        Description = material.Description,
        CategoryId = material.CategoryId,
        CategoryName = material.Category.Name,
        FileName = material.FileName,
        MimeType = material.MimeType,
        FileSize = material.FileSize,
        Status = material.Status.ToString(),
        PublishedAt = material.PublishedAt,
        ExpiresAt = material.ExpiresAt,
        ScheduledPublishAt = material.ScheduledPublishAt,
        RecurrenceKind = material.RecurrenceKind.ToString(),
        RecurrenceDayOfWeek = material.RecurrenceDayOfWeek,
        RecurrenceDayOfMonth = material.RecurrenceDayOfMonth,
        ScheduleTemplateId = material.ScheduleTemplateId,
        CreatedAt = material.CreatedAt,
        UpdatedAt = material.UpdatedAt,
        BrandIds = material.MaterialBrands.Select(mb => mb.BrandId).ToList(),
        BrandNames = material.MaterialBrands.Select(mb => mb.Brand.Name).ToList(),
        Brands = material.MaterialBrands.Select(mb => new MaterialBrandBadgeResponse
        {
            Id = mb.Brand.Id,
            Name = mb.Brand.Name,
            BadgeLabel = string.IsNullOrWhiteSpace(mb.Brand.BadgeLabel) ? mb.Brand.Name : mb.Brand.BadgeLabel,
            BadgeColor = string.IsNullOrWhiteSpace(mb.Brand.BadgeColor) ? "#374151" : mb.Brand.BadgeColor
        }).ToList()
    };
}
