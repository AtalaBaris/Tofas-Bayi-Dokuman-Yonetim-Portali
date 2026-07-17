using BayiPortal.Core.Entities;

namespace BayiPortal.Application.Interfaces.Repositories;

public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<List<Category>> GetListAsync(CancellationToken cancellationToken = default);

    void Add(Category category);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
