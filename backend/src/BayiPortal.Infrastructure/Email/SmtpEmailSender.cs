using BayiPortal.Application.Interfaces.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace BayiPortal.Infrastructure.Email;

/// <summary>
/// SMTP ile e-posta gönderir. Smtp:Enabled=false iken gerçek gönderim yapmaz;
/// konuyu/alıcıyı log'a yazar (Mailtrap/Gmail ayarlanana kadar geliştirme için).
/// </summary>
public sealed class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string plainBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            return;
        }

        if (!_options.Enabled)
        {
            _logger.LogInformation(
                "SMTP kapalı — e-posta gönderilmedi. To={To} Subject={Subject} Body={Body}",
                toEmail, subject, plainBody);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail.Trim()));
        message.Subject = subject;
        message.Body = new TextPart("plain") { Text = plainBody };

        using var client = new SmtpClient();
        try
        {
            var secure = _options.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
            await client.ConnectAsync(_options.Host, _options.Port, secure, cancellationToken);

            if (!string.IsNullOrWhiteSpace(_options.UserName))
            {
                await client.AuthenticateAsync(_options.UserName, _options.Password, cancellationToken);
            }

            await client.SendAsync(message, cancellationToken);
            _logger.LogInformation("E-posta gönderildi: {To} / {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            // Bildirim DB kaydı bozulmasın diye yutma; logla.
            _logger.LogError(ex, "E-posta gönderilemedi: {To} / {Subject}", toEmail, subject);
        }
        finally
        {
            if (client.IsConnected)
            {
                await client.DisconnectAsync(true, cancellationToken);
            }
        }
    }
}
