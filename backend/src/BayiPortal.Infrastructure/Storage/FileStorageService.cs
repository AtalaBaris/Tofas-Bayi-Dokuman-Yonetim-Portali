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

    public Stream OpenRead(string relativePath)
    {
        // Path traversal koruması: sadece dosya adı kısmı alınır, üst dizine çıkış yok sayılır.
        var safeFileName = Path.GetFileName(relativePath);
        var fullPath = Path.Combine(_rootPath, safeFileName);
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
