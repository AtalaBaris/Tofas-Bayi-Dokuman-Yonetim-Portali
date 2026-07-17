using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Enums;
using BayiPortal.Infrastructure.Data.Contexts;
using Microsoft.EntityFrameworkCore;

namespace BayiPortal.Infrastructure.Repositories;

public sealed class MaterialRepository : IMaterialRepository
{
    private readonly ApplicationDbContext _dbContext;

    public MaterialRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private IQueryable<Material> BaseQuery() =>
        _dbContext.Materials
            .Include(m => m.Category)
            .Include(m => m.MaterialBrands).ThenInclude(mb => mb.Brand);

    public Task<Material?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        BaseQuery().FirstOrDefaultAsync(m => m.Id == id, cancellationToken);

    public async Task<List<Material>> GetListAsync(
        int? categoryId,
        int? brandId,
        string? keyword,
        string? status,
        IReadOnlyCollection<int>? restrictToBrandIds,
        bool excludeExpired,
        CancellationToken cancellationToken = default)
    {
        var query = BaseQuery();

        if (categoryId.HasValue)
        {
            query = query.Where(m => m.CategoryId == categoryId.Value);
        }

        if (brandId.HasValue)
        {
            query = query.Where(m => m.MaterialBrands.Any(mb => mb.BrandId == brandId.Value));
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var pattern = $"%{keyword.Trim()}%";
            query = query.Where(m => EF.Functions.ILike(m.Title, pattern));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<MaterialStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(m => m.Status == parsedStatus);
        }

        if (restrictToBrandIds is not null)
        {
            query = query.Where(m => m.MaterialBrands.Any(mb => restrictToBrandIds.Contains(mb.BrandId)));
        }

        if (excludeExpired)
        {
            var now = DateTime.UtcNow;
            query = query.Where(m => m.ExpiresAt == null || m.ExpiresAt > now);
        }

        return await query.OrderByDescending(m => m.PublishedAt).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<int>> GetDealerBrandIdsAsync(int dealerId, CancellationToken cancellationToken = default) =>
        await _dbContext.DealerBrands
            .Where(db => db.DealerId == dealerId)
            .Select(db => db.BrandId)
            .ToListAsync(cancellationToken);

    public Task<bool> CategoryExistsAsync(int categoryId, CancellationToken cancellationToken = default) =>
        _dbContext.Categories.AnyAsync(c => c.Id == categoryId, cancellationToken);

    public async Task<IReadOnlyCollection<int>> GetExistingBrandIdsAsync(
        IReadOnlyCollection<int> brandIds, CancellationToken cancellationToken = default) =>
        await _dbContext.Brands
            .Where(b => brandIds.Contains(b.Id))
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);

    public void Add(Material material) => _dbContext.Materials.Add(material);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}
