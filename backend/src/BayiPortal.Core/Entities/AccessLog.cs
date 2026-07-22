// AccessLogs: VIEW/DOWNLOAD denetim izi (UserId, MaterialId, UTC, IP, UserAgent).
namespace BayiPortal.Core.Entities;

public class AccessLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public int? MaterialId { get; set; }
    public int? MaterialFileId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? LoginStatus { get; set; }
    public DateTime ViewedAtUtc { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? UserAgent { get; set; }

    public User? User { get; set; }
    public Material? Material { get; set; }
    public MaterialFile? MaterialFile { get; set; }
}
