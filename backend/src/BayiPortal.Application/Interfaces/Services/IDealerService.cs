using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;

namespace BayiPortal.Application.Interfaces.Services;

public interface IDealerService
{
    Task<List<DealerResponse>> GetListAsync(CancellationToken cancellationToken = default);

    Task<DealerResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<DealerResponse> CreateAsync(CreateDealerRequest request, CancellationToken cancellationToken = default);

    Task<DealerResponse> UpdateAsync(int id, UpdateDealerRequest request, CancellationToken cancellationToken = default);

    Task DeactivateAsync(int id, CancellationToken cancellationToken = default);
}
