// Material ↔ Brand köprü. İçeriğin paylaşıldığı markalar.
namespace BayiPortal.Core.Entities;

public class MaterialBrand
{
    public int MaterialId { get; set; }
    public int BrandId { get; set; }

    public Material Material { get; set; } = null!;
    public Brand Brand { get; set; } = null!;
}
