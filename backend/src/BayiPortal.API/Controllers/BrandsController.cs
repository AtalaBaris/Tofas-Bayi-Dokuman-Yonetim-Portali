using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BayiPortal.API.Controllers;

[ApiController]
[Authorize]
[Route("api/brands")]
public class BrandsController : ControllerBase
{
    private const string ManagerRoles = "Admin,ContentManager";

    private readonly IBrandService _brandService;

    public BrandsController(IBrandService brandService)
    {
        _brandService = brandService;
    }

    [HttpGet]
    [Authorize(Roles = ManagerRoles)]
    public async Task<ActionResult<List<BrandResponse>>> GetList(CancellationToken cancellationToken)
    {
        var result = await _brandService.GetListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = ManagerRoles)]
    public async Task<ActionResult<BrandResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _brandService.GetByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BrandResponse>> Create(
        [FromBody] CreateBrandRequest request, CancellationToken cancellationToken)
    {
        var result = await _brandService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BrandResponse>> Update(
        int id, [FromBody] UpdateBrandRequest request, CancellationToken cancellationToken)
    {
        var result = await _brandService.UpdateAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(int id, CancellationToken cancellationToken)
    {
        await _brandService.DeactivateAsync(id, cancellationToken);
        return NoContent();
    }
}
