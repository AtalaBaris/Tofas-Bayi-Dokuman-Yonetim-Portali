// MaterialFiles: bir Material'a ait tek bir dosya. Bir Material birden fazla MaterialFile'a sahip olabilir.
namespace BayiPortal.Core.Entities;

public class MaterialFile
{
    public int Id { get; set; }
    public int MaterialId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }

    public Material Material { get; set; } = null!;
    public ICollection<AccessLog> AccessLogs { get; set; } = new List<AccessLog>();
}
