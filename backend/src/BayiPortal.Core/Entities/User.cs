// Users tablosu. Bayi kullanıcılarında DealerId dolu; şifre düz metin tutulmaz (PasswordHash).
namespace BayiPortal.Core.Entities;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? DealerId { get; set; }
    public bool IsActive { get; set; } = true;

    public Dealer? Dealer { get; set; }
    public ICollection<Material> CreatedMaterials { get; set; } = new List<Material>();
    public ICollection<AccessLog> AccessLogs { get; set; } = new List<AccessLog>();
}
