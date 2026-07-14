// API ayakta mı diye basit health check. Gerçek iş uçları Controllers altına eklenecek.
using Microsoft.AspNetCore.Mvc;

namespace BayiPortal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", service = "BayiPortal.API" });
}
