using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Exceptions;

namespace BayiPortal.Application.Services;

public sealed class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<List<CategoryResponse>> GetListAsync(CancellationToken cancellationToken = default)
    {
        var categories = await _categoryRepository.GetListAsync(cancellationToken);
        return categories.Select(ToResponse).ToList();
    }

    public async Task<CategoryResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new CategoryNotFoundException(id);
        return ToResponse(category);
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        Validate(request.Name);

        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            IsActive = true
        };

        _categoryRepository.Add(category);
        await _categoryRepository.SaveChangesAsync(cancellationToken);

        return ToResponse(category);
    }

    public async Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        Validate(request.Name);

        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new CategoryNotFoundException(id);

        category.Name = request.Name;
        category.Description = request.Description;
        category.IsActive = request.IsActive;

        await _categoryRepository.SaveChangesAsync(cancellationToken);

        return ToResponse(category);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new CategoryNotFoundException(id);

        category.IsActive = false;
        await _categoryRepository.SaveChangesAsync(cancellationToken);
    }

    private static void Validate(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ValidationException("Kategori adı zorunludur.");
        }
    }

    private static CategoryResponse ToResponse(Category category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Description = category.Description,
        IsActive = category.IsActive
    };
}
