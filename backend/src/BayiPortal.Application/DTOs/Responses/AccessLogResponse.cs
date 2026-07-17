namespace BayiPortal.Application.DTOs.Responses;

public class AccessLogResponse
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string UserType { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LoginStatus { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
}
