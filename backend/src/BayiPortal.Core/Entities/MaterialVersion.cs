using System;

namespace BayiPortal.Core.Entities;

public class MaterialVersion
{
    public int Id { get; set; }
    public int MaterialId { get; set; }
    public string VersionLabel { get; set; } = "v1.0";
    public int VersionNumber { get; set; } = 1;
    public string Title { get; set; } = string.Empty;
    public string ChangeNote { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }

    public Material Material { get; set; } = null!;
    public User Creator { get; set; } = null!;
}
