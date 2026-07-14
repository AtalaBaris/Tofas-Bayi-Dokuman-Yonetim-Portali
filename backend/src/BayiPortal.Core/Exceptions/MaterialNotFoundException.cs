// İstenen içerik yoksa fırlatılır → genelde HTTP 404.
namespace BayiPortal.Core.Exceptions;

public sealed class MaterialNotFoundException : DomainException
{
    public MaterialNotFoundException(int materialId)
        : base($"İçerik bulunamadı. Id: {materialId}")
    {
        MaterialId = materialId;
    }

    public int MaterialId { get; }
}
