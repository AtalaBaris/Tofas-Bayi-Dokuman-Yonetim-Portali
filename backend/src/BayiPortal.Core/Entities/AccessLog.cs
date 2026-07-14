// AccessLogs: VIEW/DOWNLOAD denetim izi (UserId, MaterialId, UTC, IP, UserAgent).
namespace BayiPortal.Core.Entities;

public class AccessLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int MaterialId { get; set; }
    public string Action { get; set; } = string.Empty;
    public DateTime ViewedAtUtc { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? UserAgent { get; set; }

    public User User { get; set; } = null!;
    public Material Material { get; set; } = null!;
}
