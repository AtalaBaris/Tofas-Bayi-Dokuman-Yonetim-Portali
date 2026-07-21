using BayiPortal.Core.Entities;

namespace BayiPortal.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<List<User>> GetListAsync(CancellationToken cancellationToken = default);

    Task<bool> EmailExistsAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default);

    Task<bool> DealerExistsAsync(int dealerId, CancellationToken cancellationToken = default);

    void Add(User user);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
