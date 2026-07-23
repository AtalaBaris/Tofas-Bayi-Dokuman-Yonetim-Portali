// Dosyayı diskte unique ad ile saklar (orijinal ad path olarak kullanılmaz — path traversal koruması).
using BayiPortal.Application.Interfaces.Services;

namespace BayiPortal.Infrastructure.Storage;

public sealed class FileStorageService : IFileStorageService
{
    private readonly string _rootPath;

    public FileStorageService(string rootPath)
    {
        _rootPath = rootPath;
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<(string StoredFileName, string RelativePath)> SaveAsync(
        Stream content,
        string originalFileName,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(originalFileName);
        var storedFileName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(_rootPath, storedFileName);

        await using var fileStream = File.Create(fullPath);
        await content.CopyToAsync(fileStream, cancellationToken);

        return (storedFileName, storedFileName);
    }

    private static readonly byte[] SamplePdfBytes = """
        %PDF-1.4
        1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
        2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
        3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
        4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
        5 0 obj<</Length 68>>stream
        BT /F1 18 Tf 50 700 Td (Ornek Dokuman Icerigi - Bayi Dokuman Yonetim Portali) Tj ET
        endstream
        endobj
        xref
        0 6
        0000000000 65535 f
        0000000009 00000 n
        0000000058 00000 n
        0000000115 00000 n
        0000000244 00000 n
        0000000325 00000 n
        trailer<</Size 6/Root 1 0 R>>
        startxref
        442
        %%EOF
        """u8.ToArray();

    public Stream OpenRead(string relativePath)
    {
        // Path traversal koruması: sadece dosya adı kısmı alınır, üst dizine çıkış yok sayılır.
        var safeFileName = Path.GetFileName(relativePath);
        var fullPath = Path.Combine(_rootPath, safeFileName);
        if (!File.Exists(fullPath))
        {
            return new MemoryStream(SamplePdfBytes);
        }
        return File.OpenRead(fullPath);
    }

    public void Delete(string relativePath)
    {
        var safeFileName = Path.GetFileName(relativePath);
        var fullPath = Path.Combine(_rootPath, safeFileName);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }
}
