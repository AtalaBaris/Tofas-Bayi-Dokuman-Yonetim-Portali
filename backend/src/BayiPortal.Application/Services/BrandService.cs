using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Exceptions;

namespace BayiPortal.Application.Services;

public sealed class BrandService : IBrandService
{
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
        await ValidateAsync(request.Name, request.Code, excludeId: null, cancellationToken);

        var brand = new Brand
        {
            Name = request.Name,
            Code = request.Code,
            IsActive = true
        };

        _brandRepository.Add(brand);
        await _brandRepository.SaveChangesAsync(cancellationToken);

        return ToResponse(brand);
    }

    public async Task<BrandResponse> UpdateAsync(int id, UpdateBrandRequest request, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Name, request.Code, excludeId: id, cancellationToken);

        var brand = await _brandRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new BrandNotFoundException(id);

        brand.Name = request.Name;
        brand.Code = request.Code;
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

    private async Task ValidateAsync(string name, string code, int? excludeId, CancellationToken cancellationToken)
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

        if (errors.Count > 0)
        {
            throw new ValidationException(string.Join(" ", errors));
        }
    }

    private static BrandResponse ToResponse(Brand brand) => new()
    {
        Id = brand.Id,
        Name = brand.Name,
        Code = brand.Code,
        IsActive = brand.IsActive
    };
}
