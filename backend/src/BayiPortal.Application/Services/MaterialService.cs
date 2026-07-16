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

    public MaterialService(IMaterialRepository materialRepository, IFileStorageService fileStorageService)
    {
        _materialRepository = materialRepository;
        _fileStorageService = fileStorageService;
    }

    public async Task<List<MaterialResponse>> GetListAsync(
        MaterialListQuery query, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        IReadOnlyCollection<int>? restrictToBrandIds = null;
        var status = query.Status;

        if (requestingUser.Role == DealerUserRole)
        {
            restrictToBrandIds = await GetDealerBrandIdsOrThrowAsync(requestingUser, cancellationToken);
            // Bayi kullanıcısı yalnızca yayınlanmış içeriği görebilir; status filtresi görmezden gelinir.
            status = nameof(MaterialStatus.Active);
        }

        var materials = await _materialRepository.GetListAsync(
            query.CategoryId, query.BrandId, query.Keyword, status, restrictToBrandIds, cancellationToken);

        return materials.Select(ToResponse).ToList();
    }

    public async Task<MaterialResponse> GetByIdAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await GetAuthorizedMaterialAsync(id, requestingUser, cancellationToken);
        return ToResponse(material);
    }

    public async Task<MaterialResponse> CreateAsync(
        CreateMaterialRequest request, Stream fileContent, string originalFileName, string mimeType, long fileSize,
        RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
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

        var saved = await _materialRepository.GetByIdAsync(material.Id, cancellationToken)
            ?? throw new MaterialNotFoundException(material.Id);
        return ToResponse(saved);
    }

    public async Task<MaterialResponse> UpdateAsync(
        int id, UpdateMaterialRequest request, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
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
        return ToResponse(saved);
    }

    public async Task ArchiveAsync(int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await _materialRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new MaterialNotFoundException(id);

        material.Status = MaterialStatus.Archived;
        material.UpdatedAt = DateTime.UtcNow;
        await _materialRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<(Stream Content, string FileName, string MimeType)> GetDownloadStreamAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default)
    {
        var material = await GetAuthorizedMaterialAsync(id, requestingUser, cancellationToken);
        var stream = _fileStorageService.OpenRead(material.FilePath);
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

            if (material.Status != MaterialStatus.Active || !hasMatchingBrand)
            {
                throw new ForbiddenAccessException();
            }
        }

        return material;
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
        CreatedAt = material.CreatedAt,
        UpdatedAt = material.UpdatedAt,
        BrandIds = material.MaterialBrands.Select(mb => mb.BrandId).ToList(),
        BrandNames = material.MaterialBrands.Select(mb => mb.Brand.Name).ToList()
    };
}
