// EF Fluent API: DealerBrand tablosu için kolon uzunlukları, PK/FK ve indeks ayarları.
using BayiPortal.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BayiPortal.Infrastructure.Data.Configurations;

public class DealerBrandConfiguration : IEntityTypeConfiguration<DealerBrand>
{
    public void Configure(EntityTypeBuilder<DealerBrand> builder)
    {
        builder.ToTable("DealerBrands");
        builder.HasKey(x => new { x.DealerId, x.BrandId });

        builder.HasOne(x => x.Dealer)
            .WithMany(d => d.DealerBrands)
            .HasForeignKey(x => x.DealerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Brand)
            .WithMany(b => b.DealerBrands)
            .HasForeignKey(x => x.BrandId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
