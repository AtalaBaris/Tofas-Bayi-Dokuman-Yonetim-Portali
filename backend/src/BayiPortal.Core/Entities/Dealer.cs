// Dealers (bayiler) tablosu.
namespace BayiPortal.Core.Entities;

public class Dealer
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? Phone { get; set; }
    public string? ContactInfo { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<DealerBrand> DealerBrands { get; set; } = new List<DealerBrand>();
}
