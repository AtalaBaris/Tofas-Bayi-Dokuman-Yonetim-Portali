using BayiPortal.Core.Enums;

namespace BayiPortal.Core.Entities;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public NotificationKind Kind { get; set; } = NotificationKind.Document;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public int? MaterialId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
    public Material? Material { get; set; }
}
