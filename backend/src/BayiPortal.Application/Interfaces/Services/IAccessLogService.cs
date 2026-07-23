using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;

namespace BayiPortal.Application.Interfaces.Services;

public interface IAccessLogService
{
    Task LogAsync(
        int? userId,
        string? userName,
        int? materialId,
        string action,
        string description,
        string? loginStatus = null,
        CancellationToken cancellationToken = default,
        int? materialFileId = null);

    Task<AccessLogListResponse> GetListAsync(
        AccessLogListQuery query,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Verilen kullanıcının, verilen materyaller için en yüksek erişim seviyesini döner
    /// ("downloaded" &gt; "viewed"). Hiç log yoksa o materyal için sözlükte anahtar bulunmaz
    /// (çağıran taraf bunu "unread" olarak yorumlamalı).
    /// </summary>
    Task<Dictionary<int, string>> GetAccessStatusesAsync(
        int userId,
        IReadOnlyCollection<int> materialIds,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// "30" için son 30 günün günlük, "year" için içinde bulunulan yılın aylık
    /// görüntüleme/indirme sayaçlarını döner (dashboard trend grafiği).
    /// </summary>
    Task<AccessLogTrendResponse> GetTrendAsync(
        string period,
        CancellationToken cancellationToken = default);
}
