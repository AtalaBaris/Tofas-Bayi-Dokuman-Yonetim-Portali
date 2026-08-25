namespace BayiPortal.Application.DTOs.Requests;

public class UpdateMaterialScheduleRequest
{
    public DateTime ScheduledPublishAt { get; set; }
    /// <summary>None | Weekly | MonthlyDay</summary>
    public string? RecurrenceKind { get; set; }
    public int? RecurrenceDayOfWeek { get; set; }
    public int? RecurrenceDayOfMonth { get; set; }
}
