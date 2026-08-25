namespace BayiPortal.Application.DTOs.Responses;

public class BrandResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string BadgeLabel { get; set; } = string.Empty;
    public string BadgeColor { get; set; } = "#374151";
    public bool IsActive { get; set; }
}
