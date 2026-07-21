using BayiPortal.Core.Entities;

namespace BayiPortal.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<List<User>> GetListAsync(CancellationToken cancellationToken = default);

    Task<bool> EmailExistsAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default);

    Task<bool> DealerExistsAsync(int dealerId, CancellationToken cancellationToken = default);

    /// <summary>Aktif DealerUser sayısı (excludeUserId hariç tutulabilir).</summary>
    Task<int> CountActiveDealerUsersAsync(
        int dealerId, int? excludeUserId = null, CancellationToken cancellationToken = default);

    /// <summary>Bayiye bağlı tüm DealerUser sayısı (aktif/pasif).</summary>
    Task<int> CountDealerUsersAsync(int dealerId, CancellationToken cancellationToken = default);

    Task<Dictionary<int, int>> GetActiveDealerUserCountsAsync(CancellationToken cancellationToken = default);

    Task DeactivateDealerUsersAsync(int dealerId, CancellationToken cancellationToken = default);

    Task ReactivateDealerUsersAsync(int dealerId, CancellationToken cancellationToken = default);

    Task<List<User>> GetDealerUsersAsync(int dealerId, CancellationToken cancellationToken = default);

    Task<bool> AnyMaterialsCreatedByAsync(
        IReadOnlyCollection<int> userIds, CancellationToken cancellationToken = default);

    void RemoveRange(IEnumerable<User> users);

    void Remove(User user);

    void Add(User user);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
