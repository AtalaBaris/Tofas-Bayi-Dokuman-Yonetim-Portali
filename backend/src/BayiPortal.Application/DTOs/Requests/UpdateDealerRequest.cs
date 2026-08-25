namespace BayiPortal.Application.DTOs.Requests;

public class UpdateDealerRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? Phone { get; set; }
    public string? ContactInfo { get; set; }
    public bool IsActive { get; set; }
    public List<int> BrandIds { get; set; } = new();
}
