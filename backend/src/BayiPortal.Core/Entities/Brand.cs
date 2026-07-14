// Brands (markalar) tablosu — bayi yetkisi ve içerik hedeflemesinin ortak anahtarı.
namespace BayiPortal.Core.Entities;

public class Brand
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<DealerBrand> DealerBrands { get; set; } = new List<DealerBrand>();
    public ICollection<MaterialBrand> MaterialBrands { get; set; } = new List<MaterialBrand>();
}
