namespace BayiPortal.Application.DTOs.Requests;

public class UpdateMaterialRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public List<int> BrandIds { get; set; } = new();
    public DateTime? ExpiresAt { get; set; }
}
