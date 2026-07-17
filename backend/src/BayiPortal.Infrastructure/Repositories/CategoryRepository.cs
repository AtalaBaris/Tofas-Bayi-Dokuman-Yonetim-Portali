using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Core.Entities;
using BayiPortal.Infrastructure.Data.Contexts;
using Microsoft.EntityFrameworkCore;

namespace BayiPortal.Infrastructure.Repositories;

public sealed class CategoryRepository : ICategoryRepository
{
    private readonly ApplicationDbContext _dbContext;

    public CategoryRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        _dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task<List<Category>> GetListAsync(CancellationToken cancellationToken = default) =>
        await _dbContext.Categories.OrderBy(c => c.Name).ToListAsync(cancellationToken);

    public void Add(Category category) => _dbContext.Categories.Add(category);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}
