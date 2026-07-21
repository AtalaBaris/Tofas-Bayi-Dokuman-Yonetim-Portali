namespace BayiPortal.Application.DTOs.Requests;

public class UpdateBrandRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? BadgeLabel { get; set; }
    public string? BadgeColor { get; set; }
    public bool IsActive { get; set; }
}
