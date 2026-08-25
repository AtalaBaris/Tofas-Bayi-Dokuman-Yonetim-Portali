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
    private readonly IUserRepository _userRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IFileUploadPolicy _fileUploadPolicy;
    private readonly IAccessLogService _accessLogService;
    private readonly INotificationService _notificationService;
    private readonly IExportService _exportService;

    public MaterialService(
        IMaterialRepository materialRepository,
        IUserRepository userRepository,
        IFileStorageService fileStorageService,
        IFileUploadPolicy fileUploadPolicy,
        IAccessLogService accessLogService,
        INotificationService notificationService,
        IExportService exportService)
    {
        _materialRepository = materialRepository;
        _userRepository = userRepository;
        _fileStorageService = fileStorageService;
        _fileUploadPolicy = fileUploadPolicy;
        _accessLogService = accessLogService;
        _notificationService = notificationService;
        _exportService = exportService;
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

        if (responses.Count > 0)
        {
            await ApplyCoverageCountsAsync(responses, cancellationToken);
        }

        return responses;
    }

    public async Task<MaterialResponse> GetByIdAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await GetAuthorizedMaterialAsync(id, requestingUser, cancellationToken);
        await _accessLogService.LogAsync(requestingUser.UserId, null, id, AccessAction.View, $"\"{material.Title}\" dökümanı görüntülendi.", AccessResult.NotApplicable, cancellationToken);
        var response = ToResponse(material);
        await ApplyCoverageCountsAsync(new List<MaterialResponse> { response }, cancellationToken);
        return response;
    }

    public async Task<MaterialAccessReportResponse> GetAccessReportAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await GetAuthorizedMaterialAsync(id, requestingUser, cancellationToken);
        var materialBrandIds = material.MaterialBrands.Select(mb => mb.BrandId).ToHashSet();

        var logListRes = await _accessLogService.GetListAsync(new AccessLogListQuery
        {
            MaterialId = id,
            PageSize = 1000
        }, cancellationToken);

        var rawLogs = logListRes.Items
            .Where(l => l.Action == "Döküman Görüntüleme" || l.Action == "Döküman İndirme" || l.Action == "VIEW" || l.Action == "DOWNLOAD")
            .ToList();

        var viewedUserIdentifiers = rawLogs
            .Select(l => l.UserName.ToLowerInvariant())
            .ToHashSet();

        var allUsers = await _userRepository.GetListAsync(cancellationToken);
        var eligibleUsers = allUsers
            .Where(u => u.IsActive && u.Role == RoleType.DealerUser && u.Dealer != null)
            .Where(u => u.Dealer!.DealerBrands.Any(db => materialBrandIds.Contains(db.BrandId)))
            .ToList();

        var pendingUsers = eligibleUsers
            .Where(u => !viewedUserIdentifiers.Contains(u.Email.ToLowerInvariant()) && !viewedUserIdentifiers.Contains(u.Name.ToLowerInvariant()))
            .Select(u => new PendingUserResponse
            {
                UserId = u.Id,
                UserName = u.Name,
                Email = u.Email,
                DealerName = u.Dealer?.Name ?? "Bayi"
            })
            .ToList();

        var distinctViewedUserCount = eligibleUsers.Count(u => viewedUserIdentifiers.Contains(u.Email.ToLowerInvariant()) || viewedUserIdentifiers.Contains(u.Name.ToLowerInvariant()));
        if (distinctViewedUserCount == 0 && rawLogs.Count > 0)
        {
            distinctViewedUserCount = rawLogs.Select(l => l.UserName.ToLowerInvariant()).Distinct().Count();
        }

        var audienceCount = eligibleUsers.Count > 0 ? eligibleUsers.Count : (distinctViewedUserCount + pendingUsers.Count);
        var pendingCount = Math.Max(0, audienceCount - distinctViewedUserCount);
        var engagementPercent = audienceCount > 0 ? (int)Math.Round((double)distinctViewedUserCount / audienceCount * 100) : 0;

        return new MaterialAccessReportResponse
        {
            MaterialId = material.Id,
            MaterialTitle = material.Title,
            AudienceCount = audienceCount,
            ViewedCount = distinctViewedUserCount,
            PendingCount = pendingCount,
            EngagementPercent = engagementPercent,
            AccessLogs = rawLogs,
            PendingUsers = pendingUsers
        };
    }

    public async Task<(byte[] Content, string FileName, string MimeType)> ExportAccessReportAsync(
        int id, RequestingUser requestingUser, string format, CancellationToken cancellationToken = default)
    {
        var report = await GetAccessReportAsync(id, requestingUser, cancellationToken);
        return _exportService.ExportAccessReport(report, format);
    }

    private async Task ApplyCoverageCountsAsync(List<MaterialResponse> responses, CancellationToken cancellationToken)
    {
        var materialIds = responses.Select(r => r.Id).ToList();
        var viewedCounts = await _materialRepository.GetViewedCountsAsync(materialIds, cancellationToken);
        var audienceCounts = await _materialRepository.GetAudienceCountsAsync(materialIds, cancellationToken);

        foreach (var response in responses)
        {
            response.ViewedCount = viewedCounts.GetValueOrDefault(response.Id);
            response.AudienceCount = audienceCounts.GetValueOrDefault(response.Id);
        }
    }

    public async Task<MaterialResponse> CreateAsync(
        CreateMaterialRequest request, IReadOnlyList<UploadedFileContent> files,
        RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Title, request.Description, request.CategoryId, request.BrandIds, cancellationToken);

        if (files.Count == 0)
        {
            throw new ValidationException("En az bir dosya yüklenmelidir.");
        }

        foreach (var file in files)
        {
            _fileUploadPolicy.ValidateOrThrow(file.OriginalFileName, file.MimeType, file.FileSize);
        }

        var status = ParseCreateStatus(request.Status);
        var (recurrenceKind, dayOfWeek, dayOfMonth, scheduledAt) = ParseScheduleFields(
            status, request.ScheduledPublishAt, request.RecurrenceKind,
            request.RecurrenceDayOfWeek, request.RecurrenceDayOfMonth);

        var now = DateTime.UtcNow;
        var materialFiles = new List<MaterialFile>();
        for (var index = 0; index < files.Count; index++)
        {
            var file = files[index];
            var (storedFileName, relativePath) = await _fileStorageService.SaveAsync(file.Content, file.OriginalFileName, cancellationToken);
            materialFiles.Add(new MaterialFile
            {
                FileName = file.OriginalFileName,
                StoredFileName = storedFileName,
                FilePath = relativePath,
                MimeType = file.MimeType,
                FileSize = file.FileSize,
                SortOrder = index,
                CreatedAt = now
            });
        }

        var firstFile = materialFiles[0];
        var material = new Material
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            CategoryId = request.CategoryId,
            FileName = firstFile.FileName,
            StoredFileName = firstFile.StoredFileName,
            FilePath = firstFile.FilePath,
            MimeType = firstFile.MimeType,
            FileSize = firstFile.FileSize,
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
            MaterialBrands = request.BrandIds.Distinct().Select(brandId => new MaterialBrand { BrandId = brandId }).ToList(),
            Files = materialFiles
        };

        material.Versions.Add(new MaterialVersion
        {
            VersionLabel = "v1.0",
            VersionNumber = 1,
            Title = material.Title,
            ChangeNote = "İlk sürüm yüklendi.",
            FileName = firstFile.FileName,
            StoredFileName = firstFile.StoredFileName,
            FilePath = firstFile.FilePath,
            MimeType = firstFile.MimeType,
            FileSize = firstFile.FileSize,
            CreatedBy = requestingUser.UserId,
            CreatedAt = now
        });

        _materialRepository.Add(material);
        await _materialRepository.SaveChangesAsync(cancellationToken);

        if (status == MaterialStatus.Active)
        {
            var savedForNotify = await _materialRepository.GetByIdAsync(material.Id, cancellationToken)
                ?? throw new MaterialNotFoundException(material.Id);
            await _notificationService.NotifyDealerUsersForMaterialAsync(savedForNotify, cancellationToken);
        }

        await _accessLogService.LogAsync(requestingUser.UserId, null, material.Id, AccessAction.Upload, $"\"{material.Title}\" dökümanı yüklendi.", AccessResult.NotApplicable, cancellationToken);

        var saved = await _materialRepository.GetByIdAsync(material.Id, cancellationToken)
            ?? throw new MaterialNotFoundException(material.Id);
        return ToResponse(saved);
    }

    public async Task<MaterialResponse> UpdateAsync(
        int id, UpdateMaterialRequest request, IReadOnlyList<UploadedFileContent>? newFiles, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Title, request.Description, request.CategoryId, request.BrandIds, cancellationToken);

        var material = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        material.Title = request.Title;
        material.Description = request.Description;
        material.CategoryId = request.CategoryId;
        material.ExpiresAt = request.ExpiresAt;
        material.UpdatedAt = DateTime.UtcNow;

        if (newFiles != null && newFiles.Count > 0)
        {
            foreach (var file in newFiles)
            {
                _fileUploadPolicy.ValidateOrThrow(file.OriginalFileName, file.MimeType, file.FileSize);
            }

            material.Files.Clear();

            var now = DateTime.UtcNow;
            var materialFiles = new List<MaterialFile>();
            for (var index = 0; index < newFiles.Count; index++)
            {
                var file = newFiles[index];
                var (storedFileName, relativePath) = await _fileStorageService.SaveAsync(file.Content, file.OriginalFileName, cancellationToken);
                materialFiles.Add(new MaterialFile
                {
                    FileName = file.OriginalFileName,
                    StoredFileName = storedFileName,
                    FilePath = relativePath,
                    MimeType = file.MimeType,
                    FileSize = file.FileSize,
                    SortOrder = index,
                    CreatedAt = now
                });
            }

            var firstFile = materialFiles[0];
            material.FileName = firstFile.FileName;
            material.StoredFileName = firstFile.StoredFileName;
            material.FilePath = firstFile.FilePath;
            material.MimeType = firstFile.MimeType;
            material.FileSize = firstFile.FileSize;
            
            material.Files = materialFiles;
            material.Version += 1;
        }

        material.MaterialBrands.Clear();
        foreach (var brandId in request.BrandIds.Distinct())
        {
            material.MaterialBrands.Add(new MaterialBrand { MaterialId = id, BrandId = brandId });
        }

        await _materialRepository.SaveChangesAsync(cancellationToken);

        var saved = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        await _accessLogService.LogAsync(requestingUser.UserId, null, id, AccessAction.Update, $"\"{saved.Title}\" dökümanı güncellendi.", AccessResult.NotApplicable, cancellationToken);

        return ToResponse(saved);
    }

    public async Task<MaterialResponse> AddFilesAsync(
        int id, IReadOnlyList<UploadedFileContent> files, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        if (files.Count == 0)
        {
            throw new ValidationException("En az bir dosya yüklenmelidir.");
        }

        foreach (var file in files)
        {
            _fileUploadPolicy.ValidateOrThrow(file.OriginalFileName, file.MimeType, file.FileSize);
        }

        var material = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        var now = DateTime.UtcNow;
        var nextSortOrder = material.Files.Count == 0 ? 0 : material.Files.Max(f => f.SortOrder) + 1;
        foreach (var file in files)
        {
            var (storedFileName, relativePath) = await _fileStorageService.SaveAsync(file.Content, file.OriginalFileName, cancellationToken);
            material.Files.Add(new MaterialFile
            {
                MaterialId = id,
                FileName = file.OriginalFileName,
                StoredFileName = storedFileName,
                FilePath = relativePath,
                MimeType = file.MimeType,
                FileSize = file.FileSize,
                SortOrder = nextSortOrder++,
                CreatedAt = now
            });
        }

        SyncPrimaryFileFields(material);
        material.Version += 1;
        material.UpdatedAt = now;

        await _materialRepository.SaveChangesAsync(cancellationToken);

        var saved = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        await _accessLogService.LogAsync(requestingUser.UserId, null, id, AccessAction.VersionChange, $"\"{saved.Title}\" dökümanına yeni dosya eklendi (v{saved.Version}).", AccessResult.NotApplicable, cancellationToken);

        return ToResponse(saved);
    }

    public async Task<MaterialResponse> DeleteFileAsync(
        int id, int fileId, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        var file = material.Files.FirstOrDefault(f => f.Id == fileId)
            ?? throw new MaterialFileNotFoundException(id, fileId);

        if (material.Files.Count <= 1)
        {
            throw new ValidationException("Bir dokümanın en az bir dosyası olmalıdır.");
        }

        material.Files.Remove(file);
        SyncPrimaryFileFields(material);
        material.Version += 1;
        material.UpdatedAt = DateTime.UtcNow;

        await _materialRepository.SaveChangesAsync(cancellationToken);

        _fileStorageService.Delete(file.FilePath);

        var saved = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        await _accessLogService.LogAsync(requestingUser.UserId, null, id, AccessAction.VersionChange, $"\"{saved.Title}\" dökümanından \"{file.FileName}\" dosyası kaldırıldı (v{saved.Version}).", AccessResult.NotApplicable, cancellationToken);

        return ToResponse(saved);
    }

    private static void SyncPrimaryFileFields(Material material)
    {
        var firstFile = material.Files.OrderBy(f => f.SortOrder).First();
        material.FileName = firstFile.FileName;
        material.StoredFileName = firstFile.StoredFileName;
        material.FilePath = firstFile.FilePath;
        material.MimeType = firstFile.MimeType;
        material.FileSize = firstFile.FileSize;
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

        await _accessLogService.LogAsync(requestingUser.UserId, null, id, AccessAction.Archive, $"\"{material.Title}\" dökümanı arşivlendi.", AccessResult.NotApplicable, cancellationToken);
    }

    public async Task<(Stream Content, string FileName, string MimeType)> GetDownloadStreamAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await GetAuthorizedMaterialAsync(id, requestingUser, cancellationToken);
        var primaryFile = material.Files.OrderBy(f => f.SortOrder).FirstOrDefault();
        var stream = primaryFile is not null
            ? _fileStorageService.OpenRead(primaryFile.FilePath)
            : _fileStorageService.OpenRead(material.FilePath);
        var fileName = primaryFile?.FileName ?? material.FileName;
        var mimeType = primaryFile?.MimeType ?? material.MimeType;
        await _accessLogService.LogAsync(
            requestingUser.UserId, null, id, AccessAction.Download, $"\"{material.Title}\" dökümanı indirildi.", AccessResult.NotApplicable,
            cancellationToken, primaryFile?.Id);
        return (stream, fileName, mimeType);
    }

    public async Task<(Stream Content, string FileName, string MimeType)> GetFileDownloadStreamAsync(
        int id, int fileId, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await GetAuthorizedMaterialAsync(id, requestingUser, cancellationToken);
        var file = material.Files.FirstOrDefault(f => f.Id == fileId)
            ?? throw new MaterialFileNotFoundException(id, fileId);

        var stream = _fileStorageService.OpenRead(file.FilePath);
        await _accessLogService.LogAsync(
            requestingUser.UserId, null, id, AccessAction.Download, $"\"{material.Title}\" dökümanı indirildi.", AccessResult.NotApplicable,
            cancellationToken, file.Id);
        return (stream, file.FileName, file.MimeType);
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

    public async Task<MaterialResponse> CreateScheduledCopyAsync(
        int sourceId, UpdateMaterialScheduleRequest request, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        EnsureManager(requestingUser);
        var source = await _materialRepository.GetByIdAsync(sourceId, cancellationToken)
            ?? throw new MaterialNotFoundException(sourceId);

        if (source.Status is MaterialStatus.Archived)
        {
            throw new ValidationException("Arşivlenmiş dokümandan takvim kopyası oluşturulamaz.");
        }

        var (recurrenceKind, dayOfWeek, dayOfMonth, scheduledAt) = ParseScheduleFields(
            MaterialStatus.Scheduled, request.ScheduledPublishAt, request.RecurrenceKind,
            request.RecurrenceDayOfWeek, request.RecurrenceDayOfMonth);

        var now = DateTime.UtcNow;
        var brandIds = source.MaterialBrands.Select(mb => mb.BrandId).ToList();
        var templateId = source.ScheduleTemplateId ?? source.Id;
        var sourceFiles = source.Files.OrderBy(f => f.SortOrder).ToList();
        var firstSourceFile = sourceFiles.FirstOrDefault();

        var copy = new Material
        {
            Title = source.Title,
            Description = source.Description,
            CategoryId = source.CategoryId,
            FileName = firstSourceFile?.FileName ?? source.FileName,
            StoredFileName = firstSourceFile?.StoredFileName ?? source.StoredFileName,
            FilePath = firstSourceFile?.FilePath ?? source.FilePath,
            MimeType = firstSourceFile?.MimeType ?? source.MimeType,
            FileSize = firstSourceFile?.FileSize ?? source.FileSize,
            Status = MaterialStatus.Scheduled,
            PublishedAt = scheduledAt!.Value,
            ExpiresAt = source.ExpiresAt,
            ScheduledPublishAt = scheduledAt,
            RecurrenceKind = recurrenceKind,
            RecurrenceDayOfWeek = dayOfWeek,
            RecurrenceDayOfMonth = dayOfMonth,
            ScheduleTemplateId = templateId,
            CreatedBy = requestingUser.UserId,
            CreatedAt = now,
            UpdatedAt = now,
            MaterialBrands = brandIds.Select(brandId => new MaterialBrand { BrandId = brandId }).ToList(),
            Files = sourceFiles.Select(f => new MaterialFile
            {
                FileName = f.FileName,
                StoredFileName = f.StoredFileName,
                FilePath = f.FilePath,
                MimeType = f.MimeType,
                FileSize = f.FileSize,
                SortOrder = f.SortOrder,
                CreatedAt = now
            }).ToList()
        };

        _materialRepository.Add(copy);
        await _materialRepository.SaveChangesAsync(cancellationToken);

        var saved = await _materialRepository.GetByIdAsync(copy.Id, cancellationToken)
            ?? throw new MaterialNotFoundException(copy.Id);
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

        // Havuzdan üretilmiş takvim kopyası: arşivle (havuzdaki şablon kalsın).
        // Eski tekil zamanlama: tekrar taslağa düşür.
        if (material.ScheduleTemplateId.HasValue)
        {
            material.Status = MaterialStatus.Archived;
            material.ScheduledPublishAt = null;
            material.RecurrenceKind = RecurrenceKind.None;
            material.RecurrenceDayOfWeek = null;
            material.RecurrenceDayOfMonth = null;
        }
        else
        {
            material.Status = MaterialStatus.Draft;
            // Takvimden çıkarılan doküman "havuz" gibi davranır: yüklenme tarihi (CreatedAt) görünmelidir.
            material.PublishedAt = material.CreatedAt;
            material.ScheduledPublishAt = null;
            material.RecurrenceKind = RecurrenceKind.None;
            material.RecurrenceDayOfWeek = null;
            material.RecurrenceDayOfMonth = null;
        }

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
        var templateFiles = template.Files.OrderBy(f => f.SortOrder).ToList();
        var firstTemplateFile = templateFiles.FirstOrDefault();

        var copy = new Material
        {
            Title = template.Title,
            Description = template.Description,
            CategoryId = template.CategoryId,
            FileName = firstTemplateFile?.FileName ?? template.FileName,
            StoredFileName = firstTemplateFile?.StoredFileName ?? template.StoredFileName,
            FilePath = firstTemplateFile?.FilePath ?? template.FilePath,
            MimeType = firstTemplateFile?.MimeType ?? template.MimeType,
            FileSize = firstTemplateFile?.FileSize ?? template.FileSize,
            Status = MaterialStatus.Active,
            PublishedAt = now,
            ExpiresAt = template.ExpiresAt,
            ScheduleTemplateId = template.Id,
            CreatedBy = template.CreatedBy,
            CreatedAt = now,
            UpdatedAt = now,
            MaterialBrands = brandIds.Select(brandId => new MaterialBrand { BrandId = brandId }).ToList(),
            Files = templateFiles.Select(f => new MaterialFile
            {
                FileName = f.FileName,
                StoredFileName = f.StoredFileName,
                FilePath = f.FilePath,
                MimeType = f.MimeType,
                FileSize = f.FileSize,
                SortOrder = f.SortOrder,
                CreatedAt = now
            }).ToList()
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
        if (scheduledAt <= DateTime.UtcNow)
        {
            throw new ValidationException("Yayın zamanı şu andan ileri bir tarih/saat olmalıdır.");
        }

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
        Version = material.Version,
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
        }).ToList(),
        CreatedByName = material.Creator?.Name ?? string.Empty,
        Files = material.Files.OrderBy(f => f.SortOrder).Select(f => new MaterialFileResponse
        {
            Id = f.Id,
            FileName = f.FileName,
            MimeType = f.MimeType,
            FileSize = f.FileSize,
            SortOrder = f.SortOrder
        }).ToList()
    };

    public async Task<List<MaterialVersionResponse>> GetVersionsAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await GetAuthorizedMaterialAsync(id, requestingUser, cancellationToken);
        var versions = await _materialRepository.GetVersionsAsync(material.Id, cancellationToken);

        if (versions.Count == 0)
        {
            return new List<MaterialVersionResponse>
            {
                new()
                {
                    Id = 0,
                    MaterialId = material.Id,
                    VersionLabel = $"v{material.Version}.0",
                    VersionNumber = material.Version,
                    Title = material.Title,
                    ChangeNote = "İlk sürüm yüklendi.",
                    FileName = material.FileName,
                    FileSize = material.FileSize,
                    MimeType = material.MimeType,
                    CreatedBy = material.CreatedBy,
                    CreatedByName = material.Creator?.Name ?? "Sistem",
                    CreatedAt = material.CreatedAt
                }
            };
        }

        return versions.Select(v => new MaterialVersionResponse
        {
            Id = v.Id,
            MaterialId = v.MaterialId,
            VersionLabel = v.VersionLabel,
            VersionNumber = v.VersionNumber,
            Title = v.Title,
            ChangeNote = v.ChangeNote,
            FileName = v.FileName,
            FileSize = v.FileSize,
            MimeType = v.MimeType,
            CreatedBy = v.CreatedBy,
            CreatedByName = v.Creator?.Name ?? "Sistem",
            CreatedAt = v.CreatedAt
        }).ToList();
    }

    public async Task<MaterialVersionResponse> CreateVersionAsync(
        int id, CreateMaterialVersionRequest request, UploadedFileContent file, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        EnsureManager(requestingUser);
        var material = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        _fileUploadPolicy.ValidateOrThrow(file.OriginalFileName, file.MimeType, file.FileSize);

        var now = DateTime.UtcNow;
        var (storedFileName, relativePath) = await _fileStorageService.SaveAsync(
            file.Content, file.OriginalFileName, cancellationToken);

        var existingVersions = await _materialRepository.GetVersionsAsync(id, cancellationToken);
        var nextVersionNumber = existingVersions.Count > 0 ? existingVersions.Max(v => v.VersionNumber) + 1 : material.Version + 1;
        var versionLabel = string.IsNullOrWhiteSpace(request.VersionLabel) ? $"v{nextVersionNumber}.0" : request.VersionLabel.Trim();

        var version = new MaterialVersion
        {
            MaterialId = id,
            VersionLabel = versionLabel,
            VersionNumber = nextVersionNumber,
            Title = material.Title,
            ChangeNote = string.IsNullOrWhiteSpace(request.ChangeNote) ? "Yeni versiyon yüklendi." : request.ChangeNote.Trim(),
            FileName = file.OriginalFileName,
            StoredFileName = storedFileName,
            FilePath = relativePath,
            MimeType = file.MimeType,
            FileSize = file.FileSize,
            CreatedBy = requestingUser.UserId,
            CreatedAt = now
        };

        _materialRepository.AddVersion(version);

        material.FileName = file.OriginalFileName;
        material.StoredFileName = storedFileName;
        material.FilePath = relativePath;
        material.MimeType = file.MimeType;
        material.FileSize = file.FileSize;
        material.Version = nextVersionNumber;
        material.UpdatedAt = now;

        await _materialRepository.SaveChangesAsync(cancellationToken);

        await _accessLogService.LogAsync(
            requestingUser.UserId, null, id, AccessAction.Update,
            $"\"{material.Title}\" dökümanı {versionLabel} sürümüne güncellendi.", AccessResult.NotApplicable, cancellationToken);

        var savedVersion = await _materialRepository.GetVersionByIdAsync(id, version.Id, cancellationToken)
            ?? version;

        return new MaterialVersionResponse
        {
            Id = savedVersion.Id,
            MaterialId = savedVersion.MaterialId,
            VersionLabel = savedVersion.VersionLabel,
            VersionNumber = savedVersion.VersionNumber,
            Title = savedVersion.Title,
            ChangeNote = savedVersion.ChangeNote,
            FileName = savedVersion.FileName,
            FileSize = savedVersion.FileSize,
            MimeType = savedVersion.MimeType,
            CreatedBy = savedVersion.CreatedBy,
            CreatedByName = savedVersion.Creator?.Name ?? "Sistem",
            CreatedAt = savedVersion.CreatedAt
        };
    }

    public async Task<(Stream Content, string FileName, string MimeType)> GetVersionDownloadStreamAsync(
        int id, int versionId, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await GetAuthorizedMaterialAsync(id, requestingUser, cancellationToken);
        if (versionId == 0)
        {
            return await GetDownloadStreamAsync(id, requestingUser, cancellationToken);
        }

        var version = await _materialRepository.GetVersionByIdAsync(material.Id, versionId, cancellationToken)
            ?? throw new ValidationException("Belirtilen versiyon bulunamadı.");

        var stream = _fileStorageService.OpenRead(version.FilePath);

        await _accessLogService.LogAsync(
            requestingUser.UserId, null, material.Id, AccessAction.Download,
            $"\"{material.Title}\" dökümanının {version.VersionLabel} versiyonu indirildi.", AccessResult.Success, cancellationToken, null);

        return (stream, version.FileName, version.MimeType);
    }
}
