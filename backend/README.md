# Backend — BayiPortal

Kurulum ve genel proje bilgisi için ana dizindeki [`README.md`](../README.md) dosyasına bak.

## Katmanlar (kısa)

| Proje | Ne işe yarar? | İçine ne yazılır? |
|-------|----------------|-------------------|
| **BayiPortal.Core** | Domain / çekirdek | Entity, Enum, Exception. Framework bilmez. |
| **BayiPortal.Application** | İş kuralları | Service, DTO, Validator, Interface. Controllers yok. |
| **BayiPortal.Infrastructure** | Dış dünya | EF Core, DbContext, Repository, dosya saklama, Migration. |
| **BayiPortal.API** | HTTP girişi | Controller, Middleware, `Program.cs`, Swagger/JWT/CORS. |

**Kural:** İş kuralı → Application. Veri erişimi → Infrastructure. HTTP → API.

## Çalıştırma

```bash
# Repo kökünden
dotnet run --project backend/src/BayiPortal.API
# Swagger: https://localhost:7085/swagger
```

## Klasör rehberi

- `Core/Entities` → Veritabanı tablolarına karşılık gelen sınıflar (`User`, `Material`…)
- `Core/Enums` → Sabit roller / durumlar / aksiyonlar
- `Core/Exceptions` → Domain hataları (middleware bunları yakalar)
- `Application/DTOs/Requests` → API’den gelen veri modelleri
- `Application/DTOs/Responses` → API’ye giden veri modelleri (şifre/path sızmaz)
- `Application/Interfaces` → Sözleşmeler (Infrastructure uygular)
- `Application/Services` → Use-case / iş mantığı
- `Application/Validators` → FluentValidation kuralları
- `Infrastructure/Data` → DbContext + Fluent API tablo ayarları
- `Infrastructure/Migrations` → EF Core şema sürümleri
- `Infrastructure/Storage` → Diskte unique dosya adı ile saklama
- `API/Controllers` → REST uçları (ince kalsın → service çağır)
- `API/Middlewares` → Global hata yakalama vb.
- `API/Extensions` → `Program.cs`’i şişirmeden DI/Swagger kaydı
