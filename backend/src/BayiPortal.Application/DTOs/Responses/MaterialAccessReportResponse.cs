namespace BayiPortal.Application.DTOs.Responses;

public class MaterialAccessReportItemResponse
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string DealerName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
}

public class MaterialAccessReportResponse
{
    public int MaterialId { get; set; }
    public List<MaterialAccessReportItemResponse> Items { get; set; } = new();
}
