namespace BayiPortal.Application.DTOs.Requests;

// Dosya, Application katmanına ASP.NET Core bağımlılığı katmamak için
// ayrı bir Stream parametresi olarak servis metoduna geçirilir (bkz. IMaterialService.CreateAsync).
public class CreateMaterialRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public List<int> BrandIds { get; set; } = new();
    public DateTime? ExpiresAt { get; set; }
}
