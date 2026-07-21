using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Enums;
using BayiPortal.Core.Exceptions;

namespace BayiPortal.Application.Services;

public sealed class MaterialService : IMaterialService
{
    private const string DealerUserRole = "DealerUser";

    private readonly IMaterialRepository _materialRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IAccessLogService _accessLogService;

    public MaterialService(
        IMaterialRepository materialRepository,
        IFileStorageService fileStorageService,
        IAccessLogService accessLogService)
    {
        _materialRepository = materialRepository;
        _fileStorageService = fileStorageService;
        _accessLogService = accessLogService;
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
            // Bayi kullanıcısı yalnızca yayınlanmış içeriği görebilir; status filtresi görmezden gelinir.
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
        await _accessLogService.LogAsync(requestingUser.UserId, null, id, "Döküman Görüntüleme", $"\"{material.Title}\" dökümanı görüntülendi.", "N/A", cancellationToken);
        var response = ToResponse(material);
        await ApplyCoverageCountsAsync(new List<MaterialResponse> { response }, cancellationToken);
        return response;
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
        CreateMaterialRequest request, Stream fileContent, string originalFileName, string mimeType, long fileSize,
        RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Title, request.Description, request.CategoryId, request.BrandIds, cancellationToken);

        var (storedFileName, relativePath) = await _fileStorageService.SaveAsync(fileContent, originalFileName, cancellationToken);

        var material = new Material
        {
            Title = request.Title,
            Description = request.Description,
            CategoryId = request.CategoryId,
            FileName = originalFileName,
            StoredFileName = storedFileName,
            FilePath = relativePath,
            MimeType = mimeType,
            FileSize = fileSize,
            Status = MaterialStatus.Active,
            PublishedAt = DateTime.UtcNow,
            ExpiresAt = request.ExpiresAt,
            CreatedBy = requestingUser.UserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            MaterialBrands = request.BrandIds.Distinct().Select(brandId => new MaterialBrand { BrandId = brandId }).ToList()
        };

        _materialRepository.Add(material);
        await _materialRepository.SaveChangesAsync(cancellationToken);

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
        material.Version += 1;

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
        CreatedAt = material.CreatedAt,
        UpdatedAt = material.UpdatedAt,
        BrandIds = material.MaterialBrands.Select(mb => mb.BrandId).ToList(),
        BrandNames = material.MaterialBrands.Select(mb => mb.Brand.Name).ToList(),
        CreatedByName = material.Creator.Name
    };
}
