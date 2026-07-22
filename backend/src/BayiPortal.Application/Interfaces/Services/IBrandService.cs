using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;

namespace BayiPortal.Application.Interfaces.Services;

public interface IBrandService
{
    Task<List<BrandResponse>> GetListAsync(CancellationToken cancellationToken = default);

    Task<BrandResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<BrandResponse> CreateAsync(CreateBrandRequest request, CancellationToken cancellationToken = default);

    Task<BrandResponse> UpdateAsync(int id, UpdateBrandRequest request, CancellationToken cancellationToken = default);

    Task DeactivateAsync(int id, CancellationToken cancellationToken = default);
}
