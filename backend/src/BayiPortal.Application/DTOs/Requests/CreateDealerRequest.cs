namespace BayiPortal.Application.DTOs.Requests;

public class CreateDealerRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public List<int> BrandIds { get; set; } = new();
}
