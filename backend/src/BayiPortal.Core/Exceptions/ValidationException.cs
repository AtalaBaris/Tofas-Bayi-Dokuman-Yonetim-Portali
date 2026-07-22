// Girdi (Create/Update DTO) kural ihlallerinde fırlatılır → HTTP 400.
namespace BayiPortal.Core.Exceptions;

public sealed class ValidationException : DomainException
{
    public ValidationException(string message) : base(message)
    {
    }
}
