using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;

namespace BayiPortal.Application.Interfaces.Services;

public interface ICategoryService
{
    Task<List<CategoryResponse>> GetListAsync(CancellationToken cancellationToken = default);

    Task<CategoryResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default);

    Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken = default);

    Task DeactivateAsync(int id, CancellationToken cancellationToken = default);
}
