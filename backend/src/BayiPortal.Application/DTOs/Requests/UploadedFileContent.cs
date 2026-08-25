namespace BayiPortal.Application.DTOs.Requests;

// API katmanındaki IFormFile'ı Application katmanına primitiflere çevirerek taşır (Application, IFormFile bilmez).
public sealed class UploadedFileContent
{
    public required Stream Content { get; init; }
    public required string OriginalFileName { get; init; }
    public required string MimeType { get; init; }
    public required long FileSize { get; init; }
}
