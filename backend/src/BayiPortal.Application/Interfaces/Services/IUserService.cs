using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;

namespace BayiPortal.Application.Interfaces.Services;

public interface IUserService
{
    Task<List<UserResponse>> GetListAsync(CancellationToken cancellationToken = default);

    Task<UserResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default);

    Task<UserResponse> UpdateAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    Task DeactivateAsync(int id, CancellationToken cancellationToken = default);

    Task<UserResponse> GetOwnProfileAsync(int userId, CancellationToken cancellationToken = default);

    Task<UserResponse> UpdateOwnProfileAsync(
        int userId, UpdateOwnProfileRequest request, CancellationToken cancellationToken = default);
}
