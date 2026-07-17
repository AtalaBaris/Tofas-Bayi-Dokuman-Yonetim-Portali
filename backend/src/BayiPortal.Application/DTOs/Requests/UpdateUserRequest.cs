namespace BayiPortal.Application.DTOs.Requests;

public class UpdateUserRequest
{
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? DealerId { get; set; }
    public bool IsActive { get; set; }
}
