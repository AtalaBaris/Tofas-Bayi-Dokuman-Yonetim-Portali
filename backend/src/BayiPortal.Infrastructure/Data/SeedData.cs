// Geliştirme ortamı için örnek başlangıç verisi (README'deki örnek kullanıcılarla birebir).
// Idempotent: eksik bayi/marka/kategori/kullanıcıyı tamamlar; seed kullanıcı şifrelerini README ile senkron tutar.
using BayiPortal.Core.Entities;
using BayiPortal.Core.Enums;
using BayiPortal.Infrastructure.Data.Contexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BayiPortal.Infrastructure.Data;

public static class SeedData
{
    public static async Task EnsureSeedDataAsync(
        ApplicationDbContext dbContext,
        IPasswordHasher<User> passwordHasher,
        ILogger? logger = null)
    {
        var dealerA = await EnsureDealerAsync(dbContext, "BAYI-A", "Bayi A");
        var dealerB = await EnsureDealerAsync(dbContext, "BAYI-B", "Bayi B");

        var brandA = await EnsureBrandAsync(dbContext, "MRK-A", "Marka A");
        var brandB = await EnsureBrandAsync(dbContext, "MRK-B", "Marka B");

        await EnsureCategoryAsync(dbContext, "Pazarlama Materyalleri", "Billboard, broşür, sosyal medya içerikleri");
        await EnsureCategoryAsync(dbContext, "Genel Duyuru", "Kampanya ve operasyon duyuruları");
        await EnsureCategoryAsync(dbContext, "Eğitim Dokümanı", "Uygulama ve süreç eğitim materyalleri");

        await EnsureDealerBrandAsync(dbContext, dealerA, brandA);
        await EnsureDealerBrandAsync(dbContext, dealerB, brandB);

        await EnsureUserAsync(
            dbContext,
            passwordHasher,
            email: "admin@bayiportal.local",
            name: "Yönetici",
            role: RoleType.Admin,
            password: "Admin123!",
            dealer: null);

        await EnsureUserAsync(
            dbContext,
            passwordHasher,
            email: "editor@bayiportal.local",
            name: "İçerik Yöneticisi",
            role: RoleType.ContentManager,
            password: "Editor123!",
            dealer: null);

        await EnsureUserAsync(
            dbContext,
            passwordHasher,
            email: "bayi.a@bayiportal.local",
            name: "Bayi Kullanıcısı A",
            role: RoleType.DealerUser,
            password: "Bayi123!",
            dealer: dealerA);

        await EnsureUserAsync(
            dbContext,
            passwordHasher,
            email: "bayi.b@bayiportal.local",
            name: "Bayi Kullanıcısı B",
            role: RoleType.DealerUser,
            password: "Bayi123!",
            dealer: dealerB);

        await dbContext.SaveChangesAsync();
        logger?.LogInformation(
            "Seed hazır. Bayi giriş: bayi.a@bayiportal.local / Bayi123! | Admin: admin@bayiportal.local / Admin123!");
    }

    private static async Task<Dealer> EnsureDealerAsync(ApplicationDbContext db, string code, string name)
    {
        var existing = await db.Dealers.FirstOrDefaultAsync(d => d.Code == code);
        if (existing is not null)
        {
            return existing;
        }

        var dealer = new Dealer { Name = name, Code = code, IsActive = true };
        db.Dealers.Add(dealer);
        return dealer;
    }

    private static async Task<Brand> EnsureBrandAsync(ApplicationDbContext db, string code, string name)
    {
        var existing = await db.Brands.FirstOrDefaultAsync(b => b.Code == code);
        if (existing is not null)
        {
            if (string.IsNullOrWhiteSpace(existing.BadgeLabel))
            {
                existing.BadgeLabel = existing.Name;
            }
            if (string.IsNullOrWhiteSpace(existing.BadgeColor))
            {
                existing.BadgeColor = DefaultBadgeColorFor(code);
            }
            return existing;
        }

        var brand = new Brand
        {
            Name = name,
            Code = code,
            BadgeLabel = name,
            BadgeColor = DefaultBadgeColorFor(code),
            IsActive = true
        };
        db.Brands.Add(brand);
        return brand;
    }

    private static string DefaultBadgeColorFor(string code) =>
        code.ToUpperInvariant() switch
        {
            "MRK-A" => "#1E3A8A",
            "MRK-B" => "#14532D",
            _ => "#374151"
        };

    private static async Task EnsureCategoryAsync(ApplicationDbContext db, string name, string description)
    {
        if (await db.Categories.AnyAsync(c => c.Name == name))
        {
            return;
        }

        db.Categories.Add(new Category
        {
            Name = name,
            Description = description,
            IsActive = true
        });
    }

    private static async Task EnsureDealerBrandAsync(ApplicationDbContext db, Dealer dealer, Brand brand)
    {
        // Yeni entity'lerde Id henüz 0 olabilir; navigation ile kontrol et.
        if (dealer.Id != 0 && brand.Id != 0)
        {
            var exists = await db.DealerBrands.AnyAsync(dbItem =>
                dbItem.DealerId == dealer.Id && dbItem.BrandId == brand.Id);
            if (exists)
            {
                return;
            }
        }
        else if (db.ChangeTracker.Entries<DealerBrand>().Any(e =>
                     e.Entity.Dealer == dealer && e.Entity.Brand == brand))
        {
            return;
        }

        db.DealerBrands.Add(new DealerBrand { Dealer = dealer, Brand = brand });
    }

    private static async Task EnsureUserAsync(
        ApplicationDbContext db,
        IPasswordHasher<User> passwordHasher,
        string email,
        string name,
        RoleType role,
        string password,
        Dealer? dealer)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalized);

        if (user is null)
        {
            user = new User
            {
                Name = name,
                Email = normalized,
                Role = role,
                IsActive = true,
                Dealer = dealer
            };
            user.PasswordHash = passwordHasher.HashPassword(user, password);
            db.Users.Add(user);
            return;
        }

        // Demo hesap: şifre README ile her Development start'ta senkron (giriş bozulmasın).
        user.Name = name;
        user.Role = role;
        user.IsActive = true;
        user.Dealer = dealer;
        user.PasswordHash = passwordHasher.HashPassword(user, password);
    }
}
