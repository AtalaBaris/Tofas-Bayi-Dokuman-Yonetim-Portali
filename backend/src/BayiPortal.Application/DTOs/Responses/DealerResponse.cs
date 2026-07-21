namespace BayiPortal.Application.DTOs.Responses;

public class DealerResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public List<int> BrandIds { get; set; } = new();
    public List<string> BrandNames { get; set; } = new();
    /// <summary>Aktif DealerUser sayısı — 0 ise bayi kullanıcıssız (kurtarma gerekir).</summary>
    public int ActiveUserCount { get; set; }
}
