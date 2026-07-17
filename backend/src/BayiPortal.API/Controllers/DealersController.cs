using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BayiPortal.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/dealers")]
public class DealersController : ControllerBase
{
    private readonly IDealerService _dealerService;

    public DealersController(IDealerService dealerService)
    {
        _dealerService = dealerService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DealerResponse>>> GetList(CancellationToken cancellationToken)
    {
        var result = await _dealerService.GetListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DealerResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _dealerService.GetByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<DealerResponse>> Create(
        [FromBody] CreateDealerRequest request, CancellationToken cancellationToken)
    {
        var result = await _dealerService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<DealerResponse>> Update(
        int id, [FromBody] UpdateDealerRequest request, CancellationToken cancellationToken)
    {
        var result = await _dealerService.UpdateAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id, CancellationToken cancellationToken)
    {
        await _dealerService.DeactivateAsync(id, cancellationToken);
        return NoContent();
    }
}
