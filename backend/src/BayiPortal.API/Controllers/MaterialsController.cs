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

    [HttpPost]
    [Authorize(Roles = ManagerRoles)]
    public async Task<ActionResult<MaterialResponse>> Create(
        [FromForm] CreateMaterialForm form, CancellationToken cancellationToken)
    {
        var request = new CreateMaterialRequest
        {
            Title = form.Title,
            Description = form.Description,
            CategoryId = form.CategoryId,
            BrandIds = form.BrandIds,
            ExpiresAt = form.ExpiresAt
        };

        await using var stream = form.File.OpenReadStream();
        var result = await _materialService.CreateAsync(
            request, stream, form.File.FileName, form.File.ContentType, form.File.Length,
            GetRequestingUser(), cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = ManagerRoles)]
    public async Task<ActionResult<MaterialResponse>> Update(
        int id, [FromBody] UpdateMaterialRequest request, CancellationToken cancellationToken)
    {
        var result = await _materialService.UpdateAsync(id, request, GetRequestingUser(), cancellationToken);
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
    public IFormFile File { get; set; } = null!;
}
