namespace BayiPortal.Application.DTOs.Responses;

public class UserResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? DealerId { get; set; }
    public string? DealerName { get; set; }
    public bool IsActive { get; set; }
    public string? Phone { get; set; }
    public bool EmailNotifications { get; set; } = true;
    public bool DocumentAlerts { get; set; } = true;
    public bool ExpiryReminders { get; set; } = true;
}
