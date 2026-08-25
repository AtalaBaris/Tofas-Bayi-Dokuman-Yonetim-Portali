using BayiPortal.Core.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BayiPortal.Infrastructure.Data.Conversions;

/// <summary>
/// AccessLog.Action/LoginStatus'ü DB'de mevcut Türkçe metinlerle (ör. "Döküman Görüntüleme")
/// saklamaya devam eder — enum'un C# adını (HasConversion&lt;string&gt;() varsayılanı) değil,
/// AccessAction/AccessResultExtensions'daki eşlemeyi kullanır. Böylece bu refactor mevcut
/// veriyi veya API/frontend sözleşmesini değiştirmez.
/// </summary>
public sealed class AccessActionConverter : ValueConverter<AccessAction, string>
{
    public AccessActionConverter() : base(v => ToProvider(v), v => FromProvider(v))
    {
    }

    private static string ToProvider(AccessAction action) => action.ToDisplayString();

    private static AccessAction FromProvider(string value) =>
        AccessActionExtensions.TryParseDisplayString(value, out var action)
            ? action
            : throw new InvalidOperationException($"Bilinmeyen AccessLog.Action değeri: '{value}'");
}

public sealed class AccessResultConverter : ValueConverter<AccessResult?, string?>
{
    public AccessResultConverter() : base(v => ToProvider(v), v => FromProvider(v))
    {
    }

    private static string? ToProvider(AccessResult? result) => result.HasValue ? result.Value.ToDisplayString() : null;

    private static AccessResult? FromProvider(string? value) =>
        value != null && AccessResultExtensions.TryParseDisplayString(value, out var result) ? result : null;
}
