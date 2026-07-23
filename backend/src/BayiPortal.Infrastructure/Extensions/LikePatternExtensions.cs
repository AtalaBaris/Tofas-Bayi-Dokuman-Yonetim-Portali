namespace BayiPortal.Infrastructure.Extensions;

/// <summary>
/// EF.Functions.ILike ile culture'dan bağımsız (Postgres ILIKE, Npgsql) karşılaştırma yaparken
/// kullanıcı girdisindeki LIKE joker karakterlerini (%, _, \) kaçışlar — aksi halde bir eşitlik/arama
/// filtresi istemeden joker karakterli bir örüntü aramasına dönüşebilir.
/// </summary>
public static class LikePatternExtensions
{
    public const string EscapeCharacter = "\\";

    public static string EscapeLikePattern(this string value) =>
        value
            .Replace(EscapeCharacter, EscapeCharacter + EscapeCharacter)
            .Replace("%", EscapeCharacter + "%")
            .Replace("_", EscapeCharacter + "_");
}
