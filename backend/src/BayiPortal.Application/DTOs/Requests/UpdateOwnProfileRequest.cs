namespace BayiPortal.Application.DTOs.Requests;

/// <summary>Self-service profil güncelleme — Role/DealerId/IsActive burada yok, sadece Admin kullanıcı yönetiminde değişir.</summary>
public class UpdateOwnProfileRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
}
