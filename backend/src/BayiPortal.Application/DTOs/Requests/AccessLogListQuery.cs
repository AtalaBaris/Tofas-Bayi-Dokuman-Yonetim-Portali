namespace BayiPortal.Application.DTOs.Requests;

public class AccessLogListQuery
{
    public string? Keyword { get; set; }
    public string? Role { get; set; }
    public string? Action { get; set; }
    public string? Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;

    /// <summary>
    /// ContentManager kısıtlaması: Giriş/Çıkış loglarını filtre dışı bırakır.
    /// </summary>
    public bool ExcludeAuthLogs { get; set; }
}
