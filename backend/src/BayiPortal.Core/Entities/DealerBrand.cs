// Dealer ↔ Brand çoktan çoğa köprü tablo. Bayinin hangi markaları gördüğü burada.
namespace BayiPortal.Core.Entities;

public class DealerBrand
{
    public int DealerId { get; set; }
    public int BrandId { get; set; }

    public Dealer Dealer { get; set; } = null!;
    public Brand Brand { get; set; } = null!;
}
