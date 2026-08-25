using BayiPortal.Core.Exceptions;

namespace BayiPortal.Application.Interfaces.Services;

/** Yükleme öncesi uzantı/MIME/boyut kuralları (FR-13). */
public interface IFileUploadPolicy
{
    void ValidateOrThrow(string originalFileName, string mimeType, long fileSize);
}
