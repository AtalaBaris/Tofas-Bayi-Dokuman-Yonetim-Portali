using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Enums;
using BayiPortal.Infrastructure.Data.Contexts;
using Microsoft.EntityFrameworkCore;

namespace BayiPortal.Infrastructure.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _dbContext;

    public UserRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return _dbContext.Users
            .Include(u => u.Dealer)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalized, cancellationToken);
    }

    public Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        _dbContext.Users.Include(u => u.Dealer).FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

    public async Task<List<User>> GetListAsync(CancellationToken cancellationToken = default) =>
        await _dbContext.Users.Include(u => u.Dealer).OrderBy(u => u.Name).ToListAsync(cancellationToken);

    public Task<bool> EmailExistsAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return _dbContext.Users
            .Where(u => excludeId == null || u.Id != excludeId)
            .AnyAsync(u => u.Email.ToLower() == normalized, cancellationToken);
    }

    public Task<bool> DealerExistsAsync(int dealerId, CancellationToken cancellationToken = default) =>
        _dbContext.Dealers.AnyAsync(d => d.Id == dealerId, cancellationToken);

    public Task<int> CountActiveDealerUsersAsync(
        int dealerId, int? excludeUserId = null, CancellationToken cancellationToken = default)
    {
        return _dbContext.Users.CountAsync(
            u => u.DealerId == dealerId
                 && u.IsActive
                 && u.Role == RoleType.DealerUser
                 && (excludeUserId == null || u.Id != excludeUserId),
            cancellationToken);
    }

    public Task<int> CountDealerUsersAsync(int dealerId, CancellationToken cancellationToken = default) =>
        _dbContext.Users.CountAsync(
            u => u.DealerId == dealerId && u.Role == RoleType.DealerUser,
            cancellationToken);

    public async Task<Dictionary<int, int>> GetActiveDealerUserCountsAsync(
        CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.Users
            .Where(u => u.DealerId != null && u.IsActive && u.Role == RoleType.DealerUser)
            .GroupBy(u => u.DealerId!.Value)
            .Select(g => new { DealerId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return rows.ToDictionary(r => r.DealerId, r => r.Count);
    }

    public async Task DeactivateDealerUsersAsync(int dealerId, CancellationToken cancellationToken = default)
    {
        var users = await _dbContext.Users
            .Where(u => u.DealerId == dealerId && u.Role == RoleType.DealerUser && u.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var user in users)
        {
            user.IsActive = false;
        }
    }

    public async Task ReactivateDealerUsersAsync(int dealerId, CancellationToken cancellationToken = default)
    {
        var users = await _dbContext.Users
            .Where(u => u.DealerId == dealerId && u.Role == RoleType.DealerUser && !u.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var user in users)
        {
            user.IsActive = true;
        }
    }

    public async Task<List<User>> GetDealerUsersAsync(int dealerId, CancellationToken cancellationToken = default) =>
        await _dbContext.Users
            .Where(u => u.DealerId == dealerId && u.Role == RoleType.DealerUser)
            .ToListAsync(cancellationToken);

    public Task<bool> AnyMaterialsCreatedByAsync(
        IReadOnlyCollection<int> userIds, CancellationToken cancellationToken = default)
    {
        if (userIds.Count == 0)
        {
            return Task.FromResult(false);
        }

        return _dbContext.Materials.AnyAsync(m => userIds.Contains(m.CreatedBy), cancellationToken);
    }

    public void RemoveRange(IEnumerable<User> users) => _dbContext.Users.RemoveRange(users);

    public void Remove(User user) => _dbContext.Users.Remove(user);

    public void Add(User user) => _dbContext.Users.Add(user);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}
