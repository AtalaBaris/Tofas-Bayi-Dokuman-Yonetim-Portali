namespace BayiPortal.Application.DTOs.Requests;

public class CreateDealerRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? Phone { get; set; }
    public string? ContactInfo { get; set; }
    public List<int> BrandIds { get; set; } = new();

    /// <summary>
    /// Bayi oluştururken zorunlu ilk DealerUser. Kullanıcı olmadan bayi bırakılamaz.
    /// </summary>
    public CreateDealerInitialUserRequest? InitialUser { get; set; }
}

public class CreateDealerInitialUserRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
