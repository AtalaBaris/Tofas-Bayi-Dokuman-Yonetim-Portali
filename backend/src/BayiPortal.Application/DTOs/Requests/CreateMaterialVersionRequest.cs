namespace BayiPortal.Application.DTOs.Requests;

public class CreateMaterialVersionRequest
{
    public string VersionLabel { get; set; } = string.Empty;
    public string ChangeNote { get; set; } = string.Empty;
}
