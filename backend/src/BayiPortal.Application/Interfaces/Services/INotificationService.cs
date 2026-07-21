using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Enums;

namespace BayiPortal.Application.Interfaces.Services;

public interface INotificationService
{
    Task<List<NotificationResponse>> GetMineAsync(int userId, CancellationToken cancellationToken = default);

    Task MarkReadAsync(int notificationId, int userId, CancellationToken cancellationToken = default);

    Task MarkAllReadAsync(int userId, CancellationToken cancellationToken = default);

    Task NotifyDealerUsersForMaterialAsync(Material material, CancellationToken cancellationToken = default);
}
