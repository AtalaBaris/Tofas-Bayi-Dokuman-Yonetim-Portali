// Infrastructure servislerini (DbContext, dosya saklama vb.) DI container'a kaydeder.
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Infrastructure.Data.Contexts;
using BayiPortal.Infrastructure.Repositories;
using BayiPortal.Infrastructure.Services;
using BayiPortal.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BayiPortal.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is missing.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString));

        var storageRoot = configuration["FileStorage:RootPath"] ?? "uploads";
        var absoluteStorageRoot = Path.IsPathRooted(storageRoot)
            ? storageRoot
            : Path.Combine(Directory.GetCurrentDirectory(), storageRoot);

        services.AddSingleton<IFileStorageService>(_ => new FileStorageService(absoluteStorageRoot));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IMaterialRepository, MaterialRepository>();

        return services;
    }
}
