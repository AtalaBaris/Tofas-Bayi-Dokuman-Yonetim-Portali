// İstenen bayi yoksa fırlatılır → HTTP 404.
namespace BayiPortal.Core.Exceptions;

public sealed class DealerNotFoundException : DomainException
{
    public DealerNotFoundException(int dealerId)
        : base($"Bayi bulunamadı. Id: {dealerId}")
    {
        DealerId = dealerId;
    }

    public int DealerId { get; }
}
