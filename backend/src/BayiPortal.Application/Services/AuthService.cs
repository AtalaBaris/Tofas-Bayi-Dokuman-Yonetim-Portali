using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Repositories;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Enums;
using BayiPortal.Core.Exceptions;
using Microsoft.AspNetCore.Identity;

namespace BayiPortal.Application.Services;

public sealed class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IAccessLogService _accessLogService;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher<User> passwordHasher,
        IJwtTokenService jwtTokenService,
        IAccessLogService accessLogService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _accessLogService = accessLogService;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        // Kullanıcı yok / pasif / şifre yanlış — hepsi aynı genel mesajla döner (enumeration engeli).
        if (user is null || !user.IsActive)
        {
            await _accessLogService.LogAsync(null, request.Email, null, AccessAction.Login, "Başarısız giriş denemesi.", AccessResult.Failed, cancellationToken);
            throw new InvalidCredentialsException();
        }

        // Bayi kullanıcısı: bağlı bayi yoksa veya pasifse giriş yok (bayisiz / ölü bayi hesabı).
        if (user.Role == RoleType.DealerUser
            && (user.DealerId is null || user.Dealer is null || !user.Dealer.IsActive))
        {
            await _accessLogService.LogAsync(user.Id, user.Email, null, AccessAction.Login, "Pasif veya tanımsız bayi ile giriş denemesi.", AccessResult.Failed, cancellationToken);
            throw new InvalidCredentialsException();
        }

        var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
        {
            await _accessLogService.LogAsync(user.Id, user.Email, null, AccessAction.Login, "Başarısız giriş denemesi.", AccessResult.Failed, cancellationToken);
            throw new InvalidCredentialsException();
        }

        var token = _jwtTokenService.GenerateToken(user);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        await _userRepository.SaveChangesAsync(cancellationToken);

        await _accessLogService.LogAsync(user.Id, user.Email, null, AccessAction.Login, "Sisteme başarıyla giriş yapıldı.", AccessResult.Success, cancellationToken);

        return new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            User = new UserResponse
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.ToString(),
                DealerId = user.DealerId,
                DealerName = user.Dealer?.Name,
                IsActive = user.IsActive
            }
        };
    }

    public async Task<RefreshTokenResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request?.RefreshToken))
        {
            throw new InvalidCredentialsException();
        }

        var users = await _userRepository.GetListAsync(cancellationToken);
        var user = users.FirstOrDefault(u =>
            u.IsActive &&
            u.RefreshToken == request.RefreshToken &&
            u.RefreshTokenExpiresAt.HasValue &&
            u.RefreshTokenExpiresAt.Value > DateTime.UtcNow);

        if (user is null)
        {
            throw new InvalidCredentialsException();
        }

        if (user.Role == RoleType.DealerUser
            && (user.DealerId is null || user.Dealer is null || !user.Dealer.IsActive))
        {
            throw new InvalidCredentialsException();
        }

        var token = _jwtTokenService.GenerateToken(user);
        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        await _userRepository.SaveChangesAsync(cancellationToken);

        return new RefreshTokenResponse
        {
            Token = token,
            RefreshToken = newRefreshToken
        };
    }
}
