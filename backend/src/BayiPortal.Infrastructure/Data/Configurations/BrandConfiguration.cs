// EF Fluent API: Brand tablosu için kolon uzunlukları, PK/FK ve indeks ayarları.
using BayiPortal.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BayiPortal.Infrastructure.Data.Configurations;

public class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> builder)
    {
        builder.ToTable("Brands");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.BadgeLabel).HasMaxLength(50).IsRequired();
        builder.Property(x => x.BadgeColor).HasMaxLength(7).IsRequired();
        builder.HasIndex(x => x.Code).IsUnique();
    }
}
