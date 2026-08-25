using BayiPortal.Core.Entities;

namespace BayiPortal.Application.Interfaces.Repositories;

public interface INotificationRepository
{
    Task<List<Notification>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);

    void AddRange(IEnumerable<Notification> notifications);

    Task<Notification?> GetByIdForUserAsync(int id, int userId, CancellationToken cancellationToken = default);

    Task MarkAllReadAsync(int userId, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
