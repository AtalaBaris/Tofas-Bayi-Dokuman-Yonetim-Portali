using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Core.Entities;
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

    public void Add(User user) => _dbContext.Users.Add(user);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);
}
