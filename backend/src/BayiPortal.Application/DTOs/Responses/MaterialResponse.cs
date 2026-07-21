namespace BayiPortal.Application.DTOs.Responses;

public class MaterialResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Status { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public DateTime PublishedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? ScheduledPublishAt { get; set; }
    public string RecurrenceKind { get; set; } = "None";
    public int? RecurrenceDayOfWeek { get; set; }
    public int? RecurrenceDayOfMonth { get; set; }
    public int? ScheduleTemplateId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<int> BrandIds { get; set; } = new();
    public List<string> BrandNames { get; set; } = new();
    public List<MaterialBrandBadgeResponse> Brands { get; set; } = new();
    public string CreatedByName { get; set; } = string.Empty;

    /// <summary>
    /// İsteği atan kullanıcının bu materyale erişim durumu: "unread" | "viewed" | "downloaded".
    /// Yalnızca DealerUser rolü için AccessLogs'tan hesaplanır; Admin/ContentManager için her
    /// zaman "unread" döner (onlar için anlamlı bir kavram değil).
    /// </summary>
    public string MyAccessStatus { get; set; } = "unread";

    /// <summary>Bu materyali görüntülemiş benzersiz kullanıcı sayısı (AccessLog "Döküman Görüntüleme" kayıtlarından).</summary>
    public int ViewedCount { get; set; }

    /// <summary>Hedef kitle: materyalin markalarıyla eşleşen bayilerdeki aktif DealerUser sayısı.</summary>
    public int AudienceCount { get; set; }
}
