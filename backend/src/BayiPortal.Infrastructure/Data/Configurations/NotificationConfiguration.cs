using BayiPortal.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BayiPortal.Infrastructure.Data.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Kind).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Body).HasMaxLength(1000).IsRequired();

        builder.HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAt });

        builder.HasOne(x => x.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Material)
            .WithMany(m => m.Notifications)
            .HasForeignKey(x => x.MaterialId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
