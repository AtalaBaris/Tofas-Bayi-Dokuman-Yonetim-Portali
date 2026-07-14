# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje özeti

**Bayi Doküman Yönetimi Portalı** — bayilere marka bazlı doküman/duyuru/eğitim materyali sunan, erişimleri (VIEW/DOWNLOAD) kayıt altına alan bir MVP portalı. Monorepo: `backend/` (ASP.NET Core 9, Clean Architecture) + `frontend/` (Angular 20, feature modülleri) + PostgreSQL. Detaylı gereksinimler, ekranlar, veri modeli ve API sözleşmesi için `README.md` içindeki bölümlere bakın (bu dosya onları tekrar etmez, sadece koda özgü olanları içerir).

## Komutlar

### Backend (ASP.NET Core / .NET 9)

```bash
# Build
dotnet build backend/BayiPortal.sln

# Çalıştır (appsettings.Development.json → Port=5432, lokal Postgres bekler)
dotnet run --project backend/src/BayiPortal.API --launch-profile https
# API: https://localhost:7085  Swagger: /swagger  Health: GET /api/health

# Migration oluşturma / uygulama (Infrastructure = migration'ların yaşadığı proje)
dotnet ef migrations add <İsim> \
  --project backend/src/BayiPortal.Infrastructure \
  --startup-project backend/src/BayiPortal.API

dotnet ef database update \
  --project backend/src/BayiPortal.Infrastructure \
  --startup-project backend/src/BayiPortal.API
```

Henüz backend'de bir test projesi **yok** (`find backend -iname "*test*"` boş döner). Test eklenecekse `BayiPortal.sln`'e yeni bir xUnit/NUnit projesi olarak dahil edilmesi gerekir.

### Frontend (Angular 20)

```bash
cd frontend
npm install
ng serve            # http://localhost:4200, apiUrl = https://localhost:7085/api (environment.ts)
ng build             # prod build
ng test              # Karma/Jasmine — NOT: angular.json şemasında skipTests:true olduğundan
                      # component/service/guard/interceptor üretiminde .spec.ts otomatik oluşmuyor;
                      # şu an repoda hiç .spec.ts dosyası yok.
```

Tek bir bileşen/testi çalıştırmak için Angular CLI'ın `ng test --include` mekanizması kullanılabilir, ancak önce ilgili `.spec.ts` dosyasının yazılmış olması gerekir.

### Lokal veritabanı (bu makinede)

Bu makinede PostgreSQL **Docker değil**, Homebrew ile lokal kurulu ve `brew services` üzerinden arka planda çalışıyor (port `5432`, otomatik başlar). Rol/veritabanı: `bayi` / `BayiPortalDb` — `appsettings.Development.json` içindeki bağlantı dizesiyle **hiçbir değişiklik yapılmadan** birebir eşleşir. `docker-compose.yml` hâlâ repoda duruyor (ekibin Docker tercih eden üyeleri için, port `5433`) ama bu makinede kullanılmıyor.

`dotnet-ef` global tool `~/.dotnet/tools` altında kurulu ve PATH'e (`~/.zprofile`) eklendi.

## Mimari

### Backend: genişletilmiş Clean Architecture (4 katman, tek yönlü bağımlılık)

```
BayiPortal.Core           → Entity, Enum, domain Exception. Hiçbir dış bağımlılığı yok (EF/HTTP bilmez).
BayiPortal.Application    → İş kuralları, DTO, Interfaces (Repository/Service), Validator, Mapping.
                             ⭐ Tüm iş mantığı burada toplanmalı.
BayiPortal.Infrastructure → DbContext (ApplicationDbContext), Fluent API configuration'lar,
                             EF Core migrations, FileStorageService.
BayiPortal.API            → Controller, Middleware, DI wiring (Program.cs ince tutulur,
                             asıl DI kaydı ServiceCollectionExtensions.AddApiServices → 
                             Infrastructure.DependencyInjection.AddInfrastructure zincirinde).
```

`Program.cs` kasıtlı olarak çok ince: `AddApiServices` çağrısı + `GlobalExceptionMiddleware` + Swagger/CORS/Auth/MapControllers. Yeni bir servisi DI'a bağlarken `ServiceCollectionExtensions.cs` (API katmanı, cross-cutting: CORS/Swagger) veya `DependencyInjection.cs` (Infrastructure katmanı: DbContext, dosya depolama gibi altyapı) doğru yerdir — iş kuralı servisleri ileride muhtemelen Application katmanında kendi `AddApplicationServices` extension'ıyla eklenecek (henüz yok).

`GlobalExceptionMiddleware`, domain exception'ları (`MaterialNotFoundException`, `ForbiddenAccessException`, `DomainException`) HTTP status koduna çevirir ve kullanıcıya asla stack trace/teknik detay sızdırmaz — yeni domain exception eklerken bu switch ifadesine satır eklemek gerekir.

### Frontend: feature-module (standalone component) yapısı

Angular 20 standalone API kullanılıyor (NgModule yok); route'lar `app.routes.ts` içinde `loadComponent` ile lazy-load ediliyor. `core/` (guard, interceptor, servis, model — tek seferlik altyapı) / `features/{auth,materials,admin}` (sayfa bileşenleri) / `shared/components` (file-upload, navbar, loader) ayrımı korunmalı; yeni bir ekran eklerken doğru feature klasörüne, ortak UI parçası eklerken `shared/components`'a konmalı.

### Kritik iş kuralı: marka eşleşmesi (birden fazla dosyayı etkiler)

Bayi kullanıcısının bir içeriği görmesi/indirmesi için `DealerBrands(bayi) ∩ MaterialBrands(içerik) ≠ ∅` olmalı. Bu kural **hem** Angular route guard'da (UX için, `role.guard.ts`) **hem de** her ilgili backend endpoint'inde (asıl güvenlik) ayrı ayrı uygulanmalı — biri diğerinin yerine geçmez. Yetkisiz erişimde içerik response body'sinde **hiç dönmemeli** (401/403), sadece liste dışı bırakmak yetmez.

### Diğer tekrarlayan kurallar (kod yazarken hatırlanmalı)

- **Soft delete**: `Materials.Status` = Draft/Active/Archived; hard delete yok.
- **Dosya adlandırma**: `FileStorageService.SaveAsync` orijinal dosya adını asla path olarak kullanmaz, `Guid.NewGuid()` tabanlı `StoredFileName` üretir (path traversal koruması). Yeni upload akışı eklerken bu deseni bozmayın.
- **DTO sınırı**: `PasswordHash`, ham `FilePath` gibi alanlar dışa asla DTO'suz sızdırılmamalı (henüz DTO/mapping katmanı yazılmadı — Application/DTOs ve Application/Mappings klasörleri şu an boş, ileride buraya eklenecek).
- **Zaman**: DB'de UTC, ekranda yerel saate çevrilir.

## Şu anki iskelet durumu (önemli — kod yokmuş gibi varsayıp yeniden yazmayın, ama var sanıp da güvenmeyin)

Repo şu an **erken iskelet** aşamasında; README'deki hedef mimariyle karışmasın diye net olsun:

- Backend'de sadece `HealthController` var. Auth/Materials/Brands/Dealers/Categories/AccessLogs controller'ları, Application katmanındaki servis/DTO/validator/mapping dosyaları **henüz yazılmadı** (klasörler var, içleri boş).
- JWT paketi (`Microsoft.AspNetCore.Authentication.JwtBearer`) ve `Jwt` config'i (`appsettings.json`) referanslı ama `Program.cs`'te `AddAuthentication`/`UseAuthentication` **henüz bağlanmadı** — `app.UseAuthorization()` çağrılıyor ama authentication scheme'i yok.
- Frontend `AuthService.login()` gerçek bir API çağrısı yapmıyor; sahte bir `dev-token` ile her zaman başarılı dönen bir **placeholder** (kod içindeki yorum: "Placeholder until Auth API is implemented"). `jwt.interceptor.ts` ve `auth.guard.ts` gerçek implementasyon ama arkasında gerçek bir auth API'si yok.
- Seed veri / migration seeder yok — `Users` tablosu boş, dolayısıyla gerçek bir login akışı (backend bağlansa bile) örnek kullanıcılarla çalışmaz.
- EF Core migration'ı tek: `InitialCreate` (tüm tabloları oluşturur).

Yeni bir feature'a başlamadan önce ilgili controller/service/component'in gerçekten var mı yoksa sadece README'de mi tarif edilmiş olduğunu kontrol edin.
