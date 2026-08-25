namespace BayiPortal.Infrastructure.Email;

public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    /// <summary>false ise e-posta SMTP'ye gitmez; yalnızca loglanır (lokal/Docker geliştirme).</summary>
    public bool Enabled { get; set; }

    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "noreply@bayiportal.local";
    public string FromName { get; set; } = "Bayi Portalı";
}
