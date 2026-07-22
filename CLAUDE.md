# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje özeti

**Bayi Doküman Yönetimi Portalı** — bayilere marka bazlı doküman/duyuru/eğitim materyali sunan, erişimleri (VIEW/DOWNLOAD) kayıt altına alan bir MVP portalı. Monorepo: `backend/` (ASP.NET Core 9, Clean Architecture) + `frontend/` (Angular 20, feature modülleri) + PostgreSQL. Detaylı gereksinimler, ekranlar, veri modeli ve API sözleşmesi için `README.md` içindeki bölümlere bakın (bu dosya onları tekrar etmez, sadece koda özgü olanları içerir).

## Komutlar

### Full stack (Docker — ekip varsayılanı)

```bash
# Tüm servisleri ayağa kaldır (postgres + backend + frontend)
docker compose up -d --build

# Durum
docker compose ps
docker compose logs -f backend   # API log

# Durdur / yeniden başlat
docker compose down
docker compose up -d --build
```

| Servis | Adres |
|--------|--------|
| Frontend | http://localhost:8081 |
| API + Swagger | http://localhost:8080/swagger |
| Postgres (host’tan) | `localhost:5433` — user/pass/db: `bayi` / `bayi123` / `BayiPortalDb` |

Container içi connection string `Host=postgres;Port=5432` (compose env). Host’tan `dotnet ef` veya `psql` için `Port=5433`.

Backend container Development’ta `MigrateAsync` + `SeedData` çalıştırır (admin/editor/bayi.a/bayi.b). Yüklenen dosyalar `bayi_uploads` volume’ünde (`/app/uploads`).

⚠️ Bu makinede Homebrew Postgres (5432) ayrı bir süreç olabilir; **portal artık onu kullanmıyor**. Lokal `BayiPortalDb` silindi (2026-07-22). Başka projeler için 5432 açık kalabilir.

### Backend lokal geliştirme (isteğe bağlı — Docker DB’ye bağlanır)

```bash
dotnet build backend/BayiPortal.sln

# appsettings.Development.json → Port=5433 (Docker Postgres). Önce: docker compose up -d postgres
dotnet run --project backend/src/BayiPortal.API --launch-profile https
# API: https://localhost:7085  Swagger: /swagger  Health: GET /api/health

dotnet ef migrations add <İsim> \
  --project backend/src/BayiPortal.Infrastructure \
  --startup-project backend/src/BayiPortal.API

dotnet ef database update \
  --project backend/src/BayiPortal.Infrastructure \
  --startup-project backend/src/BayiPortal.API
```

Henüz backend'de bir test projesi **yok** (`find backend -iname "*test*"` boş döner). Test eklenecekse `BayiPortal.sln`'e yeni bir xUnit/NUnit projesi olarak dahil edilmesi gerekir.

### Frontend lokal geliştirme (isteğe bağlı)

```bash
cd frontend
npm install
ng serve            # http://localhost:4200 — environment.ts apiUrl'i lokal API'ye (örn. :5037/:8080) işaret etmeli
ng build             # prod build (Docker frontend image bunu kullanır; apiUrl='/api' + nginx proxy)
ng test              # Karma/Jasmine — NOT: angular.json şemasında skipTests:true olduğundan
                      # component/service/guard/interceptor üretiminde .spec.ts otomatik oluşmuyor;
                      # şu an repoda hiç .spec.ts dosyası yok.
```

Tek bir bileşen/testi çalıştırmak için Angular CLI'ın `ng test --include` mekanizması kullanılabilir, ancak önce ilgili `.spec.ts` dosyasının yazılmış olması gerekir.

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

## Şu anki iskelet durumu (2026-07-21 güncellemesi — kod yokmuş gibi varsayıp yeniden yazmayın, ama var sanıp da güvenmeyin)

Repo `Develop` dalında (GitHub'daki gerçek entegrasyon dalı, **büyük D** — bkz. `TODO.md`'deki branch stratejisi notu).

- **Auth tamamlandı ve `Develop`'a merge oldu** (`feature-backend-auth`): `AuthController` (`POST /api/auth/login`), `AuthService`, JWT üretimi/doğrulaması (`Program.cs`'te `AddAuthentication`/`UseAuthentication` bağlı), `PasswordHasher<User>`, idempotent `SeedData` (Development'ta her başlangıçta admin/editor/bayi.a/bayi.b hesaplarını garanti eder — bkz. README'deki örnek şifreler). Frontend `AuthService.login()` artık gerçek `POST /api/auth/login` çağırıyor, sahte `dev-token` mantığı kaldırıldı.
- **Materials backend tamamlandı ve `Develop`'a merge oldu** (PR #3, `feature-backend-materials` → `ad2f374`): `MaterialsController` (`api/materials` — sınıf seviyesinde `[Authorize]` var, yani list/get/download **de** kimlik doğrulama ister, giriş yapılmamışsa 401 döner; create/update/archive ayrıca `[Authorize(Roles = "Admin,ContentManager")]` ile kısıtlı), `MaterialService`, `MaterialRepository`. Kritik marka-eşleşme kuralı (`DealerBrands ∩ MaterialBrands ≠ ∅`) `GetAuthorizedMaterialAsync`'de uygulandı: `DealerUser` rolü için marka eşleşmiyorsa, materyal `Active` değilse veya `ExpiresAt` geçmişse `ForbiddenAccessException` (→ 403) fırlatılır, response body'de içerik hiç dönmez; `Admin`/`ContentManager` bu kısıtlamadan muaftır (yönetim ekranı süresi geçmiş/arşiv içeriği de görebilmeli). `TODO.md`'deki ayrı `5. feature-*-bayi-marka-erisimi` maddesi bu PR ile fiilen tamamlandı, ayrı bir dal açılmadı. `MaterialStatus` enum'u artık `Material.Status`'e bağlı (önceden tanımlı ama kullanılmıyordu). Create/Update ayrıca temel girdi doğrulaması yapar (boş Title/Description, en az bir marka, var olmayan `CategoryId`/`BrandIds`) — yeni `Core.Exceptions.ValidationException` ile 400 döner. **Hâlâ eksik:** dosya türü/boyutu doğrulaması yok (`TODO.md`'de takip maddesi olarak işaretli).
- **Tanım Yönetimi backend'i tamamlandı ve `Develop`'a merge oldu** (PR #6, `feature-backend-tanim-yonetimi` → `40a0b79`, 2026-07-17): `DealersController`/`BrandsController`/`CategoriesController`/`UsersController` (hepsi `[Authorize(Roles = "Admin")]`, `GET` list/by-id, `POST`, `PUT`, `DELETE` → soft delete `IsActive = false`), `DealerService`/`BrandService`/`CategoryService`/`UserService`, `DealerRepository`/`BrandRepository`/`CategoryRepository` (yeni) + `UserRepository` (CRUD metotlarıyla genişletildi). `Dealer` create/update `BrandIds` alır ve `DealerBrand` eşleşmesini `MaterialBrands` ile aynı desende yönetir. 4 yeni `{Entity}NotFoundException` → `GlobalExceptionMiddleware`'de 404'e bağlandı. Marka eşleşme kuralı ve 401/403 ayrımı `MaterialsController` üzerinde canlı sunucuya karşı tekrar doğrulandı (regresyon yok). **Frontend tarafı bu dalda yok** — ekip arkadaşı ayrı çalışıyor.
- **Access Logs tamamlandı ve `Develop`'a merge oldu** (`TODO.md` madde 6): `AccessLogsController` (`GET /api/access-logs`, `POST /api/access-logs/logout`), `AccessLogService`. `AccessLog.MaterialId` (nullable `int`) dolu geliyor — `MaterialService`'in view/download/upload/update/archive akışlarının her biri `_accessLogService.LogAsync(...)` çağırıyor. Bu, aşağıdaki maddede bahsedilen "MaterialId bağlantısı yok" sınırını fiilen ortadan kaldırdı.
- **Frontend'de `features/admin/shared-docs-list-page/`** (PR #2 ile merge oldu) gerçek ve iyi kalitede bir doküman listesi ekranı; gerçek `MaterialsController`'a bağlama işi `feature-frontend-admin-dokuman-listesi-entegrasyonu` dalında yapıldı ve PR #18 ile `Develop`'a merge oldu (`TODO.md` madde 11) — `MaterialsService.list()`/`archive()` kullanıyor, kategori/marka filtreleri artık yüklenen veriden türetiliyor. Bu işin yan ürünü olarak `MaterialResponse`'a `CreatedByName` eklendi (additive, migration gerekmedi). `viewedCount`/`audienceCount`/`version` alanları ayrı bir dalda çözüldü — bkz. sonraki madde. Eski `features/materials/` altındaki `material-list`/`material-detail`/`material-form` bileşenleri ise tamamen boş stub olarak kalmaya devam ediyor. Tanım Yönetimi ekranı da henüz yok (bir ekip arkadaşı üzerinde çalışıyor).
- **`feature-backend-dokuman-goruntulenme-sayaci`** (PR #17 ile `Develop`'a merge oldu, 2026-07-21, `TODO.md` madde 12 — PR #18'den önce merge edildi ki frontend'in ihtiyaç duyduğu alanlar hazır olsun): `MaterialResponse`'a `ViewedCount` (AccessLog'dan benzersiz görüntüleyen sayısı), `AudienceCount` (marka eşleşen aktif `DealerUser` sayısı) ve `Version` (yeni `int` kolon, her `UpdateAsync`'te `+1`) eklendi. `MaterialRepository.GetViewedCountsAsync`/`GetAudienceCountsAsync` + `MaterialService.ApplyCoverageCountsAsync`. `document-list.model.ts`'teki eski "backend'de karşılığı yok" placeholder mantığı kaldırıldı. Kişi bazlı viewer listesi (`document-access-report-page`) hâlâ mock — ayrı iş.
- EF Core migration'ları (hepsi `Develop`'a merge oldu): `InitialCreate`, `UpdateAccessLogsForSystemLogging`, `AddPhoneToUsers`, `AddVersionToMaterials` (sonuncusu yukarıdaki madde ile geldi).

Yeni bir feature'a başlamadan önce ilgili controller/service/component'in gerçekten var mı yoksa sadece README'de mi tarif edilmiş olduğunu kontrol edin. Güncel "ne yapılmalı" sırası için `TODO.md`'ye bakın.
