namespace BayiPortal.Application.Interfaces.Services;

public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string plainBody, CancellationToken cancellationToken = default);
}
