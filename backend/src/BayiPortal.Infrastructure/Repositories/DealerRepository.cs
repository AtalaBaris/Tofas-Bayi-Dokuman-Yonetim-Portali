using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Core.Entities;
using BayiPortal.Infrastructure.Data.Contexts;
using BayiPortal.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace BayiPortal.Infrastructure.Repositories;

public sealed class DealerRepository : IDealerRepository
{
    private readonly ApplicationDbContext _dbContext;

    public DealerRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private IQueryable<Dealer> BaseQuery() =>
        _dbContext.Dealers
            .Include(d => d.DealerBrands).ThenInclude(db => db.Brand);

    public Task<Dealer?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        BaseQuery().FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

    public async Task<List<Dealer>> GetListAsync(CancellationToken cancellationToken = default) =>
        await BaseQuery().OrderBy(d => d.Name).ToListAsync(cancellationToken);

    public Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalized = code.Trim().EscapeLikePattern();
        return _dbContext.Dealers
            .Where(d => excludeId == null || d.Id != excludeId)
            .AnyAsync(d => EF.Functions.ILike(d.Code, normalized, LikePatternExtensions.EscapeCharacter), cancellationToken);
    }

    public async Task<IReadOnlyCollection<int>> GetExistingBrandIdsAsync(
        IReadOnlyCollection<int> brandIds, CancellationToken cancellationToken = default) =>
        await _dbContext.Brands
            .Where(b => brandIds.Contains(b.Id))
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);

    public void Add(Dealer dealer) => _dbContext.Dealers.Add(dealer);

    public void Remove(Dealer dealer) => _dbContext.Dealers.Remove(dealer);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}
