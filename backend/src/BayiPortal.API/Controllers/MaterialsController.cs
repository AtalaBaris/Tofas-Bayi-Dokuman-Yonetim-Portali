using System.Security.Claims;
using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BayiPortal.API.Controllers;

[ApiController]
[Authorize]
[Route("api/materials")]
public class MaterialsController : ControllerBase
{
    private const string ManagerRoles = "Admin,ContentManager";

    private readonly IMaterialService _materialService;

    public MaterialsController(IMaterialService materialService)
    {
        _materialService = materialService;
    }

    [HttpGet]
    public async Task<ActionResult<List<MaterialResponse>>> GetList(
        [FromQuery] int? categoryId, [FromQuery] int? brandId, [FromQuery] string? keyword,
        [FromQuery] string? status, CancellationToken cancellationToken)
    {
        var query = new MaterialListQuery { CategoryId = categoryId, BrandId = brandId, Keyword = keyword, Status = status };
        var result = await _materialService.GetListAsync(query, GetRequestingUser(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("schedule")]
    [Authorize(Roles = ManagerRoles)]
    public async Task<ActionResult<List<MaterialScheduleItemResponse>>> GetSchedule(
        [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken cancellationToken)
    {
        var result = await _materialService.GetScheduleCalendarAsync(from, to, GetRequestingUser(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MaterialResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _materialService.GetByIdAsync(id, GetRequestingUser(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> Download(int id, CancellationToken cancellationToken)
    {
        var (content, fileName, mimeType) = await _materialService.GetDownloadStreamAsync(id, GetRequestingUser(), cancellationToken);
        return File(content, mimeType, fileName);
    }

    [HttpGet("{id:int}/files/{fileId:int}/download")]
    public async Task<IActionResult> DownloadFile(int id, int fileId, CancellationToken cancellationToken)
    {
        var (content, fileName, mimeType) = await _materialService.GetFileDownloadStreamAsync(id, fileId, GetRequestingUser(), cancellationToken);
        return File(content, mimeType, fileName);
    }

    [HttpPost]
    [Authorize(Roles = ManagerRoles)]
    public async Task<ActionResult<MaterialResponse>> Create(
        [FromForm] CreateMaterialForm form, CancellationToken cancellationToken)
    {
        if (form.Files.Count == 0 || form.Files.All(f => f.Length == 0))
        {
            return BadRequest(new { message = "En az bir dosya zorunludur." });
        }

        var request = new CreateMaterialRequest
        {
            Title = form.Title,
            Description = form.Description,
            CategoryId = form.CategoryId,
            BrandIds = form.BrandIds ?? new List<int>(),
            ExpiresAt = form.ExpiresAt,
            Status = form.Status,
            ScheduledPublishAt = form.ScheduledPublishAt,
            RecurrenceKind = form.RecurrenceKind,
            RecurrenceDayOfWeek = form.RecurrenceDayOfWeek,
            RecurrenceDayOfMonth = form.RecurrenceDayOfMonth
        };

        var streams = form.Files.Select(f => f.OpenReadStream()).ToList();
        try
        {
            var uploaded = form.Files.Zip(streams, (f, s) => new UploadedFileContent
            {
                Content = s,
                OriginalFileName = f.FileName,
                MimeType = f.ContentType ?? string.Empty,
                FileSize = f.Length
            }).ToList();

            var result = await _materialService.CreateAsync(request, uploaded, GetRequestingUser(), cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        finally
        {
            foreach (var s in streams)
            {
                await s.DisposeAsync();
            }
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = ManagerRoles)]
    public async Task<ActionResult<MaterialResponse>> Update(
        int id, [FromBody] UpdateMaterialRequest request, CancellationToken cancellationToken)
    {
        var result = await _materialService.UpdateAsync(id, request, GetRequestingUser(), cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:int}/schedule")]
    [Authorize(Roles = ManagerRoles)]
    public async Task<ActionResult<MaterialResponse>> UpdateSchedule(
        int id, [FromBody] UpdateMaterialScheduleRequest request, CancellationToken cancellationToken)
    {
        var result = await _materialService.UpdateScheduleAsync(id, request, GetRequestingUser(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:int}/schedule-copies")]
    [Authorize(Roles = ManagerRoles)]
    public async Task<ActionResult<MaterialResponse>> CreateScheduledCopy(
        int id, [FromBody] UpdateMaterialScheduleRequest request, CancellationToken cancellationToken)
    {
        var result = await _materialService.CreateScheduledCopyAsync(id, request, GetRequestingUser(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:int}/publish-now")]
    [Authorize(Roles = ManagerRoles)]
    public async Task<ActionResult<MaterialResponse>> PublishNow(int id, CancellationToken cancellationToken)
    {
        var result = await _materialService.PublishNowAsync(id, GetRequestingUser(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:int}/cancel-schedule")]
    [Authorize(Roles = ManagerRoles)]
    public async Task<ActionResult<MaterialResponse>> CancelSchedule(int id, CancellationToken cancellationToken)
    {
        var result = await _materialService.CancelScheduleAsync(id, GetRequestingUser(), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = ManagerRoles)]
    public async Task<IActionResult> Archive(int id, CancellationToken cancellationToken)
    {
        await _materialService.ArchiveAsync(id, GetRequestingUser(), cancellationToken);
        return NoContent();
    }

    private RequestingUser GetRequestingUser()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = User.FindFirstValue(ClaimTypes.Role)!;
        var dealerIdClaim = User.FindFirstValue("dealerId");
        var dealerId = dealerIdClaim is null ? (int?)null : int.Parse(dealerIdClaim);
        return new RequestingUser(userId, role, dealerId);
    }
}

// Multipart/form-data binding modeli (API katmanına özgü; Application katmanı IFormFile bilmez).
public class CreateMaterialForm
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public List<int> BrandIds { get; set; } = new();
    public DateTime? ExpiresAt { get; set; }
    public string? Status { get; set; }
    public DateTime? ScheduledPublishAt { get; set; }
    public string? RecurrenceKind { get; set; }
    public int? RecurrenceDayOfWeek { get; set; }
    public int? RecurrenceDayOfMonth { get; set; }
    public List<IFormFile> Files { get; set; } = new();
}
