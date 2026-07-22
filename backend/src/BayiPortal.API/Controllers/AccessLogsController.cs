using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BayiPortal.API.Controllers;

[ApiController]
[Authorize]
[Route("api/access-logs")]
public class AccessLogsController : ControllerBase
{
    private readonly IAccessLogService _accessLogService;

    public AccessLogsController(IAccessLogService accessLogService)
    {
        _accessLogService = accessLogService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<ActionResult<AccessLogListResponse>> GetList(
        [FromQuery] string? keyword,
        [FromQuery] string? role,
        [FromQuery] string? action,
        [FromQuery] string? status,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var isContentManagerOnly = User.IsInRole("ContentManager") && !User.IsInRole("Admin");

        var query = new AccessLogListQuery
        {
            Keyword = keyword,
            Role = role,
            Action = action,
            Status = status,
            StartDate = startDate,
            EndDate = endDate,
            Page = page,
            PageSize = pageSize,
            ExcludeAuthLogs = isContentManagerOnly
        };

        var result = await _accessLogService.GetListAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> LogLogout(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var emailClaim = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.Name);

        if (userIdClaim != null)
        {
            var userId = int.Parse(userIdClaim);
            await _accessLogService.LogAsync(userId, emailClaim, null, "Çıkış", "Sistemden başarıyla çıkış yapıldı.", "N/A", cancellationToken);
        }

        return NoContent();
    }
}
