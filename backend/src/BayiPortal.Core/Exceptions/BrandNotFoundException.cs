// İstenen marka yoksa fırlatılır → HTTP 404.
namespace BayiPortal.Core.Exceptions;

public sealed class BrandNotFoundException : DomainException
{
    public BrandNotFoundException(int brandId)
        : base($"Marka bulunamadı. Id: {brandId}")
    {
        BrandId = brandId;
    }

    public int BrandId { get; }
}
