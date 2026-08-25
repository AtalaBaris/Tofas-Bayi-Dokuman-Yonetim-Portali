using System.Text.RegularExpressions;
using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Exceptions;

namespace BayiPortal.Application.Services;

public sealed class BrandService : IBrandService
{
    private static readonly Regex HexColorRegex = new(
        "^#([0-9A-Fa-f]{6})$", RegexOptions.Compiled);

    private readonly IBrandRepository _brandRepository;

    public BrandService(IBrandRepository brandRepository)
    {
        _brandRepository = brandRepository;
    }

    public async Task<List<BrandResponse>> GetListAsync(CancellationToken cancellationToken = default)
    {
        var brands = await _brandRepository.GetListAsync(cancellationToken);
        return brands.Select(ToResponse).ToList();
    }

    public async Task<BrandResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var brand = await _brandRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new BrandNotFoundException(id);
        return ToResponse(brand);
    }

    public async Task<BrandResponse> CreateAsync(CreateBrandRequest request, CancellationToken cancellationToken = default)
    {
        var badge = ResolveBadge(request.Name, request.BadgeLabel, request.BadgeColor);
        await ValidateAsync(request.Name, request.Code, badge.Color, excludeId: null, cancellationToken);

        var brand = new Brand
        {
            Name = request.Name.Trim(),
            Code = request.Code.Trim(),
            BadgeLabel = badge.Label,
            BadgeColor = badge.Color,
            IsActive = true
        };

        _brandRepository.Add(brand);
        await _brandRepository.SaveChangesAsync(cancellationToken);

        return ToResponse(brand);
    }

    public async Task<BrandResponse> UpdateAsync(int id, UpdateBrandRequest request, CancellationToken cancellationToken = default)
    {
        var badge = ResolveBadge(request.Name, request.BadgeLabel, request.BadgeColor);
        await ValidateAsync(request.Name, request.Code, badge.Color, excludeId: id, cancellationToken);

        var brand = await _brandRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new BrandNotFoundException(id);

        brand.Name = request.Name.Trim();
        brand.Code = request.Code.Trim();
        brand.BadgeLabel = badge.Label;
        brand.BadgeColor = badge.Color;
        brand.IsActive = request.IsActive;

        await _brandRepository.SaveChangesAsync(cancellationToken);

        return ToResponse(brand);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var brand = await _brandRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new BrandNotFoundException(id);

        brand.IsActive = false;
        await _brandRepository.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateAsync(
        string name, string code, string badgeColor, int? excludeId, CancellationToken cancellationToken)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors.Add("Marka adı zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            errors.Add("Marka kodu zorunludur.");
        }
        else if (await _brandRepository.CodeExistsAsync(code, excludeId, cancellationToken))
        {
            errors.Add("Bu marka kodu zaten kullanılıyor.");
        }

        if (!HexColorRegex.IsMatch(badgeColor))
        {
            errors.Add("Badge rengi #RRGGBB formatında olmalıdır (ör. #1E3A8A).");
        }

        if (errors.Count > 0)
        {
            throw new ValidationException(string.Join(" ", errors));
        }
    }

    private static (string Label, string Color) ResolveBadge(string name, string? badgeLabel, string? badgeColor)
    {
        var label = string.IsNullOrWhiteSpace(badgeLabel) ? name.Trim() : badgeLabel.Trim();
        if (label.Length > 50)
        {
            label = label[..50];
        }

        var color = string.IsNullOrWhiteSpace(badgeColor) ? "#374151" : badgeColor.Trim().ToUpperInvariant();
        return (label, color);
    }

    private static BrandResponse ToResponse(Brand brand) => new()
    {
        Id = brand.Id,
        Name = brand.Name,
        Code = brand.Code,
        BadgeLabel = string.IsNullOrWhiteSpace(brand.BadgeLabel) ? brand.Name : brand.BadgeLabel,
        BadgeColor = string.IsNullOrWhiteSpace(brand.BadgeColor) ? "#374151" : brand.BadgeColor,
        IsActive = brand.IsActive
    };
}
