using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Exceptions;

namespace BayiPortal.Application.Services;

public sealed class DealerService : IDealerService
{
    private readonly IDealerRepository _dealerRepository;

    public DealerService(IDealerRepository dealerRepository)
    {
        _dealerRepository = dealerRepository;
    }

    public async Task<List<DealerResponse>> GetListAsync(CancellationToken cancellationToken = default)
    {
        var dealers = await _dealerRepository.GetListAsync(cancellationToken);
        return dealers.Select(ToResponse).ToList();
    }

    public async Task<DealerResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var dealer = await _dealerRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DealerNotFoundException(id);
        return ToResponse(dealer);
    }

    public async Task<DealerResponse> CreateAsync(CreateDealerRequest request, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Name, request.Code, request.BrandIds, excludeId: null, cancellationToken);

        var dealer = new Dealer
        {
            Name = request.Name,
            Code = request.Code,
            IsActive = true,
            DealerBrands = request.BrandIds.Distinct().Select(brandId => new DealerBrand { BrandId = brandId }).ToList()
        };

        _dealerRepository.Add(dealer);
        await _dealerRepository.SaveChangesAsync(cancellationToken);

        var saved = await _dealerRepository.GetByIdAsync(dealer.Id, cancellationToken)
            ?? throw new DealerNotFoundException(dealer.Id);
        return ToResponse(saved);
    }

    public async Task<DealerResponse> UpdateAsync(int id, UpdateDealerRequest request, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Name, request.Code, request.BrandIds, excludeId: id, cancellationToken);

        var dealer = await _dealerRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DealerNotFoundException(id);

        dealer.Name = request.Name;
        dealer.Code = request.Code;
        dealer.IsActive = request.IsActive;

        dealer.DealerBrands.Clear();
        foreach (var brandId in request.BrandIds.Distinct())
        {
            dealer.DealerBrands.Add(new DealerBrand { DealerId = id, BrandId = brandId });
        }

        await _dealerRepository.SaveChangesAsync(cancellationToken);

        var saved = await _dealerRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DealerNotFoundException(id);
        return ToResponse(saved);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var dealer = await _dealerRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DealerNotFoundException(id);

        dealer.IsActive = false;
        await _dealerRepository.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateAsync(
        string name, string code, List<int> brandIds, int? excludeId, CancellationToken cancellationToken)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors.Add("Bayi adı zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            errors.Add("Bayi kodu zorunludur.");
        }
        else if (await _dealerRepository.CodeExistsAsync(code, excludeId, cancellationToken))
        {
            errors.Add("Bu bayi kodu zaten kullanılıyor.");
        }

        var distinctBrandIds = brandIds.Distinct().ToList();
        if (distinctBrandIds.Count > 0)
        {
            var existingBrandIds = await _dealerRepository.GetExistingBrandIdsAsync(distinctBrandIds, cancellationToken);
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

    private static DealerResponse ToResponse(Dealer dealer) => new()
    {
        Id = dealer.Id,
        Name = dealer.Name,
        Code = dealer.Code,
        IsActive = dealer.IsActive,
        BrandIds = dealer.DealerBrands.Select(db => db.BrandId).ToList(),
        BrandNames = dealer.DealerBrands.Select(db => db.Brand.Name).ToList()
    };
}
