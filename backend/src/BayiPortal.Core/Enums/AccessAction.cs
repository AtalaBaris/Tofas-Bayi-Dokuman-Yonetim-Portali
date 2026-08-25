// Erişim kaydı aksiyonları: doküman hareketleri + oturum açma/kapama.
namespace BayiPortal.Core.Enums;

public enum AccessAction
{
    View = 1,
    Download = 2,
    Upload = 3,
    Update = 4,
    Archive = 5,
    VersionChange = 6,
    Login = 7,
    Logout = 8
}
