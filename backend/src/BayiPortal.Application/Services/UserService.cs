using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Enums;
using BayiPortal.Core.Exceptions;
using Microsoft.AspNetCore.Identity;

namespace BayiPortal.Application.Services;

public sealed class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<User> _passwordHasher;

    public UserService(IUserRepository userRepository, IPasswordHasher<User> passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<List<UserResponse>> GetListAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetListAsync(cancellationToken);
        return users.Select(ToResponse).ToList();
    }

    public async Task<UserResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new UserNotFoundException(id);
        return ToResponse(user);
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Name, request.Email, request.Password, request.Role, request.DealerId, excludeId: null, cancellationToken);

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            Role = Enum.Parse<RoleType>(request.Role),
            DealerId = request.DealerId,
            IsActive = true
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _userRepository.Add(user);
        await _userRepository.SaveChangesAsync(cancellationToken);

        var saved = await _userRepository.GetByIdAsync(user.Id, cancellationToken)
            ?? throw new UserNotFoundException(user.Id);
        return ToResponse(saved);
    }

    public async Task<UserResponse> UpdateAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request.Name, email: null, password: null, request.Role, request.DealerId, excludeId: id, cancellationToken);

        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new UserNotFoundException(id);

        user.Name = request.Name;
        user.Role = Enum.Parse<RoleType>(request.Role);
        user.DealerId = request.DealerId;
        user.IsActive = request.IsActive;

        await _userRepository.SaveChangesAsync(cancellationToken);

        var saved = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new UserNotFoundException(id);
        return ToResponse(saved);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new UserNotFoundException(id);

        user.IsActive = false;
        await _userRepository.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateAsync(
        string name, string? email, string? password, string role, int? dealerId, int? excludeId, CancellationToken cancellationToken)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(name))
        {
            errors.Add("Ad zorunludur.");
        }

        if (email is not null)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                errors.Add("E-posta zorunludur.");
            }
            else if (await _userRepository.EmailExistsAsync(email, excludeId, cancellationToken))
            {
                errors.Add("Bu e-posta zaten kullanılıyor.");
            }
        }

        if (password is not null && string.IsNullOrWhiteSpace(password))
        {
            errors.Add("Şifre zorunludur.");
        }

        if (!Enum.TryParse<RoleType>(role, out _))
        {
            errors.Add("Geçersiz rol.");
        }
        else if (role == nameof(RoleType.DealerUser))
        {
            if (!dealerId.HasValue)
            {
                errors.Add("Bayi kullanıcısı için bayi seçilmelidir.");
            }
            else if (!await _userRepository.DealerExistsAsync(dealerId.Value, cancellationToken))
            {
                errors.Add("Seçilen bayi bulunamadı.");
            }
        }

        if (errors.Count > 0)
        {
            throw new ValidationException(string.Join(" ", errors));
        }
    }

    private static UserResponse ToResponse(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role.ToString(),
        DealerId = user.DealerId,
        DealerName = user.Dealer?.Name,
        IsActive = user.IsActive
    };
}
