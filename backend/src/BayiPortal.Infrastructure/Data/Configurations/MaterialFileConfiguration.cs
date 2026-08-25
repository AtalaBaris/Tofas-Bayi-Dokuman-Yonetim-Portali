// EF Fluent API: MaterialFiles tablosu için kolon uzunlukları, PK/FK ve indeks ayarları.
using BayiPortal.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BayiPortal.Infrastructure.Data.Configurations;

public class MaterialFileConfiguration : IEntityTypeConfiguration<MaterialFile>
{
    public void Configure(EntityTypeBuilder<MaterialFile> builder)
    {
        builder.ToTable("MaterialFiles");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FileName).HasMaxLength(260).IsRequired();
        builder.Property(x => x.StoredFileName).HasMaxLength(260).IsRequired();
        builder.Property(x => x.FilePath).HasMaxLength(500).IsRequired();
        builder.Property(x => x.MimeType).HasMaxLength(150).IsRequired();
        builder.Property(x => x.SortOrder).HasDefaultValue(0).IsRequired();

        builder.HasOne(x => x.Material)
            .WithMany(m => m.Files)
            .HasForeignKey(x => x.MaterialId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
