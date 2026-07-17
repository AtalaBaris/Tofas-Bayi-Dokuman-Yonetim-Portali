using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;

namespace BayiPortal.Application.Interfaces.Services;

public interface IMaterialService
{
    Task<List<MaterialResponse>> GetListAsync(
        MaterialListQuery query, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<MaterialResponse> GetByIdAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<MaterialResponse> CreateAsync(
        CreateMaterialRequest request, Stream fileContent, string originalFileName, string mimeType, long fileSize,
        RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<MaterialResponse> UpdateAsync(
        int id, UpdateMaterialRequest request, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task ArchiveAsync(int id, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<(Stream Content, string FileName, string MimeType)> GetDownloadStreamAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default);
}

// Controller'da JWT claim'lerinden doldurulur; brand-eşleşme ve rol kontrolleri bu bilgiye göre yapılır.
public sealed record RequestingUser(int UserId, string Role, int? DealerId);
