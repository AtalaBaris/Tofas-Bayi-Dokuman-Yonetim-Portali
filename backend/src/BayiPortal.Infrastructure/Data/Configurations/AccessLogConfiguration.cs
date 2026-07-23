// EF Fluent API: AccessLog tablosu için kolon uzunlukları, PK/FK ve indeks ayarları.
using BayiPortal.Core.Entities;
using BayiPortal.Infrastructure.Data.Conversions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BayiPortal.Infrastructure.Data.Configurations;

public class AccessLogConfiguration : IEntityTypeConfiguration<AccessLog>
{
    public void Configure(EntityTypeBuilder<AccessLog> builder)
    {
        builder.ToTable("AccessLogs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Action).HasConversion<AccessActionConverter>().HasMaxLength(50).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(512).IsRequired();
        builder.Property(x => x.LoginStatus).HasConversion<AccessResultConverter>().HasMaxLength(50);
        builder.Property(x => x.UserName).HasMaxLength(256);
        builder.Property(x => x.IpAddress).HasMaxLength(64).IsRequired();
        builder.Property(x => x.UserAgent).HasMaxLength(512);

        builder.HasIndex(x => x.ViewedAtUtc);
        builder.HasIndex(x => new { x.Action, x.ViewedAtUtc });
        builder.HasIndex(x => new { x.LoginStatus, x.ViewedAtUtc });

        builder.HasOne(x => x.User)
            .WithMany(u => u.AccessLogs)
            .HasForeignKey(x => x.UserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Material)
            .WithMany(m => m.AccessLogs)
            .HasForeignKey(x => x.MaterialId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.MaterialFile)
            .WithMany(mf => mf.AccessLogs)
            .HasForeignKey(x => x.MaterialFileId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
