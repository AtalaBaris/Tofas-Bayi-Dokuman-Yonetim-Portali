// İstenen kategori yoksa fırlatılır → HTTP 404.
namespace BayiPortal.Core.Exceptions;

public sealed class CategoryNotFoundException : DomainException
{
    public CategoryNotFoundException(int categoryId)
        : base($"Kategori bulunamadı. Id: {categoryId}")
    {
        CategoryId = categoryId;
    }

    public int CategoryId { get; }
}
