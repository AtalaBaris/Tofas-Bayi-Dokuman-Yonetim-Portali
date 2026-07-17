using System.Collections.Generic;

namespace BayiPortal.Application.DTOs.Responses;

public class AccessLogListResponse
{
    public List<AccessLogResponse> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
