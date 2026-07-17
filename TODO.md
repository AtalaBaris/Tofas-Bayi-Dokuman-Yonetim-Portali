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

### 📌 Ekibin şu anda üzerinde çalıştığı / açık dallar

- `feature-backend-girisLog` — bir takım arkadaşı bu dalda çalışıyor (muhtemelen
  madde `6`, AccessLogs). Materials PR'ı bilerek `AccessLogs`'a yazma mantığına
  dokunmadı ki bu dalla çakışma olmasın.
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
2. feature-backend-authorization ──┐
        │                          │  (ikisi de sadece 1'e bağımlı,
        ▼                          │   birbirlerine bağımlı değiller)
3. feature-*-tanim-yonetimi ───────┤
                                   │
✅ 4. feature-frontend-paylasilan-dokuman-listesi  (frontend merge oldu, mock veride)
   + feature-backend-materials ────┘   (backend de merge oldu — PR #3, marka kesişim
        │                               kuralı + expiry + validasyon DAHİL; frontend
        │                               hâlâ mock veride, bağlama işi ayrı kalıyor)
        ▼
✅ 5. feature-*-bayi-marka-erisimi   (materials endpoint'leri için PR #3 ile fiilen
        │                          tamamlandı — ayrı dal açılmadı)
        ▼
✅ 6. feature-*-access-logs          (tamamlandı — veritabanı loglama, API ve ön yüz entegrasyonu bitti)
        │
        ▼
7. feature-*-test-ve-teslim       (6'ya bağımlı — hepsini kapsar)
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

## 2. `feature-backend-authorization`

**Bağımlılık:** yalnızca 1. **Paralel çalışılabilir:** 3, 4 ile birlikte.

- Backend: `[Authorize(Roles = "...")]` politikaları; `401` (token yok/geçersiz) vs
  `403` (rol yetersiz) ayrımının doğru çalıştığının doğrulanması
  (`GlobalExceptionMiddleware` zaten `ForbiddenAccessException`'ı 403'e çeviriyor,
  endpoint'lerin bu exception'ı gerçekten fırlatması lazım)
- Frontend: `adminRoleGuard`/`authGuard` zaten gerçek JWT tabanlı `currentUser()`
  claim'lerini okuyor (1 tamamlanınca otomatik doğru çalışacak) — ek iş büyük
  ihtimalle gerekmeyecek, sadece doğrulama

**Bitti sayılır:** Bayi kullanıcısı `/admin` altına girmeye çalışınca yönlendiriliyor;
aynı isteği doğrudan API'ye atınca 403 dönüyor.

---

## 3. `feature-*-tanim-yonetimi`

**Bağımlılık:** yalnızca 1. **Paralel çalışılabilir:** 2, 4 ile birlikte.

**Neden gerekli:** PDF'in zorunlu ekran #5'i (Tanım Yönetimi) frontend'de hiç yok —
seed'le gelen sabit veri yeterli değil, yönetici bunları ekleyip düzenleyebilmeli.

- Backend: `DealersController`, `BrandsController`, `CategoriesController`,
  `UsersController` (CRUD, `Admin` rolüyle korumalı)
- Frontend: Yeni bir tanım yönetimi ekranı (`features/admin` altına, mevcut
  `admin.routes.ts`'e yeni route olarak eklenir) — kullanıcı/bayi/marka/kategori
  listeleme/ekleme/düzenleme

**Bitti sayılır:** Yönetici yeni bir bayi + marka + kategori ekleyip bir kullanıcıyı
bir bayiye atayabiliyor.

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
- ❌ Frontend: `features/admin/shared-docs-list-page/` (madde başındaki dal ile
  merge oldu) hâlâ `MOCK_DOCUMENTS` üzerinde çalışıyor, gerçek
  `GET /api/materials`'a bağlı değil. Eski `material-form`/`material-list`/
  `material-detail` stub'ları da hâlâ boş. Materials backend'i merge olduğuna göre
  bu ekranı gerçek API'ye bağlamak artık **sıradaki iş** — ayrı bir küçük
  `feature-frontend-*` dalı olarak açılabilir.
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

## 7. `feature-*-test-ve-teslim`

**Bağımlılık:** 6 (hepsini kapsar). **Paralel çalışma yok — son adım.**

- Tüm demo senaryosunu uçtan uca doğrulama, eksik hata mesajlarını düzeltme
- Temel test coverage'ı ekleme (şu an backend'de test projesi, frontend'de
  `.spec.ts` dosyası hiç yok)
- README'yi güncel duruma göre son haline getirme

**Bitti sayılır:** PDF sayfa 7'deki 10 maddelik "Minimum kabul kriterleri"
listesinin tamamı işaretlenebiliyor.

---

## Küçük not (kod tutarsızlığı) — ✅ çözüldü

~~`MaterialStatus` enum'u (Draft/Active/Archived) tanımlı ama `Material.Status`
alanı hâlâ `string` — enum hiç kullanılmıyor.~~ `feature-backend-materials`
(PR #3) içinde `Material.Status` artık `MaterialStatus` enum'u kullanıyor
(`HasConversion<string>()` ile aynı text kolonuna yazılıyor, migration gerekmedi).

Benzer bir tutarsızlık hâlâ duruyor: `User.Role` da tanımlı `RoleType` enum'u
yerine `string` kullanıyor, `AccessLog.Action` da `AccessAction` enum'u yerine
`string`. Bunlar bu PR'ın kapsamı dışında bırakıldı (auth/access-logs dallarına ait
dosyalar) — ileride ilgili branch'lerde bağlanabilir.

## Küçük not (config tutarsızlığı) — ✅ çözüldü

`docker-compose.yml` Postgres'i host port **5433**'e map ediyordu fakat `appsettings.Development.json` içinde varsayılan olarak **5432** portu tanımlıydı. Bu tutarsızlık giderildi ve her iki appsettings (`appsettings.json` ve `appsettings.Development.json`) dosyasındaki varsayılan PostgreSQL portu **5433** olarak güncellendi. Artık ek bir ayar yapmaya gerek kalmadan Docker veritabanına otomatik olarak bağlanılabilmektedir.

