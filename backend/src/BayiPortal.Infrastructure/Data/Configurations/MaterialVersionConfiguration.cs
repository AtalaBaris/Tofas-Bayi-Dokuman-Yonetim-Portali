using BayiPortal.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BayiPortal.Infrastructure.Data.Configurations;

public class MaterialVersionConfiguration : IEntityTypeConfiguration<MaterialVersion>
{
    public void Configure(EntityTypeBuilder<MaterialVersion> builder)
    {
        builder.ToTable("MaterialVersions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.VersionLabel).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.ChangeNote).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.FileName).HasMaxLength(300).IsRequired();
        builder.Property(x => x.StoredFileName).HasMaxLength(300).IsRequired();
        builder.Property(x => x.FilePath).HasMaxLength(500).IsRequired();
        builder.Property(x => x.MimeType).HasMaxLength(100).IsRequired();

        builder.HasOne(x => x.Material)
            .WithMany(m => m.Versions)
            .HasForeignKey(x => x.MaterialId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Creator)
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
