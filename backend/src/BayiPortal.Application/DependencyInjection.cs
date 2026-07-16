// Application katmanının iş kuralı servislerini DI container'a kaydeder.
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Application.Services;
using BayiPortal.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace BayiPortal.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
