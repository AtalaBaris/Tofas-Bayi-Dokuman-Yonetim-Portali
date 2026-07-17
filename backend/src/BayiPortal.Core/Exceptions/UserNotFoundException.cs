// İstenen kullanıcı yoksa fırlatılır → HTTP 404.
namespace BayiPortal.Core.Exceptions;

public sealed class UserNotFoundException : DomainException
{
    public UserNotFoundException(int userId)
        : base($"Kullanıcı bulunamadı. Id: {userId}")
    {
        UserId = userId;
    }

    public int UserId { get; }
}
