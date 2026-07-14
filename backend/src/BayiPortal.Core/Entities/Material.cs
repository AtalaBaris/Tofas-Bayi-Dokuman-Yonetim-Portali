// Materials: içerik metadata. Binary diskte; FileName orijinal, StoredFileName unique.
namespace BayiPortal.Core.Entities;

public class Material
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Category Category { get; set; } = null!;
    public User Creator { get; set; } = null!;
    public ICollection<MaterialBrand> MaterialBrands { get; set; } = new List<MaterialBrand>();
    public ICollection<AccessLog> AccessLogs { get; set; } = new List<AccessLog>();
}
