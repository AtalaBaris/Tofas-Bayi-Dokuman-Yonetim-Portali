// Materials: içerik metadata. Binary diskte; FileName orijinal, StoredFileName unique.
using BayiPortal.Core.Enums;

namespace BayiPortal.Core.Entities;

public class Material
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public MaterialStatus Status { get; set; } = MaterialStatus.Draft;
    public DateTime PublishedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? ScheduledPublishAt { get; set; }
    public RecurrenceKind RecurrenceKind { get; set; } = RecurrenceKind.None;
    /// <summary>Weekly: 0=Sunday … 6=Saturday (DateTime.DayOfWeek).</summary>
    public int? RecurrenceDayOfWeek { get; set; }
    /// <summary>MonthlyDay: 1–28.</summary>
    public int? RecurrenceDayOfMonth { get; set; }
    /// <summary>Tekrarlayan yayından üretilen Active kopyanın şablon Id'si.</summary>
    public int? ScheduleTemplateId { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Category Category { get; set; } = null!;
    public User Creator { get; set; } = null!;
    public Material? ScheduleTemplate { get; set; }
    public ICollection<Material> ScheduleInstances { get; set; } = new List<Material>();
    public ICollection<MaterialBrand> MaterialBrands { get; set; } = new List<MaterialBrand>();
    public ICollection<AccessLog> AccessLogs { get; set; } = new List<AccessLog>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
