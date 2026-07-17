namespace BayiPortal.Application.DTOs.Requests;

public class UpdateDealerRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public List<int> BrandIds { get; set; } = new();
}
