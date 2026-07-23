namespace BayiPortal.Application.DTOs.Responses;

public class MaterialAccessReportResponse
{
    public int MaterialId { get; set; }
    public string MaterialTitle { get; set; } = string.Empty;
    public int AudienceCount { get; set; }
    public int ViewedCount { get; set; }
    public int PendingCount { get; set; }
    public int EngagementPercent { get; set; }
    public List<AccessLogResponse> AccessLogs { get; set; } = new();
    public List<PendingUserResponse> PendingUsers { get; set; } = new();
}

public class PendingUserResponse
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DealerName { get; set; } = string.Empty;
}
