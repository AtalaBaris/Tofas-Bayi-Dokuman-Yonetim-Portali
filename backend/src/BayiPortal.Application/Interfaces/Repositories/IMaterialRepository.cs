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
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<int>> GetDealerBrandIdsAsync(int dealerId, CancellationToken cancellationToken = default);

    void Add(Material material);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
