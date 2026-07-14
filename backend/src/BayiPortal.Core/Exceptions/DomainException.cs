// Domain/iş kuralı hatalarının taban sınıfı. API middleware bunları anlamlı status'e çevirir.
namespace BayiPortal.Core.Exceptions;

public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message)
    {
    }
}
