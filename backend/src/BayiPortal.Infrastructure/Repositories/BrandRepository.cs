using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Core.Entities;
using BayiPortal.Infrastructure.Data.Contexts;
using BayiPortal.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace BayiPortal.Infrastructure.Repositories;

public sealed class BrandRepository : IBrandRepository
{
    private readonly ApplicationDbContext _dbContext;

    public BrandRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Brand?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        _dbContext.Brands.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

    public async Task<List<Brand>> GetListAsync(CancellationToken cancellationToken = default) =>
        await _dbContext.Brands.OrderBy(b => b.Name).ToListAsync(cancellationToken);

    public Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalized = code.Trim().EscapeLikePattern();
        return _dbContext.Brands
            .Where(b => excludeId == null || b.Id != excludeId)
            .AnyAsync(b => EF.Functions.ILike(b.Code, normalized, LikePatternExtensions.EscapeCharacter), cancellationToken);
    }

    public void Add(Brand brand) => _dbContext.Brands.Add(brand);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}
