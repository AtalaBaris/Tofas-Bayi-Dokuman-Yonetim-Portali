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
            .Include(m => m.Creator)
            .Include(m => m.MaterialBrands).ThenInclude(mb => mb.Brand)
            .Include(m => m.Files);

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

        return await query
            .OrderByDescending(m => m.ScheduledPublishAt ?? m.PublishedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Material>> GetDueScheduledAsync(
        DateTime utcNow, int take, CancellationToken cancellationToken = default) =>
        await BaseQuery()
            .Where(m => m.Status == MaterialStatus.Scheduled
                        && m.ScheduledPublishAt != null
                        && m.ScheduledPublishAt <= utcNow)
            .OrderBy(m => m.ScheduledPublishAt)
            .Take(take)
            .ToListAsync(cancellationToken);

    public async Task<List<Material>> GetScheduleCalendarAsync(
        DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default)
    {
        return await BaseQuery()
            .Where(m =>
                (m.Status == MaterialStatus.Scheduled
                 && m.ScheduledPublishAt != null
                 && m.ScheduledPublishAt >= fromUtc
                 && m.ScheduledPublishAt < toUtc)
                ||
                (m.Status == MaterialStatus.Active
                 && m.PublishedAt >= fromUtc
                 && m.PublishedAt < toUtc))
            .OrderBy(m => m.ScheduledPublishAt ?? m.PublishedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<int>> GetDealerBrandIdsAsync(int dealerId, CancellationToken cancellationToken = default) =>
        await _dbContext.DealerBrands
            .Where(db => db.DealerId == dealerId)
            .Select(db => db.BrandId)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<int>> GetActiveDealerUserIdsForBrandsAsync(
        IReadOnlyCollection<int> brandIds, CancellationToken cancellationToken = default)
    {
        if (brandIds.Count == 0)
        {
            return Array.Empty<int>();
        }

        return await _dbContext.Users
            .Where(u => u.IsActive
                        && u.Role == RoleType.DealerUser
                        && u.DealerId != null
                        && u.Dealer!.IsActive
                        && _dbContext.DealerBrands.Any(db =>
                            db.DealerId == u.DealerId && brandIds.Contains(db.BrandId)))
            .Select(u => u.Id)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public Task<bool> CategoryExistsAsync(int categoryId, CancellationToken cancellationToken = default) =>
        _dbContext.Categories.AnyAsync(c => c.Id == categoryId, cancellationToken);

    public async Task<IReadOnlyCollection<int>> GetExistingBrandIdsAsync(
        IReadOnlyCollection<int> brandIds, CancellationToken cancellationToken = default) =>
        await _dbContext.Brands
            .Where(b => brandIds.Contains(b.Id))
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);

    public async Task<Dictionary<int, int>> GetViewedCountsAsync(
        IReadOnlyCollection<int> materialIds, CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.AccessLogs
            .Where(a => a.MaterialId != null && a.UserId != null
                && materialIds.Contains(a.MaterialId.Value) && a.Action == AccessAction.View)
            .Select(a => new { MaterialId = a.MaterialId!.Value, UserId = a.UserId!.Value })
            .Distinct()
            .ToListAsync(cancellationToken);

        return rows.GroupBy(r => r.MaterialId).ToDictionary(g => g.Key, g => g.Count());
    }

    public async Task<Dictionary<int, int>> GetAudienceCountsAsync(
        IReadOnlyCollection<int> materialIds, CancellationToken cancellationToken = default)
    {
        var rows = await (
            from mb in _dbContext.MaterialBrands
            where materialIds.Contains(mb.MaterialId)
            join db in _dbContext.DealerBrands on mb.BrandId equals db.BrandId
            join u in _dbContext.Users on db.DealerId equals u.DealerId
            where u.Role == RoleType.DealerUser && u.IsActive
            select new { mb.MaterialId, u.Id })
            .Distinct()
            .ToListAsync(cancellationToken);

        return rows.GroupBy(r => r.MaterialId).ToDictionary(g => g.Key, g => g.Count());
    }

    public void Add(Material material) => _dbContext.Materials.Add(material);

    public Task<List<MaterialVersion>> GetVersionsAsync(int materialId, CancellationToken cancellationToken = default) =>
        _dbContext.MaterialVersions
            .Include(v => v.Creator)
            .Where(v => v.MaterialId == materialId)
            .OrderByDescending(v => v.VersionNumber)
            .ToListAsync(cancellationToken);

    public Task<MaterialVersion?> GetVersionByIdAsync(int materialId, int versionId, CancellationToken cancellationToken = default) =>
        _dbContext.MaterialVersions
            .Include(v => v.Creator)
            .FirstOrDefaultAsync(v => v.MaterialId == materialId && v.Id == versionId, cancellationToken);

    public void AddVersion(MaterialVersion version) => _dbContext.MaterialVersions.Add(version);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}
