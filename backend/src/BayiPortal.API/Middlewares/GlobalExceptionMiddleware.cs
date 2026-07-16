// Yakalanmamış hataları loglar; kullanıcıya teknik detay/stack/path göstermez.
using System.Net;
using System.Text.Json;
using BayiPortal.Core.Exceptions;

namespace BayiPortal.API.Middlewares;

public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "Unhandled exception");

        var (statusCode, message) = exception switch
        {
            MaterialNotFoundException => (HttpStatusCode.NotFound, "İstenen içerik bulunamadı."),
            ForbiddenAccessException => (HttpStatusCode.Forbidden, "Bu işlem için yetkiniz yok."),
            InvalidCredentialsException invalidCredentialsEx => (HttpStatusCode.Unauthorized, invalidCredentialsEx.Message),
            DomainException domainEx => (HttpStatusCode.BadRequest, domainEx.Message),
            _ => (HttpStatusCode.InternalServerError, "Beklenmeyen bir hata oluştu.")
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var payload = JsonSerializer.Serialize(new { message });
        await context.Response.WriteAsync(payload);
    }
}
