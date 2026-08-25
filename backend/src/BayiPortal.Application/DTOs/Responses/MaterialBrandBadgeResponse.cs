namespace BayiPortal.Application.DTOs.Responses;

/// <summary>Materyal üzerindeki marka badge bilgisi.</summary>
public class MaterialBrandBadgeResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string BadgeLabel { get; set; } = string.Empty;
    public string BadgeColor { get; set; } = "#374151";
}
