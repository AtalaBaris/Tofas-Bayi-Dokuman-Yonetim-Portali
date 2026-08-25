namespace BayiPortal.Core.Enums;

/// <summary>
/// AccessAction &lt;-&gt; mevcut Türkçe görünüm metni eşlemesi. Bu metinler DB'de saklanan ve
/// API/frontend sözleşmesinde kullanılan değerlerle birebir aynı olmalı (geriye dönük uyumluluk).
/// </summary>
public static class AccessActionExtensions
{
    private static readonly IReadOnlyDictionary<AccessAction, string> DisplayNames = new Dictionary<AccessAction, string>
    {
        [AccessAction.View] = "Döküman Görüntüleme",
        [AccessAction.Download] = "Döküman İndirme",
        [AccessAction.Upload] = "Döküman Yükleme",
        [AccessAction.Update] = "Döküman Güncelleme",
        [AccessAction.Archive] = "Döküman Arşivleme",
        [AccessAction.VersionChange] = "Döküman Sürüm Değişikliği",
        [AccessAction.Login] = "Giriş",
        [AccessAction.Logout] = "Çıkış"
    };

    private static readonly IReadOnlyDictionary<string, AccessAction> ByDisplayName =
        DisplayNames.ToDictionary(kv => kv.Value, kv => kv.Key, StringComparer.Ordinal);

    public static string ToDisplayString(this AccessAction action) => DisplayNames[action];

    public static bool TryParseDisplayString(string? displayName, out AccessAction action)
    {
        if (displayName != null && ByDisplayName.TryGetValue(displayName, out var parsed))
        {
            action = parsed;
            return true;
        }

        action = default;
        return false;
    }
}
