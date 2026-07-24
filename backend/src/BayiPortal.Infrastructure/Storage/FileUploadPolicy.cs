// README izin verilen türler + yapılandırılabilir max boyut (appsettings FileStorage).
using System.Collections.Frozen;
using System.Text.RegularExpressions;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Exceptions;
using Microsoft.Extensions.Configuration;

namespace BayiPortal.Infrastructure.Storage;

public sealed class FileUploadPolicy : IFileUploadPolicy
{
    // PDF, DOCX, TXT, PPTX, JPG, JPEG, PNG, MP4, WAV
    private static readonly FrozenSet<string> AllowedExtensions = new[]
    {
        ".jpg", ".jpeg", ".png", ".pdf", ".docx", ".pptx", ".txt", ".wav", ".mp4"
    }.ToFrozenSet(StringComparer.OrdinalIgnoreCase);

    private static readonly FrozenSet<string> AllowedMimeTypes = new[]
    {
        "image/jpeg",
        "image/png",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
        "video/mp4",
        // Tarayıcılar bazen boş veya generic MIME gönderir; uzantı asıl kontrol.
        "application/octet-stream"
    }.ToFrozenSet(StringComparer.OrdinalIgnoreCase);

    private readonly long _maxFileSizeBytes;

    public FileUploadPolicy(IConfiguration configuration)
    {
        _maxFileSizeBytes = configuration.GetValue("FileStorage:MaxFileSizeBytes", 25L * 1024 * 1024);
        if (_maxFileSizeBytes <= 0)
        {
            _maxFileSizeBytes = 25L * 1024 * 1024;
        }
    }

    public void ValidateOrThrow(string originalFileName, string mimeType, long fileSize)
    {
        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            throw new ValidationException("Dosya adı zorunludur.");
        }

        if (fileSize <= 0)
        {
            throw new ValidationException("Boş dosya yüklenemez.");
        }

        if (fileSize > _maxFileSizeBytes)
        {
            var maxMb = Math.Round(_maxFileSizeBytes / (1024d * 1024d), 1);
            throw new ValidationException(
                $"Dosya boyutu en fazla {maxMb} MB olabilir. Lütfen daha küçük bir dosya seçin.");
        }

        // Dosya adı uzunluk kontrolü (maksimum 50 karakter)
        if (originalFileName.Length > 50)
        {
            throw new ValidationException("Dosya adı en fazla 50 karakter olabilir.");
        }

        // Türkçe karakter, emoji ve özel karakter kontrolü
        // Sadece İngilizce harfler, rakamlar, boşluk, nokta, tire ve alt çizgi izinli.
        if (!Regex.IsMatch(originalFileName, @"^[a-zA-Z0-9.\-_ ]+$"))
        {
            throw new ValidationException(
                "Dosya adı Türkçe karakter, emoji veya özel karakter içeremez. Sadece İngilizce harf, rakam, boşluk, nokta, tire ve alt çizgi kullanılabilir.");
        }

        var extension = Path.GetExtension(originalFileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            throw new ValidationException(
                "Bu dosya türü desteklenmiyor. İzin verilen türler: PDF, DOCX, TXT, PPTX, JPG, JPEG, PNG, MP4, WAV.");
        }

        if (!string.IsNullOrWhiteSpace(mimeType) && !AllowedMimeTypes.Contains(mimeType.Trim()))
        {
            // Uzantı geçerliyse MIME tutarsızlığını da reddet (sahte içerik riski).
            // application/octet-stream istisnası AllowedMimeTypes içinde.
            throw new ValidationException(
                "Dosya türü (MIME) izin verilen listede değil. Lütfen geçerli bir doküman veya medya dosyası yükleyin.");
        }
    }
}
