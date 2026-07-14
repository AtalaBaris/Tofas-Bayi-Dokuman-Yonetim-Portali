// EF Fluent API: MaterialBrand tablosu için kolon uzunlukları, PK/FK ve indeks ayarları.
using BayiPortal.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BayiPortal.Infrastructure.Data.Configurations;

public class MaterialBrandConfiguration : IEntityTypeConfiguration<MaterialBrand>
{
    public void Configure(EntityTypeBuilder<MaterialBrand> builder)
    {
        builder.ToTable("MaterialBrands");
        builder.HasKey(x => new { x.MaterialId, x.BrandId });

        builder.HasOne(x => x.Material)
            .WithMany(m => m.MaterialBrands)
            .HasForeignKey(x => x.MaterialId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Brand)
            .WithMany(b => b.MaterialBrands)
            .HasForeignKey(x => x.BrandId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
