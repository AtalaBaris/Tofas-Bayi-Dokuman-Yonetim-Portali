namespace BayiPortal.Core.Enums;

/// <summary>
/// AccessResult &lt;-&gt; mevcut Türkçe görünüm metni eşlemesi. Bu metinler DB'de saklanan ve
/// API/frontend sözleşmesinde kullanılan değerlerle birebir aynı olmalı (geriye dönük uyumluluk).
/// </summary>
public static class AccessResultExtensions
{
    private static readonly IReadOnlyDictionary<AccessResult, string> DisplayNames = new Dictionary<AccessResult, string>
    {
        [AccessResult.Success] = "Başarılı",
        [AccessResult.Failed] = "Başarısız",
        [AccessResult.NotApplicable] = "N/A"
    };

    private static readonly IReadOnlyDictionary<string, AccessResult> ByDisplayName =
        DisplayNames.ToDictionary(kv => kv.Value, kv => kv.Key, StringComparer.Ordinal);

    public static string ToDisplayString(this AccessResult result) => DisplayNames[result];

    public static bool TryParseDisplayString(string? displayName, out AccessResult result)
    {
        if (displayName != null && ByDisplayName.TryGetValue(displayName, out var parsed))
        {
            result = parsed;
            return true;
        }

        result = default;
        return false;
    }
}
