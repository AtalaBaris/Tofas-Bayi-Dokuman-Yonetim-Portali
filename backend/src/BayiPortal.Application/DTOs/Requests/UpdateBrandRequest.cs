namespace BayiPortal.Application.DTOs.Requests;

public class UpdateBrandRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
