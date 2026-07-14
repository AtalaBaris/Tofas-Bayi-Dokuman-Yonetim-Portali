// Marka/yetki yoksa fırlatılır → genelde HTTP 403.
namespace BayiPortal.Core.Exceptions;

public sealed class ForbiddenAccessException : DomainException
{
    public ForbiddenAccessException(string message = "Bu içeriğe erişim yetkiniz yok.")
        : base(message)
    {
    }
}
