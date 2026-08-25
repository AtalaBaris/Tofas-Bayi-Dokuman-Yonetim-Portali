// Infrastructure servislerini (DbContext, dosya saklama vb.) DI container'a kaydeder.
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Infrastructure.Data.Contexts;
using BayiPortal.Infrastructure.Repositories;
using BayiPortal.Infrastructure.Services;
using BayiPortal.Infrastructure.Storage;
using BayiPortal.Infrastructure.Workers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QuestPDF.Infrastructure;

namespace BayiPortal.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is missing.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString));

        var storageRoot = configuration["FileStorage:RootPath"] ?? "uploads";
        var absoluteStorageRoot = Path.IsPathRooted(storageRoot)
            ? storageRoot
            : Path.Combine(Directory.GetCurrentDirectory(), storageRoot);

        services.AddSingleton<IFileStorageService>(_ => new FileStorageService(absoluteStorageRoot));
        services.AddSingleton<IFileUploadPolicy, FileUploadPolicy>();

        services.AddHttpContextAccessor();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IMaterialRepository, MaterialRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IAccessLogService, AccessLogService>();
        services.AddSingleton<IExportService, ExportService>();
        services.AddScoped<IDealerRepository, DealerRepository>();
        services.AddScoped<IBrandRepository, BrandRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddHostedService<MaterialPublishWorker>();

        return services;
    }
}
