namespace BayiPortal.Application.DTOs.Responses;

public class AccessLogTrendPointResponse
{
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class AccessLogTrendResponse
{
    public List<AccessLogTrendPointResponse> Points { get; set; } = new();
}
