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
        CreateMaterialRequest request, IReadOnlyList<UploadedFileContent> files,
        RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<MaterialResponse> UpdateAsync(
        int id, UpdateMaterialRequest request, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task ArchiveAsync(int id, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<(Stream Content, string FileName, string MimeType)> GetDownloadStreamAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<(Stream Content, string FileName, string MimeType)> GetFileDownloadStreamAsync(
        int id, int fileId, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<List<MaterialScheduleItemResponse>> GetScheduleCalendarAsync(
        DateTime fromUtc, DateTime toUtc, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<MaterialResponse> UpdateScheduleAsync(
        int id, UpdateMaterialScheduleRequest request, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    /// <summary>
    /// Havuzdaki kaynaktan yeni bir zamanlanmış kopya üretir; kaynak (taslak) havuzda kalır.
    /// </summary>
    Task<MaterialResponse> CreateScheduledCopyAsync(
        int sourceId, UpdateMaterialScheduleRequest request, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<MaterialResponse> PublishNowAsync(int id, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<MaterialResponse> CancelScheduleAsync(int id, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task ProcessDueSchedulesAsync(CancellationToken cancellationToken = default);

    Task<List<MaterialVersionResponse>> GetVersionsAsync(
        int id, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<MaterialVersionResponse> CreateVersionAsync(
        int id, CreateMaterialVersionRequest request, UploadedFileContent file, RequestingUser requestingUser, CancellationToken cancellationToken = default);

    Task<(Stream Content, string FileName, string MimeType)> GetVersionDownloadStreamAsync(
        int id, int versionId, RequestingUser requestingUser, CancellationToken cancellationToken = default);
}

// Controller'da JWT claim'lerinden doldurulur; brand-eşleşme ve rol kontrolleri bu bilgiye göre yapılır.
public sealed record RequestingUser(int UserId, string Role, int? DealerId);
