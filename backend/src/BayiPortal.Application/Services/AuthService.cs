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
            await _accessLogService.LogAsync(null, request.Email, null, "Giriş", "Başarısız giriş denemesi.", "Başarısız", cancellationToken);
            throw new InvalidCredentialsException();
        }

        // Bayi kullanıcısı: bağlı bayi yoksa veya pasifse giriş yok (bayisiz / ölü bayi hesabı).
        if (user.Role == RoleType.DealerUser
            && (user.DealerId is null || user.Dealer is null || !user.Dealer.IsActive))
        {
            await _accessLogService.LogAsync(user.Id, user.Email, null, "Giriş", "Pasif veya tanımsız bayi ile giriş denemesi.", "Başarısız", cancellationToken);
            throw new InvalidCredentialsException();
        }

        var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
        {
            await _accessLogService.LogAsync(user.Id, user.Email, null, "Giriş", "Başarısız giriş denemesi.", "Başarısız", cancellationToken);
            throw new InvalidCredentialsException();
        }

        var token = _jwtTokenService.GenerateToken(user);

        await _accessLogService.LogAsync(user.Id, user.Email, null, "Giriş", "Sisteme başarıyla giriş yapıldı.", "Başarılı", cancellationToken);

        return new LoginResponse
        {
            Token = token,
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
}
