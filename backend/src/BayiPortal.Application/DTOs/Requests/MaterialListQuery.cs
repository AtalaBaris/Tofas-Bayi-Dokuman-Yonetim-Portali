namespace BayiPortal.Application.DTOs.Requests;

public class MaterialListQuery
{
    public int? CategoryId { get; set; }
    public int? BrandId { get; set; }
    public string? Keyword { get; set; }
    public string? Status { get; set; }
}
