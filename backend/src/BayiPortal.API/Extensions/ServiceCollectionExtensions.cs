// Program.cs'i sade tutmak için DI / Swagger / CORS kayıtları burada toplanır.
using BayiPortal.Infrastructure;
using Microsoft.OpenApi.Models;

namespace BayiPortal.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Bayi Doküman Yönetimi Portalı API",
                Version = "v1"
            });
        });

        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                policy.WithOrigins(
                        "http://localhost:4200",
                        "https://localhost:4200")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        services.AddInfrastructure(configuration);

        return services;
    }
}
