using BayiPortal.Core.Entities;

namespace BayiPortal.Application.Interfaces.Repositories;

public interface IDealerRepository
{
    Task<Dealer?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<List<Dealer>> GetListAsync(CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<int>> GetExistingBrandIdsAsync(
        IReadOnlyCollection<int> brandIds, CancellationToken cancellationToken = default);

    void Add(Dealer dealer);

    void Remove(Dealer dealer);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
