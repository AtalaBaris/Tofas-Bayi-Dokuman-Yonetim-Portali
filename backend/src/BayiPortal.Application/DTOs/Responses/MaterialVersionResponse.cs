using System;

namespace BayiPortal.Application.DTOs.Responses;

public class MaterialVersionResponse
{
    public int Id { get; set; }
    public int MaterialId { get; set; }
    public string VersionLabel { get; set; } = string.Empty;
    public int VersionNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ChangeNote { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public int CreatedBy { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
