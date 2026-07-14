# TODO — Geliştirme Planı ve Branch Stratejisi

Bu dosya, `Bayi_Dokuman_Yonetimi_Portali_Staj_Gorevi.pdf` (görev tanımı) ile mevcut kod
durumu karşılaştırılarak çıkarılmıştır. Sıralama, giriş ekranı ve yetkilendirmenin
öncelikli olmasını isteyen ekip kararına göre düzenlenmiştir.

## Branch stratejisi

- `main` — stabil / demo'ya hazır (README §13 ile birebir).
- `develop` — entegrasyon dalı. **Tüm `feature/*` dallar `develop`'tan açılır, PR ile
  tekrar `develop`'a döner.**
- `develop` yalnızca kararlı/demo aşamasına gelindiğinde `main`'e merge edilir.
- `feature/*` dallar kısa ömürlü olmalı; bir görev bitince silinmeli.
- İstisna: bu `TODO.md` ve `CLAUDE.md` gibi salt dokümantasyon dosyaları (kod
  değişikliği içermeyen) doğrudan `main`'e commit'lenebilir — `develop`/`feature`
  akışı yalnızca kod değişiklikleri için geçerlidir.

## Bağımlılık grafiği

```
1. feature/auth-login
        │
        ▼
2. feature/authorization ──┐
        │                  │  (ikisi de sadece 1'e bağımlı,
        ▼                  │   birbirlerine bağımlı değiller)
3. feature/tanim-yonetimi ─┤
                           │
4. feature/materials-crud ─┘
        │
        ▼
5. feature/bayi-marka-erisimi   (4'e bağımlı; ideal olarak 2 de merge olmuş olmalı)
        │
        ▼
6. feature/access-logs          (5'e bağımlı)
        │
        ▼
7. feature/test-ve-teslim       (6'ya bağımlı — hepsini kapsar)
```

## Paralel çalışma noktaları

- **1 bittikten sonra `2`, `3`, `4` üç ayrı branch olarak paralel yürütülebilir.**
  Üçü de yalnızca 1'in ürettiği JWT altyapısına ve seed veriye ihtiyaç duyar,
  birbirlerine bağımlı değiller:
  - `2` → `AuthorizationExtensions`, guard/middleware dosyalarına dokunur.
  - `3` → `DealersController`, `BrandsController`, `CategoriesController`,
    `UsersController` + `features/admin/tanim-yonetimi` (frontend) — Materials
    dosyalarına hiç dokunmaz.
  - `4` → `MaterialsController` + `features/materials/*` (frontend) — Dealer/Brand/
    Category CRUD dosyalarına hiç dokunmaz, sadece 1'deki seed veriyi okur.
  - Dosya çakışması riski düşük çünkü her biri farklı controller/klasörlere yazıyor.
- **Tek koordinasyon noktası:** `3` ve `4`'teki yeni endpoint'lere `[Authorize(Roles = ...)]`
  eklemek `2`'nin merge olmasını bekler. Pratik çözüm: `3`/`4` endpoint'leri
  yetkilendirme olmadan yazılıp merge edilebilir, `2` merge olunca küçük bir takip
  commit'iyle `[Authorize]` attribute'ları eklenir.
- **`5`, `6`, `7` sıralı kalmalı** — her biri bir öncekinin çalışan halini test verisi
  olarak kullanıyor, paralelleştirmenin faydası yok.

---

## 1. `feature/auth-login`

**Neden ilk:** Login çalışmadan hiçbir ekran test edilemez; README'deki örnek
kullanıcılar (`admin@bayiportal.local` vb.) için Dealer/Brand/Category/User seed'i
de zaten bu adımda gerekiyor.

- Backend: `Program.cs`'e `AddAuthentication`/`AddJwtBearer` bağlanması (paket zaten
  referanslı, sadece wiring eksik); parola hash'leme; `AuthController` +
  `POST /api/auth/login`; `LoginRequest`/`LoginResponse` DTO'ları
- Seed: Dealers (2), Brands (2), DealerBrands, Categories (3), Users
  (admin/editor/bayi.a/bayi.b — README'deki örnek hesaplarla birebir)
- Frontend: `AuthService.login()`'daki placeholder'ı gerçek
  `POST /api/auth/login` çağrısına bağlama; hatalı girişte anlaşılır hata mesajı;
  başarılı girişte role göre yönlendirme

**Bitti sayılır:** Swagger'dan gerçek kullanıcıyla giriş yapılabiliyor, token dönüyor;
Angular login ekranından da aynı akış çalışıyor; yanlış şifre anlaşılır hata veriyor.

---

## 2. `feature/authorization`

**Bağımlılık:** yalnızca 1. **Paralel çalışılabilir:** 3, 4 ile birlikte.

- Backend: `[Authorize(Roles = "...")]` politikaları; `401` (token yok/geçersiz) vs
  `403` (rol yetersiz) ayrımının doğru çalıştığının doğrulanması
  (`GlobalExceptionMiddleware` zaten `ForbiddenAccessException`'ı 403'e çeviriyor,
  endpoint'lerin bu exception'ı gerçekten fırlatması lazım)
- Frontend: `role.guard.ts`'in gerçek JWT claim'lerinden (veya login
  response'undaki `user.role`'den) rol okuması — şu an sadece token varlığına bakıyor

**Bitti sayılır:** Bayi kullanıcısı admin route'una girmeye çalışınca frontend'de
yönlendiriliyor; aynı isteği doğrudan API'ye atınca 403 dönüyor.

---

## 3. `feature/tanim-yonetimi`

**Bağımlılık:** yalnızca 1. **Paralel çalışılabilir:** 2, 4 ile birlikte.

**Neden gerekli:** PDF'in zorunlu ekran #5'i (Tanım Yönetimi) frontend'de hiç yok —
seed'le gelen sabit veri yeterli değil, yönetici bunları ekleyip düzenleyebilmeli.

- Backend: `DealersController`, `BrandsController`, `CategoriesController`,
  `UsersController` (CRUD, `Admin` rolüyle korumalı — bkz. koordinasyon notu yukarıda)
- Frontend: Yeni `features/admin/tanim-yonetimi` ekranı — kullanıcı/bayi/marka/
  kategori listeleme/ekleme/düzenleme

**Bitti sayılır:** Yönetici yeni bir bayi + marka + kategori ekleyip bir kullanıcıyı
bir bayiye atayabiliyor.

---

## 4. `feature/materials-crud`

**Bağımlılık:** yalnızca 1 (seed'deki Brand/Category verisi yeterli). **Paralel
çalışılabilir:** 2, 3 ile birlikte.

- Backend: `MaterialsController` — `POST/PUT/GET /api/materials`, dosya doğrulama
  (uzantı/MIME/boyut), `IFileStorageService` (zaten hazır) ile kayıt, arşivleme
  (`DELETE` → soft delete)
- Backend: Kategori/marka/anahtar kelime filtresi
  (`GET /api/materials?category=&brand=&q=`)
- Frontend: `material-form`, `material-list`, `material-detail` bileşenlerinin
  gerçek API'ye bağlanması; yükleme ilerleme göstergesi

**Bitti sayılır:** İçerik yöneticisi iki markaya açık bir eğitim dokümanı
yükleyebiliyor; liste filtrelenebiliyor.

---

## 5. `feature/bayi-marka-erisimi`

**Bağımlılık:** 4 (materyal olmadan test edilemez); ideal olarak 2 de merge olmuş
olmalı. **Paralel çalışma yok** — sıralı ilerlemeli.

**Neden kritik:** Projenin en önemli iş kuralı:
`DealerBrands ∩ MaterialBrands ≠ ∅`.

- Backend: `GET /api/materials`, `GET /api/materials/{id}`,
  `GET /api/materials/{id}/download` içinde marka kesişim kontrolü; yetkisiz
  erişimde içerik body'de hiç dönmeden 403

**Bitti sayılır:** PDF'in negatif senaryosu çalışıyor — Marka B bayisi Marka A
içeriğinin ID'sini bilse bile 403 alıyor.

---

## 6. `feature/access-logs`

**Bağımlılık:** 5 (yetkisiz denemelerin VIEW olarak loglanmaması için önce erişim
kontrolünün oturmuş olması gerekiyor). **Paralel çalışma yok.**

- Backend: Detay görüntülemede `VIEW`, indirmede `DOWNLOAD` → `AccessLogs`'a yazma
  (UserId, MaterialId, UTC zaman, IP, User-Agent); `GET /api/access-logs`
  (filtrelenebilir, sadece Admin)
- Frontend: `access-logs` ekranının gerçek API'ye bağlanması + filtre UI

**Bitti sayılır:** Bir bayi içeriği görüntüleyip indirince, yönetici erişim
kayıtları ekranında bunu kullanıcı/doküman/zaman/IP ile görebiliyor.

---

## 7. `feature/test-ve-teslim`

**Bağımlılık:** 6 (hepsini kapsar). **Paralel çalışma yok — son adım.**

- Tüm demo senaryosunu uçtan uca doğrulama, eksik hata mesajlarını düzeltme
- Temel test coverage'ı ekleme (şu an backend'de test projesi, frontend'de
  `.spec.ts` dosyası hiç yok)
- README'yi güncel duruma göre son haline getirme

**Bitti sayılır:** PDF sayfa 7'deki 10 maddelik "Minimum kabul kriterleri"
listesinin tamamı işaretlenebiliyor.

---

## Küçük not (kod tutarsızlığı)

`MaterialStatus` enum'u (Draft/Active/Archived) tanımlı ama `Material.Status` alanı
hâlâ `string` — enum hiç kullanılmıyor. `feature/materials-crud` sırasında bu
bağlanmalı.
