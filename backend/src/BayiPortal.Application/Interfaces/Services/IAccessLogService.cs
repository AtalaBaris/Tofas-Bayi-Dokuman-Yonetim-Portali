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
        CancellationToken cancellationToken = default);

    Task<AccessLogListResponse> GetListAsync(
        AccessLogListQuery query,
        CancellationToken cancellationToken = default);
}
