using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Core.Entities;

namespace BayiPortal.Application.Interfaces.Services;

public interface INotificationService
{
    Task<List<NotificationResponse>> GetMyNotificationsAsync(int userId, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(int userId, int notificationId, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default);
    Task NotifyDealerUsersForMaterialAsync(Material material, CancellationToken cancellationToken = default);
}
