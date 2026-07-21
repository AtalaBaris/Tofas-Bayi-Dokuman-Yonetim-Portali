namespace BayiPortal.Application.DTOs.Responses;

public class NotificationResponse
{
    public int Id { get; set; }
    public string Kind { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public int? MaterialId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
