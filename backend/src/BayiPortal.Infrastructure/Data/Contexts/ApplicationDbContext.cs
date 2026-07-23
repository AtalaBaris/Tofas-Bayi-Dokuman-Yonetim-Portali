// EF Core DbContext: PostgreSQL tablolarına erişim kapısı. DbSet'ler + Fluent config buradan yüklenir.
using BayiPortal.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace BayiPortal.Infrastructure.Data.Contexts;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Dealer> Dealers => Set<Dealer>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<DealerBrand> DealerBrands => Set<DealerBrand>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<MaterialBrand> MaterialBrands => Set<MaterialBrand>();
    public DbSet<MaterialFile> MaterialFiles => Set<MaterialFile>();
    public DbSet<AccessLog> AccessLogs => Set<AccessLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<MaterialVersion> MaterialVersions => Set<MaterialVersion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
