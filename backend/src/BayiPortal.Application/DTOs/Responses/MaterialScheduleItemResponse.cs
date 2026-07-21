namespace BayiPortal.Application.DTOs.Responses;

public class MaterialScheduleItemResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime At { get; set; }
    public string RecurrenceKind { get; set; } = "None";
    public int? RecurrenceDayOfWeek { get; set; }
    public int? RecurrenceDayOfMonth { get; set; }
    public List<int> BrandIds { get; set; } = new();
}
