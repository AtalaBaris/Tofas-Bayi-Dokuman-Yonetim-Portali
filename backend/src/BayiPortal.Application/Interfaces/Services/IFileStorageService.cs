// Dosya saklama sözleşmesi. Implementasyon Infrastructure/Storage'dadır.
namespace BayiPortal.Application.Interfaces.Services;

public interface IFileStorageService
{
    Task<(string StoredFileName, string RelativePath)> SaveAsync(Stream content, string originalFileName, CancellationToken cancellationToken = default);

    Stream OpenRead(string relativePath);

    void Delete(string relativePath);
}
