using System.Security.Claims;
using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BayiPortal.API.Controllers;

// UsersController (api/users) tamamen Admin'e kısıtlı olduğu için, kullanıcının
// kendi profilini görüntüleyip güncellemesi ayrı bir controller'da: herhangi bir
// giriş yapmış kullanıcı (rol farketmez) sadece kendi Name/Email/Phone'unu değiştirebilir.
[ApiController]
[Authorize]
[Route("api/users/me")]
public class UserProfileController : ControllerBase
{
    private readonly IUserService _userService;

    public UserProfileController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<UserResponse>> GetOwnProfile(CancellationToken cancellationToken)
    {
        var result = await _userService.GetOwnProfileAsync(GetUserId(), cancellationToken);
        return Ok(result);
    }

    [HttpPut]
    public async Task<ActionResult<UserResponse>> UpdateOwnProfile(
        [FromBody] UpdateOwnProfileRequest request, CancellationToken cancellationToken)
    {
        var result = await _userService.UpdateOwnProfileAsync(GetUserId(), request, cancellationToken);
        return Ok(result);
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
