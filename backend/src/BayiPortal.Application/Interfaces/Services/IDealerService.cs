using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;

namespace BayiPortal.Application.Interfaces.Services;

public interface IDealerService
{
    Task<List<DealerResponse>> GetListAsync(CancellationToken cancellationToken = default);

    Task<DealerResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<DealerResponse> CreateAsync(CreateDealerRequest request, CancellationToken cancellationToken = default);

    Task<DealerResponse> UpdateAsync(int id, UpdateDealerRequest request, CancellationToken cancellationToken = default);

    /// <summary>Bayiyi ve bağlı DealerUser kayıtlarını kalıcı siler.</summary>
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Bayiyi pasife alır; bağlı aktif DealerUser'ları da pasife alır.</summary>
    Task DeactivateAsync(int id, CancellationToken cancellationToken = default);
}
