// İstenen materyal dosyası yoksa fırlatılır → HTTP 404.
namespace BayiPortal.Core.Exceptions;

public sealed class MaterialFileNotFoundException : DomainException
{
    public MaterialFileNotFoundException(int materialId, int fileId)
        : base($"Döküman dosyası bulunamadı. MaterialId: {materialId}, FileId: {fileId}")
    {
        MaterialId = materialId;
        FileId = fileId;
    }

    public int MaterialId { get; }
    public int FileId { get; }
}
