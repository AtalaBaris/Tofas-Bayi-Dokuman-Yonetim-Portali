using BayiPortal.Application.DTOs.Responses;

namespace BayiPortal.Application.Interfaces.Services;

public interface IExportService
{
    /// <summary>
    /// Erişim kayıtları listesini Excel (xlsx) veya PDF olarak üretir.
    /// </summary>
    (byte[] Content, string FileName, string MimeType) ExportAccessLogs(
        IReadOnlyList<AccessLogResponse> items, string format);

    /// <summary>
    /// Tek bir dokümana ait bayi okuma raporunu (görüntüleyenler + bekleyenler) Excel veya PDF olarak üretir.
    /// </summary>
    (byte[] Content, string FileName, string MimeType) ExportAccessReport(
        MaterialAccessReportResponse report, string format);
}
