using BayiPortal.Core.Entities;

namespace BayiPortal.Application.Interfaces.Services;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}
