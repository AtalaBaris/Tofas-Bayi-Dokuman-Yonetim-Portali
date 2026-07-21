# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje özeti

**Bayi Doküman Yönetimi Portalı** — bayilere marka bazlı doküman/duyuru/eğitim materyali sunan, erişimleri (VIEW/DOWNLOAD) kayıt altına alan bir MVP portalı. Monorepo: `backend/` (ASP.NET Core 9, Clean Architecture) + `frontend/` (Angular 20, feature modülleri) + PostgreSQL. Detaylı gereksinimler, ekranlar, veri modeli ve API sözleşmesi için `README.md` içindeki bölümlere bakın (bu dosya onları tekrar etmez, sadece koda özgü olanları içerir).

## Komutlar

### Backend (ASP.NET Core / .NET 9)

```bash
# Build
dotnet build backend/BayiPortal.sln

# Çalıştır (appsettings.Development.json → Port=5433 varsayılan, Docker'ı hedefler;
# bu makinede Homebrew Postgres 5432'de olduğundan port override dotnet user-secrets
# ile ayarlı — bkz. aşağıdaki "Lokal veritabanı" notu, komut normal şekilde çalışır)
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

Bu makinede PostgreSQL **Docker değil**, Homebrew ile lokal kurulu ve `brew services` üzerinden arka planda çalışıyor (port `5432`, otomatik başlar). Rol/veritabanı: `bayi` / `BayiPortalDb`.

⚠️ 2026-07-17'de `feature-backend-bayiGirisLog` PR'ı (#9) ile commit'lenmiş `appsettings.Development.json`/`appsettings.json` içindeki varsayılan port **5433**'e çevrildi (Docker/`docker-compose.yml` ile eşleşsin diye — bkz. TODO.md'deki "config tutarsızlığı" notu). Bu, tutarsızlığı çözmek yerine bu makineye taşıdı: artık commit'lenmiş config **bu makinedeki Homebrew Postgres'le (5432) birebir eşleşmiyor**.

Bu makinede çözüm olarak `dotnet user-secrets` kullanıldı (machine-local, repoya commit'lenmez, sadece `~/.microsoft/usersecrets/<UserSecretsId>/secrets.json` içinde durur):

```bash
# Bir kereye mahsus (zaten bu makinede yapıldı, tekrar gerekmiyor)
dotnet user-secrets init --project backend/src/BayiPortal.API
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Host=localhost;Port=5432;Database=BayiPortalDb;Username=bayi;Password=bayi123" \
  --project backend/src/BayiPortal.API
```

Bunun için `BayiPortal.API.csproj`'a `<UserSecretsId>` eklendi (tek satır, commit edilebilir/edilmez — bkz. `git diff`). `ASPNETCORE_ENVIRONMENT=Development` olduğu sürece (launchSettings.json'daki `https`/`http` profilleri bunu zaten ayarlıyor) user-secrets appsettings'i override eder, yani `dotnet run --launch-profile https` **ek bir env var'a gerek kalmadan** doğrudan 5432'ye bağlanır. `docker-compose.yml` hâlâ repoda duruyor (ekibin Docker tercih eden üyeleri için, port `5433`, artık appsettings varsayılanıyla uyumlu) ama bu makinede kullanılmıyor.

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

`GlobalExceptionMiddleware`, domain exception'ları (`MaterialNotFoundException`, `DealerNotFoundException`, `BrandNotFoundException`, `CategoryNotFoundException`, `UserNotFoundException`, `ForbiddenAccessException`, `DomainException`) HTTP status koduna çevirir ve kullanıcıya asla stack trace/teknik detay sızdırmaz — yeni domain exception eklerken bu switch ifadesine satır eklemek gerekir.

### Frontend: feature-module (standalone component) yapısı

Angular 20 standalone API kullanılıyor (NgModule yok); route'lar `app.routes.ts` içinde `loadComponent`/`loadChildren` ile lazy-load ediliyor. `core/` (guard, interceptor, servis, model — tek seferlik altyapı) / `features/{bayi,materials,admin}` (sayfa bileşenleri) / `shared/components` ayrımı korunmalı.

**Login iki ayrı portal olarak kurgulanmış** (tek ortak login ekranı değil): `features/bayi/login/components/bayi-login/` (route: `/login`) ve `features/admin/login/components/admin-login/` (route: `/admin/login`, `admin.routes.ts` üzerinden `loadChildren`). Admin alanının kendi guard'ları var: `features/admin/guards/admin.guards.ts` → `adminAuthGuard`, `adminRoleGuard`. `core/guards/role.guard.ts` bu yüzden **artık kullanılmıyor** (dead code, silinmeyi bekliyor) — kafa karıştırmasın diye yeni kod bu dosyaya referans vermemeli, `adminRoleGuard`'a bakın.

### Kritik iş kuralı: marka eşleşmesi (birden fazla dosyayı etkiler)

Bayi kullanıcısının bir içeriği görmesi/indirmesi için `DealerBrands(bayi) ∩ MaterialBrands(içerik) ≠ ∅` olmalı. Bu kural **hem** Angular route guard'da (UX için, `adminRoleGuard`/`authGuard`) **hem de** her ilgili backend endpoint'inde (asıl güvenlik) ayrı ayrı uygulanmalı — biri diğerinin yerine geçmez. Yetkisiz erişimde içerik response body'sinde **hiç dönmemeli** (401/403), sadece liste dışı bırakmak yetmez.

### Diğer tekrarlayan kurallar (kod yazarken hatırlanmalı)

- **Soft delete**: `Materials.Status` = Draft/Active/Archived; hard delete yok.
- **Dosya adlandırma**: `FileStorageService.SaveAsync` orijinal dosya adını asla path olarak kullanmaz, `Guid.NewGuid()` tabanlı `StoredFileName` üretir (path traversal koruması). Yeni upload akışı eklerken bu deseni bozmayın.
- **DTO sınırı**: `PasswordHash`, ham `FilePath` gibi alanlar dışa asla DTO'suz sızdırılmamalı. `Application/DTOs/{Requests,Responses}` artık dolu (Materials + Dealer/Brand/Category/User) — `Application/Mappings` hâlâ boş, mapping'ler her serviste elle yazılan `ToResponse` metotlarıyla yapılıyor (AutoMapper yok).
- **Zaman**: DB'de UTC, ekranda yerel saate çevrilir.

## Şu anki iskelet durumu (2026-07-17 güncellemesi — kod yokmuş gibi varsayıp yeniden yazmayın, ama var sanıp da güvenmeyin)

Repo `Develop` dalında (GitHub'daki gerçek entegrasyon dalı, **büyük D** — bkz. `TODO.md`'deki branch stratejisi notu).

- **Auth tamamlandı ve `Develop`'a merge oldu** (`feature-backend-auth`): `AuthController` (`POST /api/auth/login`), `AuthService`, JWT üretimi/doğrulaması (`Program.cs`'te `AddAuthentication`/`UseAuthentication` bağlı), `PasswordHasher<User>`, idempotent `SeedData` (Development'ta her başlangıçta admin/editor/bayi.a/bayi.b hesaplarını garanti eder — bkz. README'deki örnek şifreler). Frontend `AuthService.login()` artık gerçek `POST /api/auth/login` çağırıyor, sahte `dev-token` mantığı kaldırıldı.
- **Materials backend tamamlandı ve `Develop`'a merge oldu** (PR #3, `feature-backend-materials` → `ad2f374`): `MaterialsController` (`api/materials` — sınıf seviyesinde `[Authorize]` var, yani list/get/download **de** kimlik doğrulama ister, giriş yapılmamışsa 401 döner; create/update/archive ayrıca `[Authorize(Roles = "Admin,ContentManager")]` ile kısıtlı), `MaterialService`, `MaterialRepository`. Kritik marka-eşleşme kuralı (`DealerBrands ∩ MaterialBrands ≠ ∅`) `GetAuthorizedMaterialAsync`'de uygulandı: `DealerUser` rolü için marka eşleşmiyorsa, materyal `Active` değilse veya `ExpiresAt` geçmişse `ForbiddenAccessException` (→ 403) fırlatılır, response body'de içerik hiç dönmez; `Admin`/`ContentManager` bu kısıtlamadan muaftır (yönetim ekranı süresi geçmiş/arşiv içeriği de görebilmeli). `TODO.md`'deki ayrı `5. feature-*-bayi-marka-erisimi` maddesi bu PR ile fiilen tamamlandı, ayrı bir dal açılmadı. `MaterialStatus` enum'u artık `Material.Status`'e bağlı (önceden tanımlı ama kullanılmıyordu). Create/Update ayrıca temel girdi doğrulaması yapar (boş Title/Description, en az bir marka, var olmayan `CategoryId`/`BrandIds`) — yeni `Core.Exceptions.ValidationException` ile 400 döner. **Hâlâ eksik:** dosya türü/boyutu doğrulaması yok (`TODO.md`'de takip maddesi olarak işaretli).
- **Tanım Yönetimi backend'i tamamlandı ve `Develop`'a merge oldu** (PR #6, `feature-backend-tanim-yonetimi` → `40a0b79`, 2026-07-17): `DealersController`/`BrandsController`/`CategoriesController`/`UsersController` (hepsi `[Authorize(Roles = "Admin")]`, `GET` list/by-id, `POST`, `PUT`, `DELETE` → soft delete `IsActive = false`), `DealerService`/`BrandService`/`CategoryService`/`UserService`, `DealerRepository`/`BrandRepository`/`CategoryRepository` (yeni) + `UserRepository` (CRUD metotlarıyla genişletildi). `Dealer` create/update `BrandIds` alır ve `DealerBrand` eşleşmesini `MaterialBrands` ile aynı desende yönetir. 4 yeni `{Entity}NotFoundException` → `GlobalExceptionMiddleware`'de 404'e bağlandı. Marka eşleşme kuralı ve 401/403 ayrımı `MaterialsController` üzerinde canlı sunucuya karşı tekrar doğrulandı (regresyon yok). **Frontend tarafı bu dalda yok** — ekip arkadaşı ayrı çalışıyor.
- **Backend'de hâlâ yazılmayanlar**: `AccessLogsController` + VIEW/DOWNLOAD loglama (`TODO.md` madde 6 — bir takım arkadaşı `feature-backend-girisLog` dalında bunun üzerinde çalışıyor olabilir, başlamadan önce o dalı kontrol edin).
- **Frontend'de `features/admin/shared-docs-list-page/`** (PR #2 ile merge oldu) gerçek ve iyi kalitede bir doküman listesi ekranı; gerçek `MaterialsController`'a bağlama işi `feature-frontend-admin-dokuman-listesi-entegrasyonu` dalında yapıldı (henüz `Develop`'a merge olmadı, bkz. `TODO.md` madde 11) — `MaterialsService.list()`/`archive()` kullanıyor, kategori/marka filtreleri artık yüklenen veriden türetiliyor. Bu işin yan ürünü olarak `MaterialResponse`'a `CreatedByName` eklendi (additive, migration gerekmedi). Görüntülenme sayısı/versiyon gibi `AccessLog`'da `MaterialId` bağlantısı olmadığı için hesaplanamayan alanlar (ve onlara bağlı `document-access-report-page`) hâlâ mock/placeholder — ayrı bir backend takip maddesi. Eski `features/materials/` altındaki `material-list`/`material-detail`/`material-form` bileşenleri ise tamamen boş stub olarak kalmaya devam ediyor. Tanım Yönetimi ekranı da henüz yok (bir ekip arkadaşı üzerinde çalışıyor).
- EF Core migration'ı hâlâ tek: `InitialCreate` (Materials ve Tanım Yönetimi backend'leri mevcut şemayı değiştirmeden eklendi — yeni migration gerekmedi).

Yeni bir feature'a başlamadan önce ilgili controller/service/component'in gerçekten var mı yoksa sadece README'de mi tarif edilmiş olduğunu kontrol edin. Güncel "ne yapılmalı" sırası için `TODO.md`'ye bakın.
