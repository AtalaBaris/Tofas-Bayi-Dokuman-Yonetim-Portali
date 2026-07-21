using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Enums;
using BayiPortal.Core.Exceptions;

namespace BayiPortal.Application.Services;

public sealed class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IMaterialRepository _materialRepository;

    public NotificationService(
        INotificationRepository notificationRepository,
        IMaterialRepository materialRepository)
    {
        _notificationRepository = notificationRepository;
        _materialRepository = materialRepository;
    }

    public async Task<List<NotificationResponse>> GetMineAsync(int userId, CancellationToken cancellationToken = default)
    {
        var items = await _notificationRepository.GetByUserIdAsync(userId, cancellationToken);
        return items.Select(ToResponse).ToList();
    }

    public async Task MarkReadAsync(int notificationId, int userId, CancellationToken cancellationToken = default)
    {
        var notification = await _notificationRepository.GetByIdForUserAsync(notificationId, userId, cancellationToken)
            ?? throw new ValidationException("Bildirim bulunamadı.");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _notificationRepository.SaveChangesAsync(cancellationToken);
        }
    }

    public Task MarkAllReadAsync(int userId, CancellationToken cancellationToken = default) =>
        _notificationRepository.MarkAllReadAsync(userId, cancellationToken);

    public async Task NotifyDealerUsersForMaterialAsync(Material material, CancellationToken cancellationToken = default)
    {
        var brandIds = material.MaterialBrands.Select(mb => mb.BrandId).Distinct().ToList();
        var userIds = await _materialRepository.GetActiveDealerUserIdsForBrandsAsync(brandIds, cancellationToken);
        if (userIds.Count == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var notifications = userIds.Select(userId => new Notification
        {
            UserId = userId,
            Kind = NotificationKind.Document,
            Title = "Yeni doküman yayınlandı",
            Body = $"\"{material.Title}\" adlı doküman yayında.",
            MaterialId = material.Id,
            IsRead = false,
            CreatedAt = now
        });

        _notificationRepository.AddRange(notifications);
        await _notificationRepository.SaveChangesAsync(cancellationToken);
    }

    private static NotificationResponse ToResponse(Notification n) => new()
    {
        Id = n.Id,
        Kind = n.Kind.ToString().ToLowerInvariant(),
        Title = n.Title,
        Body = n.Body,
        MaterialId = n.MaterialId,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt
    };
}
