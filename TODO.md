# TODO — Geliştirme Planı ve Branch Stratejisi

Bu dosya, `Bayi_Dokuman_Yonetimi_Portali_Staj_Gorevi.pdf` (görev tanımı) ile mevcut kod
durumu karşılaştırılarak çıkarılmıştır. **2026-07-16 güncellemesi:** Ekibin GitHub'da
zaten kurduğu gerçek branch yapısı incelendi ve plan buna göre revize edildi (önceki
sürüm varsayımsal bir `develop`/`feature/x` adlandırması kullanıyordu — gerçek isimler
farklı çıktı, aşağıda düzeltildi).

## Branch stratejisi (gerçek GitHub durumuna göre düzeltildi)

- `main` — stabil / demo'ya hazır.
- **`Develop`** (büyük D!) — gerçek entegrasyon dalı. Ekip PR'ları buraya merge ediyor
  (bkz. PR #1: `feature-frontend-bayilogin` → `Develop`).
- `feature-*` dallar **tirelenmiş** isimlendirme kullanıyor, `frontend`/`backend`
  önekiyle: `feature-frontend-bayilogin`, `feature-backend-auth`,
  `feature-frontend-paylasilan-dokuman-listesi` gibi. (Önceki sürümde önerdiğim
  `feature/auth-login` slash-stili **kullanılmıyor** — yeni dallar açarken tireli
  isimlendirmeye uyun.)
- ⚠️ **macOS uyarısı:** Bu makinenin dosya sistemi büyük/küçük harf duyarsız. Yerel bir
  `develop` (küçük d) branch'i `Develop` (büyük D) ile aynı dosyaya çakışıp
  birbirinin üzerine yazabilir — biri sessizce kaybolur. Her zaman `Develop` (büyük D)
  kullanın, `develop` yaratmayın.
- İstisna: `TODO.md`/`CLAUDE.md` gibi salt dokümantasyon dosyaları doğrudan `main`'e
  commit'lenebilir; kod değişiklikleri `Develop` üzerinden `feature-*` akışını izler.

## Mevcut durum özeti (2026-07-16 güncellemesi #2)

### ✅ Tamamlanan ve `Develop`'a merge olan işler

- **Bayi + Admin login ekranları** (frontend, PR #1, `feature-frontend-bayilogin` →
  `9d239f9`): Reactive Forms, validasyon, şifre göster/gizle, animasyonlar;
  `adminAuthGuard`/`adminRoleGuard` (eski `core/guards/role.guard.ts` silindi).
- **Backend Auth** (PR ile merge, `feature-backend-auth` → `081a51f`, seed sorunu
  sonradan `1845057` ile düzeltildi): `AuthController`
  (`POST /api/auth/login`), JWT üretimi/doğrulaması, `PasswordHasher<User>`,
  idempotent `SeedData` (Development'ta her başlangıçta 4 örnek hesabı garanti
  eder). Frontend `AuthService.login()` artık gerçek API'ye bağlı, sahte
  `dev-token` mantığı kaldırıldı.
- **Paylaşılan Dökümanlar listesi** (frontend, PR #2,
  `feature-frontend-paylasilan-dokuman-listesi` → `6d15b73`): `admin-shell` +
  `admin-sidebar` layout, arama/kategori/marka/durum filtreleri, detay çekmecesi —
  kaliteli bir uygulama ama **hâlâ mock veri** (`MOCK_DOCUMENTS`, 60 kayıt) üzerinde
  çalışıyor, gerçek API'ye bağlı değil.
- **Materials backend** (PR #3, `feature-backend-materials` → `Develop`,
  `ad2f374` ile merge oldu, 2026-07-17): `MaterialsController` (list/get/download
  tümü `[Authorize]`, create/update/archive ayrıca Admin/ContentManager rolüyle
  kısıtlı), `MaterialService`, `MaterialRepository`. **Kritik marka-eşleşme kuralı
  (`DealerBrands ∩ MaterialBrands ≠ ∅`) bu PR'da doğrudan uygulandı** — aşağıdaki
  madde `5`'i fiilen kapsıyor, ayrı bir dal açılmadı. `MaterialStatus` enum'u
  `Material.Status`'e bağlandı. Merge öncesi code review'da bulunan iki eksik de
  aynı PR'a eklendi (`f7d103a`): `ExpiresAt` artık `GetAuthorizedMaterialAsync` ve
  `GetListAsync`'de gerçekten uygulanıyor (süresi geçmiş içerik bayi kullanıcısından
  403/liste dışı, Admin/ContentManager muaf) ve Create/Update artık temel girdi
  doğrulaması yapıyor (boş Title/Description, en az bir marka, var olmayan
  CategoryId/BrandIds → yeni `Core.Exceptions.ValidationException` ile 400).
  Tüm senaryolar merge öncesi curl ile uçtan uca doğrulandı: rol kısıtları, marka
  kesişimi, 401/403/404, expiry, validasyon.
  **Hâlâ eksik (bu PR'a dahil edilmedi, ayrı takip gerekiyor):** dosya türü/boyutu
  doğrulaması — `POST /api/materials` hâlâ herhangi bir uzantı/MIME/boyut sınırı
  olmadan dosyayı kabul edip diske yazıyor. PDF'in "Hatalı dosya türü/boyutu ...
  anlaşılır mesaj" kabul kriterini (madde 23) karşılamıyor; `4. feature-backend-materials`
  altına küçük bir takip commit'i olarak ya da `7. feature-*-test-ve-teslim`
  aşamasında eklenmeli.
  **Frontend tarafı bu PR'da yok** — yukarıdaki mock-veri listesinin gerçek API'ye
  bağlanması hâlâ ayrı bir iş.
- **Sistem Erişim Kayıtları (Access Logs) Entegrasyonu** (frontend + backend, 2026-07-17): `AccessLog` entitesi ve veritabanı şeması güncellenerek ilişkiler opsiyonel hale getirildi. Başarılı/başarısız giriş denemeleri, çıkış işlemleri, döküman görüntüleme, indirme, yükleme, güncelleme ve arşivleme hareketleri veritabanına kaydedilmeye başlandı. `AccessLogsController` (`GET /api/access-logs` filtreleme/sayfalama ve `POST /api/access-logs/logout` çıkış loglama) yazıldı. Frontend tarafındaki `/admin/access-logs` arayüzü mock veriden kurtarılarak gerçek API servisine bağlandı; sunucu taraflı arama, rol, işlem, durum ve tarih aralığı filtreleri ile dinamik sayfalama entegre edildi.
- **Bayi Dashboard ekranları** (frontend, PR #13, `frontend-bayi-dashboard` →
  `Develop`, `e003ec2` ile merge oldu, 2026-07-20): `bayi-shell` (üst bar +
  bildirim zili + kullanıcı menüsü), `bayi-home-page` (özet/istatistik + son
  dokümanlar), `bayi-documents-page` (bento kart grid, arama/kategori/marka/
  erişim-durumu filtreleri, sayfalama), `bayi-document-detail-page`,
  `bayi-profile-page` (ad/e-posta/telefon düzenleme), `bayi-settings-page`
  (bildirim tercihi anahtarları). İlk merge'de tamamen mock veri üzerinde
  çalışıyordu; madde `8` (backend) ve `9` (frontend wiring) ile
  `bayi-shell`'deki bildirim zili ve `bayi-settings-page` **dışındaki**
  tüm ekranlar artık gerçek API'ye bağlı (`BAYI_MOCK_DOCUMENTS` silindi).
  Bildirimler hâlâ `BAYI_MOCK_NOTIFICATIONS` üzerinde — ürün kararı
  bekliyor (bkz. madde 8, alt madde 4-5).
- **Tanım Yönetimi backend** (PR #6, `feature-backend-tanim-yonetimi` → `Develop`,
  `40a0b79` ile merge oldu, 2026-07-17): `DealersController`/`BrandsController`/
  `CategoriesController`/`UsersController` — hepsi `[Authorize(Roles = "Admin")]`,
  `GET` (list/by-id), `POST`, `PUT`, `DELETE` (soft delete → `IsActive = false`,
  hard delete yok). `DealerService`/`BrandService`/`CategoryService`/`UserService`
  + yeni `DealerRepository`/`BrandRepository`/`CategoryRepository`, `UserRepository`
  CRUD metotlarıyla genişletildi. Validasyon: benzersiz `Dealer.Code`/`Brand.Code`,
  benzersiz `User.Email`, geçersiz `RoleType`, `DealerUser` rolü için `DealerId`
  zorunlu ve var olmalı — hepsi `Core.Exceptions.ValidationException` ile 400 döner.
  `Dealer` create/update `BrandIds` alır ve `DealerBrand` eşlemesini `Material`'ın
  `MaterialBrands`'i yönettiği desenle aynı şekilde yönetir. 4 yeni
  `{Entity}NotFoundException` (`Dealer`/`Brand`/`Category`/`User`)
  `GlobalExceptionMiddleware`'de 404'e bağlandı. `dotnet build` temiz, canlı sunucuya
  karşı curl ile tüm CRUD + validasyon + 401/403/404 senaryoları doğrulandı; ayrıca
  bu dal Materials dosyalarına dokunmadığı için `MaterialsController` üzerindeki
  marka-eşleşme kuralı ve 401/403 ayrımı da regresyon kontrolü olarak yeniden
  doğrulandı (etkilenmemiş). **Frontend tarafı bu dalda yok** — ayrı bir ekip
  arkadaşı üzerinde çalışıyor.

### 📌 Ekibin şu anda üzerinde çalıştığı / açık dallar

- `feature-backend-girisLog` — bir takım arkadaşı bu dalda çalışıyor (muhtemelen
  madde `6`, AccessLogs). Materials PR'ı bilerek `AccessLogs`'a yazma mantığına
  dokunmadı ki bu dalla çakışma olmasın.
- `feature-backend-tanim-yonetimi` — backend'i PR #6 ile `Develop`'a merge oldu
  (yukarıya bkz.). Frontend tarafı ayrı bir ekip arkadaşında, henüz ayrı bir dal.
- `feature-frontend-admin-login`, `feature-frontend-auth-login` — muhtemelen ilk
  denemeler, iş asıl `feature-frontend-bayilogin`'de tamamlanmış görünüyor. Bu ikisi
  muhtemelen artık gereksiz (silinebilir) — ekiple teyit edin.

---

## Bağımlılık grafiği (güncel)

```
✅ frontend: bayi-login + admin-login          (feature-frontend-bayilogin, merge oldu)
        │
        ▼
✅ 1. feature-backend-auth        (merge oldu — JWT + seed + login endpoint çalışıyor)
        │
        ▼
✅ 2. feature-backend-authorization ──┐
        │                          │  (ikisi de sadece 1'e bağımlı,
        ▼                          │   birbirlerine bağımlı değiller)
✅ 3. feature-*-tanim-yonetimi ─────┤   (backend merge oldu — PR #6, feature-backend-tanim-yonetimi;
                                   │    frontend hâlâ ayrı ekip arkadaşında, ayrı dal)
                                   │
✅ 4. feature-frontend-paylasilan-dokuman-listesi  (frontend merge oldu)
   + feature-backend-materials ────┘   (backend de merge oldu — PR #3, marka kesişim
        │                               kuralı + expiry + validasyon DAHİL)
        ▼
🔄 11. feature-frontend-admin-dokuman-listesi-entegrasyonu  (4'ün frontend'ini gerçek
        │                                                   API'ye bağladı — henüz
        │                                                   `Develop`'a merge olmadı)
        ▼
✅ 5. feature-*-bayi-marka-erisimi   (materials endpoint'leri için PR #3 ile fiilen
        │                          tamamlandı — ayrı dal açılmadı)
        ▼
✅ 6. feature-*-access-logs          (tamamlandı — veritabanı loglama, API ve ön yüz entegrasyonu bitti)
        │
        ▼
✅ 7. feature-frontend-bayi-dashboard (frontend merge oldu, PR #13 — tamamen mock veride)
        │
        ▼
🔄 8. feature-backend-bayi-dashboard-entegrasyonu  (7'nin ekranlarını gerçek API'ye
        │                                          bağlamak için gereken backend işleri —
        │                                          1-3 tamam, 4-5 ürün kararı bekliyor)
        ▼
✅ 9. feature-frontend-bayi-dashboard-entegrasyonu  (8'in 1-3 numaralı maddelerini
        │                                           kullanarak 7'nin ekranlarını gerçek
        │                                           API'ye bağladı)
        ▼
10. feature-*-test-ve-teslim       (8 ve 9'a bağımlı — hepsini kapsar)
```

## Paralel çalışma noktaları

- **1 bittikten sonra `2`, `3`, `4` paralel yürütülebilir.** Üçü de yalnızca 1'in
  ürettiği JWT altyapısına ve seed veriye ihtiyaç duyar, birbirlerine bağımlı değiller.
  - `2` → authorization/guard/middleware dosyalarına dokunur.
  - `3` → `DealersController`, `BrandsController`, `CategoriesController`,
    `UsersController` + yeni bir Tanım Yönetimi ekranı — Materials dosyalarına
    dokunmaz.
  - `4` → `MaterialsController` + `features/materials/*` (frontend) — Dealer/Brand/
    Category CRUD dosyalarına dokunmaz, sadece 1'deki seed veriyi okur. (Frontend
    tarafı zaten `feature-frontend-paylasilan-dokuman-listesi` adıyla ayrılmış.)
- **Tek koordinasyon noktası:** `3` ve `4`'teki yeni endpoint'lere rol bazlı yetki
  eklemek `2`'nin merge olmasını bekler. Pratik çözüm: önce yetkilendirme olmadan
  yazılıp merge edilebilir, `2` merge olunca küçük bir takip commit'iyle eklenir.
- **`5`, `6`, `7` sıralı kalmalı** — her biri bir öncekinin çalışan halini test verisi
  olarak kullanıyor, paralelleştirmenin faydası yok.

---

## 1. `feature-backend-auth` — ✅ tamamlandı, `Develop`'a merge oldu

**Kapsam genişledi:** frontend login ekranları zaten bittiği için bu dal artık hem
backend'i hem de `AuthService`'in gerçek API'ye bağlanmasını kapsıyor.

- Backend: `Program.cs`'e `AddAuthentication`/`AddJwtBearer` bağlanması (paket zaten
  referanslı, sadece wiring eksik); parola hash'leme; `AuthController` +
  `POST /api/auth/login`; `LoginRequest`/`LoginResponse` DTO'ları
- Seed: Dealers (2), Brands (2), DealerBrands, Categories (3), Users
  (admin/editor/bayi.a/bayi.b — README'deki örnek hesaplarla birebir)
- Frontend: `AuthService.login()`'daki `portal`'a-göre-sahte-rol mantığını kaldırıp
  gerçek `POST /api/auth/login` çağrısına bağlama (formlar zaten hazır, sadece
  servisin içi değişecek)
- Cleanup: kullanılmayan `core/guards/role.guard.ts`'i sil

**Bitti sayılır:** Swagger'dan gerçek kullanıcıyla giriş yapılabiliyor, token dönüyor;
hem `/login` (bayi) hem `/admin/login` ekranından gerçek kullanıcıyla giriş çalışıyor;
yanlış şifre anlaşılır hata veriyor.

---

## 2. `feature-backend-authorization` — ✅ tamamlandı (ayrı dal açılmadı, doğrulama yapıldı 2026-07-17)

**Bağımlılık:** yalnızca 1.

Rol bazlı yetkilendirme, diğer backend PR'ları ilerlerken (Materials PR #3,
Tanım Yönetimi PR #6, Access Logs PR #9) her controller'a kendi `[Authorize(...)]`
attribute'larıyla zaten eklenmiş — ayrı bir dal gerekmedi. Bu madde kapsamında
sadece uçtan uca doğrulama yapıldı (lokal API'ye admin/editor/bayi.a
kullanıcılarıyla gerçek JWT alınıp curl ile test edildi):

- **401 (token yok/geçersiz):** `/api/materials`, `/api/dealers`, `/api/access-logs`
  token'sız veya bozuk token'la istendiğinde 401 dönüyor — doğrulandı.
- **403 (rol yetersiz):** `DealerUser` (bayi.a) token'ıyla `Admin`-only endpoint'lere
  (`/api/dealers`, `/api/brands`, `/api/categories`, `/api/users`, `/api/access-logs`)
  ve materials create'e (`ManagerRoles`) istek atıldığında 403 dönüyor;
  `ContentManager` (editor) token'ıyla `/api/dealers` yine 403 — doğrulandı.
- **Materyal marka/durum eşleşmesi (madde 5 ile kesişen kısım):** `DealerUser`
  aynı markadan ama `Archived` bir materyale (`GET /api/materials/{id}`) 403
  alıyor, `Admin` aynı isteği 200 ile görüyor — `GlobalExceptionMiddleware`'in
  `ForbiddenAccessException` → 403 dönüşümü hâlâ doğru çalışıyor.
- **Frontend:** `adminRoleGuard`/`adminAuthGuard`
  (`frontend/src/app/features/admin/guards/admin.guards.ts`) gerçek login
  response'undan gelen `currentUser().role`'ü okuyor (JWT claim decode değil,
  backend zaten aynı kuralı bağımsız uyguluyor); `admin.routes.ts` tüm `/admin`
  alt ağacını `['Admin','ContentManager']` ile, Tanım Yönetimi gibi bazı alt
  route'ları ek olarak `['Admin']` ile kısıtlıyor — kod incelemesiyle doğrulandı,
  ek iş gerekmedi.

**Bitti sayılır:** ✅ Bayi kullanıcısı `/admin` altına girmeye çalışınca
yönlendiriliyor (guard); aynı isteği doğrudan API'ye atınca 403 dönüyor (yukarıda
curl ile doğrulandı).

---

## 3. `feature-*-tanim-yonetimi` — backend tamamlandı ve `Develop`'a merge oldu

**Bağımlılık:** yalnızca 1. **Paralel çalışılabilir:** 2, 4 ile birlikte.

**Neden gerekli:** PDF'in zorunlu ekran #5'i (Tanım Yönetimi) frontend'de hiç yok —
seed'le gelen sabit veri yeterli değil, yönetici bunları ekleyip düzenleyebilmeli.

- ✅ Backend: `feature-backend-tanim-yonetimi` dalında tamamlandı ve PR #6 ile
  `Develop`'a merge oldu (2026-07-17). `DealersController`, `BrandsController`,
  `CategoriesController`, `UsersController` — CRUD, `Admin` rolüyle korumalı,
  soft delete (`IsActive`). Validasyon + marka/bayi eşleme kuralları dahil
  (yukarıdaki "Mevcut durum özeti"ne bkz.). `dotnet build` temiz, curl ile
  canlı doğrulandı.
- ❌ Frontend: Yeni bir tanım yönetimi ekranı (`features/admin` altına, mevcut
  `admin.routes.ts`'e yeni route olarak eklenir) — kullanıcı/bayi/marka/kategori
  listeleme/ekleme/düzenleme. Bir ekip arkadaşı bu ekran üzerinde çalışıyor;
  backend artık hazır olduğu için gerçek API'ye bağlanabilir.

**Bitti sayılır:** Yönetici yeni bir bayi + marka + kategori ekleyip bir kullanıcıyı
bir bayiye atayabiliyor. (Backend tarafı bu kriteri karşılıyor — frontend
bağlanınca uçtan uca tamamlanmış olacak.)

---

## 4. `feature-frontend-paylasilan-dokuman-listesi` (merge oldu) + `feature-backend-materials` (merge oldu)

**Bağımlılık:** yalnızca 1 (seed'deki Brand/Category verisi yeterli). **Paralel
çalışılabilir:** 2, 3 ile birlikte.

- ✅ Backend: `MaterialsController` yazıldı ve merge oldu (PR #3 → `Develop`,
  `ad2f374`) — `GET/POST/PUT/DELETE /api/materials`, `GET /api/materials/{id}/download`,
  kategori/marka/anahtar kelime/status filtresi, `IFileStorageService` ile dosya
  kaydı, arşivleme (`DELETE` → soft delete). Marka kesişim kuralı da bu PR'da
  (bkz. madde 5). `ExpiresAt` uygulanıyor, Create/Update girdi doğrulaması var
  (bkz. yukarıdaki "Mevcut durum özeti"). `dotnet-ef` migration gerekmedi.
- ✅ Frontend: `features/admin/shared-docs-list-page/` artık gerçek
  `GET/DELETE /api/materials`'a bağlı — bkz. madde 11
  (`feature-frontend-admin-dokuman-listesi-entegrasyonu`, henüz `Develop`'a
  merge olmadı). Eski `material-form`/`material-list`/`material-detail`
  stub'ları hâlâ boş.
- ⚠️ Takip: dosya türü/boyutu doğrulaması backend'de hâlâ yok (yukarıda
  detaylandırıldı).

**Bitti sayılır:** İçerik yöneticisi iki markaya açık bir eğitim dokümanı
yükleyebiliyor; liste filtrelenebiliyor. (Backend tarafı bu kriteri karşılıyor,
curl ile doğrulandı — frontend bağlanınca uçtan uca tamamlanmış olacak.)

---

## 5. `feature-*-bayi-marka-erisimi` — materials için PR #3 ile fiilen tamamlandı (merge oldu)

**Neden kritik:** Projenin en önemli iş kuralı: `DealerBrands ∩ MaterialBrands ≠ ∅`.

Ayrı bir dal açılmadan, bu kural doğrudan `feature-backend-materials`
(`MaterialService`) içinde uygulandı: `GET /api/materials` listesi bayi
kullanıcısı için otomatik markaya göre filtreleniyor; `GET /api/materials/{id}` ve
`GET /api/materials/{id}/download` marka eşleşmiyorsa veya içerik `Active` değilse
403 dönüyor, body'de hiç içerik sızmıyor.

**Doğrulandı (curl ile):** Marka B bayisi, Marka A içeriğinin ID'sini bilerek
doğrudan istek attığında hem `GET /api/materials/{id}` hem
`GET /api/materials/{id}/download` için 403 alıyor — PDF'in negatif senaryosu
karşılanıyor.

⚠️ Bu maddeyi ayrı bir branch olarak açmayın — kapsamı zaten madde 4'ün PR'ında.
İleride başka içerik tipleri (ör. Tanım Yönetimi ekranındaki kaynaklar) için benzer
bir kural gerekirse, o zaman yeni bir iş maddesi olarak eklenir.

---

## 6. `feature-*-access-logs` — ✅ tamamlandı

**Kapsam:** Erişim kayıtlarının veritabanına loglanması, API üzerinden sunulması ve frontend arayüz entegrasyonu.

- **Backend:** `AccessLog` entitesi güncellendi, `IAccessLogService` / `AccessLogService` yazıldı ve DI'a eklendi (`IHttpContextAccessor` ile IP/UserAgent otomatik alınıyor). `AuthService` (giriş başarı/başarısız) ve `MaterialService` (view/download/upload/edit/archive) hareketleri loglandı. `GET /api/access-logs` (admin korumalı, sayfalama ve filtrelemeli) ve `POST /api/access-logs/logout` endpoint'leri yazıldı.
- **Veritabanı:** `UpdateAccessLogsForSystemLogging` migration'ı oluşturuldu ve PostgreSQL'e uygulandı.
- **Frontend:** `/admin/access-logs` arayüzü `AccessLogService` ile gerçek API'ye bağlandı. Arama, filtreleme (rol, işlem, durum, tarih aralığı) ve sayfalama işlemleri sunucu taraflı (server-side) çalışacak şekilde dinamik hale getirildi. Çıkış butonuna basıldığında sunucuya çıkış logu gönderilmesi sağlandı.


---

## 8. `feature-backend-bayi-dashboard-entegrasyonu` — 🔄 devam ediyor

**Bağımlılık:** 6 (`access-logs`) ve 7 (`feature-frontend-bayi-dashboard`, merge oldu).

**Neden gerekli:** PR #13 ile gelen bayi dashboard ekranları (`bayi-shell`,
`bayi-home-page`, `bayi-documents-page`, `bayi-document-detail-page`,
`bayi-profile-page`, `bayi-settings-page`) tamamen mock veri üzerinde
çalışıyor. Bazı ihtiyaçlar zaten mevcut endpoint'lerle karşılanıyor, bazıları
için gerçek backend eksik.

**Zaten karşılanıyor — sadece frontend wiring işi (yeni backend gerekmez),
✅ bu da bitti (bkz. madde 9):**
- `GET /api/materials` (categoryId/brandId/keyword/status filtreleri) →
  `bayi-home-page` ve `bayi-documents-page`'deki `BAYI_MOCK_DOCUMENTS`'in
  yerini alacak.
- `GET /api/materials/{id}` → `bayi-document-detail-page`; zaten sunucu
  tarafında VIEW erişim logu atıyor (`MaterialService.cs`).
- `GET /api/materials/{id}/download` → `onView`/`onDownload` TODO'ları;
  zaten sunucu tarafında DOWNLOAD erişim logu atıyor.
- Marka eşleşme kuralı (`DealerBrands ∩ MaterialBrands ≠ ∅`) zaten
  `MaterialService.GetAuthorizedMaterialAsync`'de uygulanıyor (bkz. madde 5).

**Eksik — gerçek backend işi gerekiyor:**
1. ✅ **`DealerName` login response'unda dolmuyor** — çözüldü (2026-07-20,
   `feature-backend-bayi-dashboard-entegrasyonu` dalında). `UserRepository.GetByEmailAsync`
   artık `Dealer`'ı include ediyor, `AuthService.LoginAsync`
   `DealerName = user.Dealer?.Name` set ediyor. `bayi.a@bayiportal.local` ile
   giriş curl'le doğrulandı: `dealerName: "Bayi A"` dönüyor; admin girişinde
   (`dealerId` yok) `dealerName: null`, hata yok. Frontend tarafındaki
   `dealerDisplayName(dealerId)` hardcoded switch'i (`bayi-home.model.ts:157`)
   artık gereksiz — bir sonraki frontend işinde gerçek `dealerName`'e
   geçirilebilir.
   ⚠️ Yan not (bu commit'in kapsamı dışında, ayrıca fark edildi):
   `LoginResponse`'daki `UserResponse.IsActive` hiç set edilmiyor, her zaman
   `false` dönüyor (curl ile doğrulandı) — `UsersController`'daki diğer
   `UserResponse` projeksiyonlarıyla tutarsız, ayrı bir küçük takip
   gerektirir.
2. ✅ **Bayi kullanıcısı için self-service profil endpoint'i yoktu** —
   çözüldü (2026-07-20, `feature-backend-bayi-dashboard-entegrasyonu`
   dalında). `User` entity'sine `Phone` (nullable, max 30) eklendi
   (`AddPhoneToUsers` migration'ı oluşturuldu ve lokal veritabanına
   uygulandı). Yeni `UserProfileController` (`api/users/me`, sadece
   `[Authorize]` — rol şartı yok, `UsersController`'ın Admin-only class
   attribute'ından ayrı tutuldu ki normal bayi kullanıcısı da erişebilsin):
   `GET /api/users/me` JWT'deki kullanıcıyı döner, `PUT /api/users/me`
   sadece `Name`/`Email`/`Phone` günceller (Role/DealerId/IsActive bu
   endpoint'ten değiştirilemez — onlar hâlâ Admin'in `PUT /api/users/{id}`
   endpoint'inde). `UserResponse`'a `Phone` alanı eklendi. curl ile
   doğrulandı: token'sız istek 401, e-posta çakışması 400, GET sonrası
   `PUT` ile güncellenen telefon kalıcı, `DealerUser` rolüyle hâlâ
   `/api/users` (liste) 403 dönüyor (Admin-only kısıtlama regresyona
   uğramadı).
3. ✅ **Dokümana özgü erişim durumu (`unread`/`viewed`/`downloaded`) API'de
   yoktu** — çözüldü (2026-07-20, `feature-backend-bayi-dashboard-entegrasyonu`
   dalında). `MaterialResponse`'a `myAccessStatus` alanı eklendi
   (`"unread"`/`"viewed"`/`"downloaded"` — frontend'deki `BayiDocAccessStatus`
   union type'ıyla birebir, ek mapping gerekmiyor). Yeni
   `IAccessLogService.GetAccessStatusesAsync(userId, materialIds)`,
   `AccessLogs` tablosundaki `"Döküman Görüntüleme"`/`"Döküman İndirme"`
   kayıtlarından kullanıcı+materyal bazında en yüksek erişim seviyesini
   (`downloaded` > `viewed`) hesaplıyor; `MaterialService.GetListAsync`
   sadece `DealerUser` rolü için bunu materyal listesine uyguluyor
   (Admin/ContentManager için her zaman `"unread"` — onlar için anlamlı bir
   kavram değil, ekstra sorgu da atlanıyor). curl ile uçtan uca doğrulandı:
   yeni oluşturulan bir materyal `bayi.a` için `unread` → `GET /{id}`
   sonrası `viewed` → `GET /{id}/download` sonrası `downloaded` olarak
   dönüyor; `bayi.b` (farklı marka) materyali listede hiç görmüyor; Admin
   listesinde tüm materyaller `unread` kalıyor (regresyon yok).
   ⚠️ Yan not: bu implementasyon `AccessLog.Action`'daki Türkçe serbest
   metin değerlere (`"Döküman Görüntüleme"`/`"Döküman İndirme"`) doğrudan
   bağımlı — dosyanın altındaki "Küçük not (kod tutarsızlığı)" bölümünde
   bahsedilen `AccessAction` enum'una geçiş yapılırsa bu sorgu da
   güncellenmeli.
4. **Bildirimler için backend hiç yok.** `bayi-shell`'deki zil menüsü
   tamamen `BAYI_MOCK_NOTIFICATIONS` mock verisiyle çalışıyor — ne bir
   `Notification` entity/tablosu ne de bir controller var. Kapsam (gerçek
   push mi, yoksa süresi yaklaşan/yeni eklenen materyallerden anlık
   hesaplanan bir liste mi) ürün kararı gerektiriyor, dala başlamadan önce
   netleştirilmeli.
5. **Ayarlar sayfasındaki bildirim tercihleri kalıcı değil.**
   `bayi-settings-page`'deki `emailNotifications`/`documentAlerts`/
   `expiryReminders` anahtarları hiçbir yere kaydedilmiyor (sayfa
   yenilenince sıfırlanıyor) — `User`'a alan eklenmesi veya ayrı bir
   `UserPreferences` tablosu gerekiyor. Madde 4 (bildirimler) ile birlikte
   ele alınması mantıklı, çünkü aynı tabloyu paylaşabilirler.

**Bitti sayılır:** Bayi kullanıcısı giriş yaptığında gerçek bayi adını görüyor;
doküman listesi/detayı gerçek API'den geliyor ve görüntüleme/indirme gerçek
erişim logu üretiyor; kendi profilini güncelleyebiliyor; bildirim zili ve
ayarlar sayfası mock veriden kurtulmuş (kapsamı netleşmişse). Madde 4 ve 5
dışındaki her şey madde 9 ile fiilen tamamlandı.

---

## 9. `feature-frontend-bayi-dashboard-entegrasyonu` — ✅ tamamlandı (2026-07-20)

**Bağımlılık:** 8'in 1-3 numaralı backend maddeleri (hepsi ✅).

**Kapsam:** PR #13'teki bayi dashboard ekranlarını (`bayi-home-page`,
`bayi-documents-page`, `bayi-document-detail-page`, `bayi-profile-page`,
`bayi-shell`, `bayi-settings-page`) mock veriden kurtarıp gerçek API'ye
bağlamak. Bildirimler (madde 4) ve ayarlar kalıcılığı (madde 5) kapsam dışı
bırakıldı — hâlâ mock, ürün kararı bekliyor.

- **Modeller:** `core/models/material.interface.ts`'e `myAccessStatus`,
  `core/models/user.interface.ts`'e `dealerName`/`phone`/`isActive` eklendi
  (backend DTO'larıyla birebir).
- **Yeni servis:** `core/services/user-profile.service.ts` —
  `GET/PUT /api/users/me` sarmalayıcısı.
- **Yeni yardımcı:** `shared/utils/file-download.util.ts` —
  `saveBlobAsFile`/`openBlobInNewTab`. Backend `/materials/{id}/download`
  her zaman `Content-Disposition: attachment` döndüğü için doğrudan
  `<a href>` ile önizleme yapılamıyor; blob XHR ile çekilip biz karar
  veriyoruz (indir → `download` attribute'lu anchor; görüntüle → blob'u
  yeni sekmede aç). İkisi de aynı backend endpoint'ini çağırıyor — ayrı bir
  "sadece önizle, indirme sayma" endpoint'i yok, bu bilinen bir sınır.
- **`bayi-home.model.ts`:** `BAYI_MOCK_DOCUMENTS` ve `dealerDisplayName`
  silindi; yerine `toBayiDocumentCard(material: Material)` mapper'ı eklendi
  (mimeType → fileKind, publishedAt → dateLabel/daysAgo, expiresAt →
  expiresInDays, myAccessStatus → accessStatus doğrudan geçiyor).
- **`bayi-home-page` / `bayi-documents-page`:** `MaterialsService.list()`'e
  bağlandı; kategori/marka filtre seçenekleri artık gerçek materyallerden
  türetiliyor (statik `['Pazarlama', 'Genel Duyuru', 'Eğitim']` listesi
  kaldırıldı — `CategoriesController` Admin-only olduğu için bayi
  kullanıcısı zaten gerçek kategori listesini API'den çekemiyor, mevcut
  materyallerden türetmek tek pratik yol). Liste indirme butonu artık
  gerçek dosyayı indiriyor.
- **`bayi-document-detail-page`:** `MaterialsService.getById()`'e bağlandı
  (sayfa yüklenince backend zaten VIEW logu atıyor); "İndir"/"Görüntüle"
  butonları gerçek blob indirme/önizlemeye bağlandı.
- **`bayi-profile-page`:** localStorage tabanlı mock kayıt
  (`readBayiProfileExtra`/`writeBayiProfileExtra`, artık silindi) yerine
  gerçek `GET/PUT /api/users/me`.
- **`bayi-shell` / `bayi-settings-page` / `bayi-home-page`:** hardcoded
  `dealerDisplayName(dealerId)` switch'i kaldırıldı, yerine gerçek
  `currentUser().dealerName` kullanılıyor (madde 8/1'in doğal sonucu).

**Doğrulama:** `ng build` temiz; ayrıca gerçek backend + gerçek Postgres'e
karşı Playwright ile uçtan uca tarayıcı testi yapıldı (dealer olarak giriş
→ ana sayfa gerçek bayi adı ve gerçek materyali gösteriyor → dokümanlar
sayfasında filtre/arama çalışıyor → karta tıklayınca detay sayfası gerçek
başlık/açıklama gösteriyor → "Dosyayı İndir" gerçek bir dosya indirme
event'i tetikliyor (doğru dosya adıyla) → detaya girince erişim durumu
unread'den viewed/downloaded'a gerçekten değişiyor → profil sayfası gerçek
ad/e-posta/telefonu yüklüyor, kaydedilen telefon sayfa yenilenince kalıcı
kalıyor (backend'den geliyor, localStorage'dan değil)); konsolda hiç hata
yok. Ekran görüntüleriyle doğrulandı.

**Bitti sayılır:** ✅ — yukarıdaki akışların tamamı gerçek veriyle çalışıyor.

---

## 10. `feature-*-test-ve-teslim`

**Bağımlılık:** 8 ve 9 (hepsini kapsar). **Paralel çalışma yok — son adım.**

- Tüm demo senaryosunu uçtan uca doğrulama, eksik hata mesajlarını düzeltme
- Temel test coverage'ı ekleme (şu an backend'de test projesi, frontend'de
  `.spec.ts` dosyası hiç yok)
- README'yi güncel duruma göre son haline getirme

**Bitti sayılır:** PDF sayfa 7'deki 10 maddelik "Minimum kabul kriterleri"
listesinin tamamı işaretlenebiliyor.

---

## 11. `feature-frontend-admin-dokuman-listesi-entegrasyonu` — 🔄 devam ediyor (henüz merge olmadı)

**Bağımlılık:** 4 (`feature-backend-materials`, merge oldu).

**Kapsam:** Admin "Paylaşılan Dökümanlar" listesini (`features/admin/shared-docs-list-page/`)
`MOCK_DOCUMENTS`'ten kurtarıp gerçek `MaterialsController`'a bağlamak.

- **Backend (küçük, additive):** `MaterialResponse`'a `CreatedByName` eklendi;
  `MaterialRepository.BaseQuery()` artık `Creator` navigasyonunu include ediyor.
  Salt-okunur bir join olduğu için mevcut davranışı bozmuyor, migration gerekmedi.
- **`MaterialsService`'e `archive(id)`** eklendi (`DELETE /api/materials/{id}`).
- **`document-list.model.ts`:** `toAdminDocumentListItem(material: Material)`
  mapper'ı eklendi. `MOCK_DOCUMENTS`/`MOCK_VIEWERS`/`SEED_DOCUMENTS` **silinmedi**
  — `document-access-report-page` hâlâ bunlara bağlı (bkz. aşağıdaki bilinen sınır).
- **`docs-list-page.ts`:** `MaterialsService.list()`'e bağlandı, loading/error
  state eklendi; `archiveDoc()` artık gerçek `DELETE` çağırıyor. Kategori/marka
  filtre seçenekleri artık yüklenen veriden türetiliyor — önceden
  `docs-list-filters.ts`'te sabit bir liste vardı (`['Pazarlama','Satış',...]` ve
  `BRAND_FILTER_OPTIONS = ['Fiat','Jeep','Peugeot','Opel','Citroen']`, gerçek
  marka isimleri ama şu anki dev seed'i — `SeedData.cs` — yalnızca placeholder
  "Marka A"/"Marka B" tanımlıyor); dinamik türetme sayesinde filtre hangi
  ortamda hangi markalar/kategoriler seed edilmişse onlarla çalışıyor.
- **Bilinen sınır (kapsam dışı bırakıldı):** `viewedCount`/`audienceCount`/
  `version` alanları UI'da korundu ama şimdilik 0/0/boş dönüyor — `AccessLog`
  entitesinde `MaterialId` bağlantısı olmadığından doküman bazlı görüntülenme
  istatistiği/versiyon kavramı backend'de hesaplanamıyor. `document-access-report-page`
  (`/admin/documents/:id/access-report`) de aynı sebeple hâlâ `MOCK_DOCUMENTS`
  üzerinde çalışıyor. Bunu çözmek `AccessLog`'a nullable `MaterialId` kolonu
  eklemek (migration) ve `MaterialService`'in her `_accessLogService.LogAsync(...)`
  çağrısını güncellemek anlamına geliyor — ayrı bir backend işi olarak
  planlanmalı, bu dala dahil edilmedi (canlı feature'a migration riski taşımamak
  için bilinçli olarak ertelendi).

**Doğrulama:** `dotnet build backend/BayiPortal.sln` ve `tsc --noEmit` temiz;
gerçek backend'e karşı curl ile uçtan uca doğrulandı (materyal oluştur → gerçek
`createdByName` dönüyor → `DELETE /api/materials/{id}` → status `Archived`'a
dönüyor).

**Bitti sayılır:** Admin, gerçek yüklenmiş bir dokümanı listede görüp
arşivleyebiliyor; kategori/marka filtreleri gerçek veriyle çalışıyor.

---

## Küçük not (kod tutarsızlığı) — ✅ çözüldü

~~`MaterialStatus` enum'u (Draft/Active/Archived) tanımlı ama `Material.Status`
alanı hâlâ `string` — enum hiç kullanılmıyor.~~ `feature-backend-materials`
(PR #3) içinde `Material.Status` artık `MaterialStatus` enum'u kullanıyor
(`HasConversion<string>()` ile aynı text kolonuna yazılıyor, migration gerekmedi).

~~`User.Role` da tanımlı `RoleType` enum'u yerine `string` kullanıyordu.~~
`feature-backend-role-enum` dalında aynı desenle (`HasConversion<string>()`)
çözüldü (2026-07-20): `User.Role` artık `RoleType` enum'u kullanıyor, DB'deki
mevcut değerler (`Admin`/`ContentManager`/`DealerUser`) enum adlarıyla birebir
eşleştiği için migration gerekmedi. DTO sınırı (Request/Response) bilinçli
olarak `string` kaldı — sadece entity/DB katmanı enum'a bağlandı. Etkilenen
dosyalar: `User.cs`, `UserConfiguration.cs`, `SeedData.cs`, `UserService.cs`,
`AuthService.cs`, `JwtTokenService.cs`, `AccessLogService.cs` (rol filtresi +
görüntüleme projeksiyonu). Canlı sunucuya karşı curl ile doğrulandı: login/JWT
role claim, `GET /api/users`, rol bazlı 403, access-logs rol filtresi,
kullanıcı oluşturma/güncelleme (geçerli + geçersiz rol), materials
liste/oluşturma yetkilendirmesi, logout loglama — regresyon yok.

Benzer bir tutarsızlık hâlâ duruyor: `AccessLog.Action` da `AccessAction`
enum'u yerine `string` kullanıyor. Bu, `User.Role`'den daha riskli: mevcut
`AccessAction` enum'u sadece `View`/`Download` içeriyor, ama gerçekte loglanan
değerler Türkçe serbest metin (`"Giriş"`, `"Çıkış"`, `"Döküman Görüntüleme"`,
`"Döküman Yükleme"`, `"Döküman Güncelleme"`, `"Döküman Arşivleme"`,
`"Döküman İndirme"`) — enum'un 7 üyeyle yeniden tanımlanmasını gerektirir ve
frontend'deki `/admin/access-logs` ekranı bu string değerlerle filtreleme
yapıyor (bkz. `AccessLogService.cs` içindeki `"Giriş,Çıkış"` yorum örneği).
Bu yüzden ayrı bir dal olarak, frontend tarafını elleyen ekip arkadaşıyla
koordineli şekilde ele alınmalı — tek başına backend commit'i olarak
yapılmamalı.

## Küçük not (config tutarsızlığı) — ⚠️ Docker için çözüldü, native Postgres için yeniden açıldı

`docker-compose.yml` Postgres'i host port **5433**'e map ediyordu fakat `appsettings.Development.json` içinde varsayılan olarak **5432** portu tanımlıydı. PR #9 (`feature-backend-bayiGirisLog`) bunu her iki appsettings dosyasındaki (`appsettings.json`, `appsettings.Development.json`) varsayılan portu **5433**'e çevirerek "çözdü" — ama bu tutarsızlığı gidermek yerine ters yöne taşıdı: artık `docker compose up -d` ile çalışanlar için ek ayar gerekmiyor, fakat Homebrew/apt gibi native kurulu Postgres kullanan biri (varsayılan port `5432`) commit'lenmiş config'le **artık bağlanamıyor** ve portu 5432'ye override etmesi gerekiyor — örn. `dotnet user-secrets` ile machine-local override (bkz. `CLAUDE.md` → "Lokal veritabanı" bölümü, bu makinede uygulanan yöntem) veya `ConnectionStrings__DefaultConnection` ortam değişkeni. Kalıcı çözüm hâlâ aynı: connection string'i her iki kurulum tipinde de env var/user-secrets ile override edilebilir hale getirip README'de her iki senaryoyu da dokümante etmek.

