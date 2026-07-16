// Uygulama giriş noktası: middleware, Swagger, CORS ve controller haritasını burada bağlarız.
using BayiPortal.API.Extensions;
using BayiPortal.API.Middlewares;
using BayiPortal.Core.Entities;
using BayiPortal.Infrastructure.Data;
using BayiPortal.Infrastructure.Data.Contexts;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using var seedScope = app.Services.CreateScope();
    var dbContext = seedScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var passwordHasher = seedScope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
    await SeedData.EnsureSeedDataAsync(dbContext, passwordHasher);
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
