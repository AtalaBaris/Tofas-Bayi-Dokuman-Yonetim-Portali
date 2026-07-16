// Hatalı e-posta/şifre veya pasif kullanıcı girişinde fırlatılır → HTTP 401.
namespace BayiPortal.Core.Exceptions;

public sealed class InvalidCredentialsException : DomainException
{
    public InvalidCredentialsException(string message = "E-posta veya şifre hatalı.")
        : base(message)
    {
    }
}
