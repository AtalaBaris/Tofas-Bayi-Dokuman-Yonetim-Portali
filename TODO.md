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

## Mevcut durum özeti (2026-07-16)

### ✅ Tamamlanan: Bayi + Admin login ekranları (frontend, PR #1 ile merge oldu)

`feature-frontend-bayilogin` dalında yapıldı, `Develop`'a merge edildi (`9d239f9`).
Beklenenden çok daha ileri seviyede tamamlanmış:

- `features/bayi/login/components/bayi-login/` — Reactive Forms, email/şifre
  validasyonu, şifre göster/gizle, animasyonlar, kendi SCSS'i
- `features/admin/login/components/admin-login/` — aynı kalite/yapı, admin tarafı
- `features/admin/admin.routes.ts` + `features/admin/guards/admin.guards.ts` —
  `/admin/login`, `/admin/access-logs`, `/admin/materials/new` route'ları ve
  `adminAuthGuard`/`adminRoleGuard` (eski `core/guards/role.guard.ts` artık
  **kullanılmıyor** — bkz. temizlik notu aşağıda)
- `AuthService` genişletildi: `rememberMe` (localStorage/sessionStorage seçimi),
  `LoginOptions.portal` ('bayi' | 'admin')

### ⚠️ Hâlâ placeholder olan kısım

`AuthService.login()` gerçek bir API çağrısı yapmıyor — `portal` parametresine göre
sahte bir rol atayıp (`admin` → `Admin`, aksi halde `DealerUser`) sahte `dev-token`
döndürüyor. Formlar ve guard'lar **gerçek**, ama arkalarında gerçek bir backend yok.

### ❌ Backend'de hâlâ hiçbir şey yok

`Develop` dalında da backend tarafı bu oturumun başındaki durumla birebir aynı:
sadece `HealthController` var. JWT wiring, seed veri, `AuthController`,
`MaterialsController` — hiçbiri yazılmadı. (`feature-backend-auth` adında bir dal
zaten **açılmış** ama içi boş — bu, tam olarak sırada bekleyen iş.)

### 🧹 Küçük temizlik notu

`frontend/src/app/core/guards/role.guard.ts` artık kullanılmıyor
(`admin.guards.ts`'teki `adminRoleGuard` onun yerini aldı). Backend auth branch'i
sırasında veya ayrı bir küçük commit'te silinmeli.

### 📌 Ekibin zaten açtığı ama içi boş dallar

- `feature-backend-auth` — backend auth işi için ayrılmış, hiç commit yok
- `feature-frontend-paylasilan-dokuman-listesi` — materyal listesi ekranı için
  ayrılmış (bayilogin merge'inden sonra açılmış), hiç commit yok
- `feature-frontend-admin-login`, `feature-frontend-auth-login` — muhtemelen ilk
  denemeler, iş asıl `feature-frontend-bayilogin`'de tamamlanmış görünüyor. Bu ikisi
  muhtemelen artık gereksiz (silinebilir) — ekiple teyit edin.

---

## Bağımlılık grafiği (güncel)

```
✅ frontend: bayi-login + admin-login          (feature-frontend-bayilogin, merge oldu)
        │
        ▼
1. feature-backend-auth          ← SIRADAKİ İŞ, dal zaten açık
   (JWT + seed + login endpoint + AuthService'i gerçek API'ye bağlama)
        │
        ▼
2. feature-backend-authorization ──┐
        │                          │  (ikisi de sadece 1'e bağımlı,
        ▼                          │   birbirlerine bağımlı değiller)
3. feature-*-tanim-yonetimi ───────┤
                                   │
4. feature-frontend-paylasilan-dokuman-listesi  (dal zaten açık)
   + feature-backend-materials ────┘
        │
        ▼
5. feature-*-bayi-marka-erisimi   (4'e bağımlı; ideal olarak 2 de merge olmuş olmalı)
        │
        ▼
6. feature-*-access-logs          (5'e bağımlı)
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

## 1. `feature-backend-auth` (dal zaten açık — sıradaki iş)

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

## 4. `feature-frontend-paylasilan-dokuman-listesi` (dal zaten açık) + `feature-backend-materials`

**Bağımlılık:** yalnızca 1 (seed'deki Brand/Category verisi yeterli). **Paralel
çalışılabilir:** 2, 3 ile birlikte.

- Backend: `MaterialsController` — `POST/PUT/GET /api/materials`, dosya doğrulama
  (uzantı/MIME/boyut), `IFileStorageService` (zaten hazır) ile kayıt, arşivleme
  (`DELETE` → soft delete), kategori/marka/anahtar kelime filtresi
- Frontend: `material-form`, `material-list`, `material-detail` bileşenleri hâlâ boş
  stub (bu oturumda değişmedi) — gerçek API'ye bağlanması, yükleme ilerleme
  göstergesi

**Bitti sayılır:** İçerik yöneticisi iki markaya açık bir eğitim dokümanı
yükleyebiliyor; liste filtrelenebiliyor.

---

## 5. `feature-*-bayi-marka-erisimi`

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

## 6. `feature-*-access-logs`

**Bağımlılık:** 5 (yetkisiz denemelerin VIEW olarak loglanmaması için önce erişim
kontrolünün oturmuş olması gerekiyor). **Paralel çalışma yok.**

- Backend: Detay görüntülemede `VIEW`, indirmede `DOWNLOAD` → `AccessLogs`'a yazma
  (UserId, MaterialId, UTC zaman, IP, User-Agent); `GET /api/access-logs`
  (filtrelenebilir, sadece Admin)
- Frontend: `features/admin/access-logs` hâlâ boş stub (bu oturumda değişmedi) —
  gerçek API'ye bağlanması + filtre UI

**Bitti sayılır:** Bir bayi içeriği görüntüleyip indirince, yönetici erişim
kayıtları ekranında bunu kullanıcı/doküman/zaman/IP ile görebiliyor.

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

## Küçük not (kod tutarsızlığı)

`MaterialStatus` enum'u (Draft/Active/Archived) tanımlı ama `Material.Status` alanı
hâlâ `string` — enum hiç kullanılmıyor. `feature-backend-materials` sırasında bu
bağlanmalı.
