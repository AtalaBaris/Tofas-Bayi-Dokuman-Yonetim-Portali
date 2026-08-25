namespace BayiPortal.Application.DTOs.Responses;

public class MaterialFileResponse
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public int SortOrder { get; set; }
}
