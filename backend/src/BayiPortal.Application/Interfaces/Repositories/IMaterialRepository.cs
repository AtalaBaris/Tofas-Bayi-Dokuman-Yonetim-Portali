using BayiPortal.Core.Entities;

namespace BayiPortal.Application.Interfaces.Repositories;

public interface IMaterialRepository
{
    Task<Material?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<List<Material>> GetListAsync(
        int? categoryId,
        int? brandId,
        string? keyword,
        string? status,
        IReadOnlyCollection<int>? restrictToBrandIds,
        bool excludeExpired,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<int>> GetDealerBrandIdsAsync(int dealerId, CancellationToken cancellationToken = default);

    Task<bool> CategoryExistsAsync(int categoryId, CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<int>> GetExistingBrandIdsAsync(IReadOnlyCollection<int> brandIds, CancellationToken cancellationToken = default);

    Task<Dictionary<int, int>> GetViewedCountsAsync(IReadOnlyCollection<int> materialIds, CancellationToken cancellationToken = default);

    Task<Dictionary<int, int>> GetAudienceCountsAsync(IReadOnlyCollection<int> materialIds, CancellationToken cancellationToken = default);

    void Add(Material material);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
