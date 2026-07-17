using BayiPortal.Core.Entities;

namespace BayiPortal.Application.Interfaces.Repositories;

public interface IBrandRepository
{
    Task<Brand?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<List<Brand>> GetListAsync(CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default);

    void Add(Brand brand);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
