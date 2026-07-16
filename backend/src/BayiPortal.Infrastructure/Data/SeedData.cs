// Geliştirme ortamı için örnek başlangıç verisi (README'deki örnek kullanıcılarla birebir).
using BayiPortal.Core.Entities;
using BayiPortal.Infrastructure.Data.Contexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BayiPortal.Infrastructure.Data;

public static class SeedData
{
    public static async Task EnsureSeedDataAsync(ApplicationDbContext dbContext, IPasswordHasher<User> passwordHasher)
    {
        if (await dbContext.Users.AnyAsync())
        {
            return;
        }

        var dealerA = new Dealer { Name = "Bayi A", Code = "BAYI-A", IsActive = true };
        var dealerB = new Dealer { Name = "Bayi B", Code = "BAYI-B", IsActive = true };

        var brandA = new Brand { Name = "Marka A", Code = "MRK-A", IsActive = true };
        var brandB = new Brand { Name = "Marka B", Code = "MRK-B", IsActive = true };

        var categoryMarketing = new Category
        {
            Name = "Pazarlama Materyalleri",
            Description = "Billboard, broşür, sosyal medya içerikleri",
            IsActive = true
        };
        var categoryAnnouncement = new Category
        {
            Name = "Genel Duyuru",
            Description = "Kampanya ve operasyon duyuruları",
            IsActive = true
        };
        var categoryTraining = new Category
        {
            Name = "Eğitim Dokümanı",
            Description = "Uygulama ve süreç eğitim materyalleri",
            IsActive = true
        };

        dbContext.Dealers.AddRange(dealerA, dealerB);
        dbContext.Brands.AddRange(brandA, brandB);
        dbContext.Categories.AddRange(categoryMarketing, categoryAnnouncement, categoryTraining);

        dbContext.DealerBrands.AddRange(
            new DealerBrand { Dealer = dealerA, Brand = brandA },
            new DealerBrand { Dealer = dealerB, Brand = brandB });

        var admin = new User { Name = "Yönetici", Email = "admin@bayiportal.local", Role = "Admin", IsActive = true };
        admin.PasswordHash = passwordHasher.HashPassword(admin, "Admin123!");

        var editor = new User { Name = "İçerik Yöneticisi", Email = "editor@bayiportal.local", Role = "ContentManager", IsActive = true };
        editor.PasswordHash = passwordHasher.HashPassword(editor, "Editor123!");

        var bayiUserA = new User
        {
            Name = "Bayi Kullanıcısı A",
            Email = "bayi.a@bayiportal.local",
            Role = "DealerUser",
            IsActive = true,
            Dealer = dealerA
        };
        bayiUserA.PasswordHash = passwordHasher.HashPassword(bayiUserA, "Bayi123!");

        var bayiUserB = new User
        {
            Name = "Bayi Kullanıcısı B",
            Email = "bayi.b@bayiportal.local",
            Role = "DealerUser",
            IsActive = true,
            Dealer = dealerB
        };
        bayiUserB.PasswordHash = passwordHasher.HashPassword(bayiUserB, "Bayi123!");

        dbContext.Users.AddRange(admin, editor, bayiUserA, bayiUserB);

        await dbContext.SaveChangesAsync();
    }
}
