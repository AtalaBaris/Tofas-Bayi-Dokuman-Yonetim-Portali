using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Enums;
using BayiPortal.Core.Exceptions;
using Microsoft.AspNetCore.Identity;

namespace BayiPortal.Application.Services;

public sealed class DealerService : IDealerService
{
    private readonly IDealerRepository _dealerRepository;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<User> _passwordHasher;

    public DealerService(
        IDealerRepository dealerRepository,
        IUserRepository userRepository,
        IPasswordHasher<User> passwordHasher)
    {
        _dealerRepository = dealerRepository;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<List<DealerResponse>> GetListAsync(CancellationToken cancellationToken = default)
    {
        var dealers = await _dealerRepository.GetListAsync(cancellationToken);
        var counts = await _userRepository.GetActiveDealerUserCountsAsync(cancellationToken);
        return dealers.Select(d => ToResponse(d, counts.GetValueOrDefault(d.Id))).ToList();
    }

    public async Task<DealerResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var dealer = await _dealerRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DealerNotFoundException(id);
        var count = await _userRepository.CountActiveDealerUsersAsync(id, excludeUserId: null, cancellationToken);
        return ToResponse(dealer, count);
    }

    public async Task<DealerResponse> CreateAsync(CreateDealerRequest request, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Name, request.Code, request.BrandIds, excludeId: null, cancellationToken);
        await ValidateInitialUserAsync(request.InitialUser, cancellationToken);

        var initial = request.InitialUser!;
        var dealer = new Dealer
        {
            Name = request.Name.Trim(),
            Code = request.Code.Trim(),
            IsActive = true,
            DealerBrands = request.BrandIds.Distinct().Select(brandId => new DealerBrand { BrandId = brandId }).ToList()
        };

        var user = new User
        {
            Name = initial.Name.Trim(),
            Email = initial.Email.Trim().ToLowerInvariant(),
            Role = RoleType.DealerUser,
            Dealer = dealer,
            IsActive = true
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, initial.Password);

        _dealerRepository.Add(dealer);
        _userRepository.Add(user);
        // Aynı DbContext: tek SaveChanges ile bayi + kullanıcı atomik oluşur.
        await _dealerRepository.SaveChangesAsync(cancellationToken);

        var saved = await _dealerRepository.GetByIdAsync(dealer.Id, cancellationToken)
            ?? throw new DealerNotFoundException(dealer.Id);
        return ToResponse(saved, activeUserCount: 1);
    }

    public async Task<DealerResponse> UpdateAsync(int id, UpdateDealerRequest request, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Name, request.Code, request.BrandIds, excludeId: id, cancellationToken);

        var dealer = await _dealerRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DealerNotFoundException(id);

        var activating = request.IsActive && !dealer.IsActive;

        if (activating)
        {
            var totalUsers = await _userRepository.CountDealerUsersAsync(id, cancellationToken);
            if (totalUsers == 0)
            {
                throw new ValidationException(
                    "Bu bayinin kullanıcısı yok. Önce en az bir bayi kullanıcısı ekleyin, sonra bayiyi aktifleştirin.");
            }

            // Bayi tekrar açılırken bağlı kullanıcılar da birlikte aktifleşir (orphan kalmasın).
            await _userRepository.ReactivateDealerUsersAsync(id, cancellationToken);
        }
        else if (!request.IsActive)
        {
            // Bayi kapanınca kullanıcılar da kapanır — kullanıcıssız aktif bayi / bayisiz aktif kullanıcı olmaz.
            await _userRepository.DeactivateDealerUsersAsync(id, cancellationToken);
        }

        dealer.Name = request.Name;
        dealer.Code = request.Code;
        dealer.IsActive = request.IsActive;

        dealer.DealerBrands.Clear();
        foreach (var brandId in request.BrandIds.Distinct())
        {
            dealer.DealerBrands.Add(new DealerBrand { DealerId = id, BrandId = brandId });
        }

        await _dealerRepository.SaveChangesAsync(cancellationToken);

        var saved = await _dealerRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DealerNotFoundException(id);
        var activeUserCount = request.IsActive
            ? await _userRepository.CountActiveDealerUsersAsync(id, excludeUserId: null, cancellationToken)
            : 0;
        return ToResponse(saved, activeUserCount);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var dealer = await _dealerRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DealerNotFoundException(id);

        var users = await _userRepository.GetDealerUsersAsync(id, cancellationToken);
        var userIds = users.Select(u => u.Id).ToList();
        if (await _userRepository.AnyMaterialsCreatedByAsync(userIds, cancellationToken))
        {
            throw new ValidationException(
                "Bu bayinin kullanıcıları sistemde içerik oluşturduğu için kalıcı silinemez. Bayiyi pasife alabilirsiniz; kullanıcılar da birlikte pasife alınır.");
        }

        if (users.Count > 0)
        {
            _userRepository.RemoveRange(users);
        }

        _dealerRepository.Remove(dealer);
        await _dealerRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var dealer = await _dealerRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DealerNotFoundException(id);

        dealer.IsActive = false;
        await _userRepository.DeactivateDealerUsersAsync(id, cancellationToken);
        await _dealerRepository.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateInitialUserAsync(
        CreateDealerInitialUserRequest? initialUser, CancellationToken cancellationToken)
    {
        if (initialUser is null)
        {
            throw new ValidationException(
                "Bayi oluştururken en az bir kullanıcı tanımlamanız zorunludur. Aksi halde bu bayiye kimse giriş yapamaz.");
        }

        var errors = new List<string>();
        var name = initialUser.Name?.Trim() ?? string.Empty;
        var email = initialUser.Email?.Trim() ?? string.Empty;
        var password = initialUser.Password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
        {
            errors.Add("İlk kullanıcı adı zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            errors.Add("İlk kullanıcı e-postası zorunludur.");
        }
        else if (await _userRepository.EmailExistsAsync(email, excludeId: null, cancellationToken))
        {
            errors.Add("Bu e-posta zaten kullanılıyor.");
        }

        if (string.IsNullOrWhiteSpace(password))
        {
            errors.Add("İlk kullanıcı şifresi zorunludur.");
        }
        else if (password.Length < 6)
        {
            errors.Add("Şifre en az 6 karakter olmalıdır.");
        }

        if (errors.Count > 0)
        {
            throw new ValidationException(string.Join(" ", errors));
        }
    }

    private async Task ValidateAsync(
        string name, string code, List<int> brandIds, int? excludeId, CancellationToken cancellationToken)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors.Add("Bayi adı zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            errors.Add("Bayi kodu zorunludur.");
        }
        else if (await _dealerRepository.CodeExistsAsync(code, excludeId, cancellationToken))
        {
            errors.Add("Bu bayi kodu zaten kullanılıyor.");
        }

        // Yeni bayide marka yoksa kullanıcı giriş yapsa bile içerik göremez — oluştururken zorunlu.
        if (excludeId is null && brandIds.Count == 0)
        {
            errors.Add("Bayiye en az bir marka atanmalıdır. Aksi halde kullanıcılar hiçbir doküman göremez.");
        }

        var distinctBrandIds = brandIds.Distinct().ToList();
        if (distinctBrandIds.Count > 0)
        {
            var existingBrandIds = await _dealerRepository.GetExistingBrandIdsAsync(distinctBrandIds, cancellationToken);
            var missingBrandIds = distinctBrandIds.Except(existingBrandIds).ToList();
            if (missingBrandIds.Count > 0)
            {
                errors.Add($"Geçersiz marka id'leri: {string.Join(", ", missingBrandIds)}.");
            }
        }

        if (errors.Count > 0)
        {
            throw new ValidationException(string.Join(" ", errors));
        }
    }

    private static DealerResponse ToResponse(Dealer dealer, int activeUserCount) => new()
    {
        Id = dealer.Id,
        Name = dealer.Name,
        Code = dealer.Code,
        IsActive = dealer.IsActive,
        BrandIds = dealer.DealerBrands.Select(db => db.BrandId).ToList(),
        BrandNames = dealer.DealerBrands.Select(db => db.Brand.Name).ToList(),
        ActiveUserCount = activeUserCount
    };
}
