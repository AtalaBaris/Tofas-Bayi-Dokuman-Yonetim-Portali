# Bayi Doküman Yönetimi Portalı

<p align="center">
  <strong>Bayilere marka bazlı doküman, duyuru, eğitim ve pazarlama materyali sunan;<br>
  içerik erişimlerini kayıt altına alan web portalı</strong>
</p>

<p align="center">
  <img alt="MVP" src="https://img.shields.io/badge/MVP-4--6%20hafta-0F2C4C?style=flat-square" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-Angular-DD0031?style=flat-square" />
  <img alt="Backend" src="https://img.shields.io/badge/Backend-ASP.NET%20Core-512BD4?style=flat-square" />
  <img alt="DB" src="https://img.shields.io/badge/DB-PostgreSQL-336791?style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/repo-public-success?style=flat-square" />
</p>

<p align="center">
  <a href="https://github.com/AtalaBaris/Tofas-Bayi-Dokuman-Yonetim-Portali"><strong>GitHub deposu</strong></a>
  ·
  <a href="#getting-started"><strong>Hızlı kurulum</strong></a>
  ·
  <a href="#kabul-kriterleri"><strong>Kabul kriterleri</strong></a>
</p>

---

## İçindekiler

> Clone sonrası önce <a href="#getting-started"><b>§1 Getting Started</b></a> ile ortamı ayağa kaldır.

| # | Bölüm | Ne bulursun? |
|---|--------|--------------|
| 1 | [Kurulum (Getting Started)](#getting-started) | Ön koşullar, DB, API, Angular |
| 2 | [Amaç ve kapsam](#amac-kapsam) | MVP tanımı, kategoriler, teknolojiler |
| 3 | [Roller ve akış](#roller-akis) | Kim ne yapar, kullanıcı hikâyeleri |
| 4 | [Ekranlar ve form](#ekranlar-form) | 6 ekran + içerik formu alanları |
| 5 | [Gereksinimler](#gereksinimler) | FR / NFR / UC / test checklist |
| 6 | [Mimari](#mimari) | Monorepo, Clean Architecture |
| 7 | [Klasör yapısı](#klasor-yapisi) | Backend & frontend ağaçları |
| 8 | [Veritabanı & Docker](#docker-db) | Docker / lokal Postgres |
| 9 | [Veri modeli & API](#veri-modeli-api) | Tablolar, ilişkiler, REST uçları |
| 10 | [Güvenlik](#guvenlik) | Marka yetkisi, soft delete, DTO |
| 11 | [Plan & teslim](#plan-teslim) | Takvim, demo senaryosu |
| 12 | [Kabul kriterleri](#kabul-kriterleri) | MVP checklist |
| 13 | [Katkı notları](#katki) | Dal stratejisi, hatırlatmalar |

---

<a id="getting-started"></a>
## 🚀 1. Geliştirici Kurulum Adımları (Getting Started)

Bu bölüm **hiçbir şey kurulu olmayan** bir makine için yazılmıştır. Sıra: araçları kur → repo’yu al → veritabanını hazırla → API → Angular.

### 🧭 Büyük resim (ne çalışacak?)

| Parça | Nerede çalışır? | Adres |
|-------|------------------|--------|
| PostgreSQL | Docker **veya** bilgisayarındaki Postgres | `localhost:5432` (lokal) / `localhost:5433` (Docker Compose) |
| Backend API | Lokal `dotnet run` | `https://localhost:7085` (Swagger: `/swagger`) |
| Frontend | Lokal `ng serve` | `http://localhost:4200` |

> ❗ API ve Angular **Docker’a konmaz**. Docker (istersen) **sadece PostgreSQL** içindir.

---

### 0️⃣ Bilgisayara kurulacaklar (ön koşullar)

Aşağıdakileri **bir kez** kur. Zaten varsa “kontrol” komutlarıyla doğrula.

#### A) Git

- macOS: genelde Xcode Command Line Tools ile gelir  
  `xcode-select --install`
- Kontrol: `git --version`

#### B) .NET SDK (**9.x** — bu repo `net9.0`)

1. https://dotnet.microsoft.com/download adresinden **.NET 9 SDK** indirip kur  
2. Terminali kapatıp yeniden aç  
3. Kontrol:

```bash
dotnet --version
# örn. 9.0.xxx
```

#### C) EF Core Tools (migration komutları için)

```bash
dotnet tool install --global dotnet-ef --version 9.0.7
```

PATH’e ekle (macOS / zsh, bir kez):

```bash
echo 'export PATH="$PATH:$HOME/.dotnet/tools"' >> ~/.zprofile
source ~/.zprofile
```

Kontrol: `dotnet ef --version`

#### D) Node.js (Angular için)

1. https://nodejs.org → **LTS** (20 veya 22) kur  
   veya: `brew install node`
2. Kontrol:

```bash
node --version
npm --version
```

#### E) Angular CLI

```bash
npm install -g @angular/cli
ng version
```

#### F) PostgreSQL — iki yoldan **birini** seç

| Yol | Ne zaman? |
|-----|-----------|
| **Yol 1 — Docker Desktop** | Docker’ı sorunsuz kullanabiliyorsan (önerilen ekip standardı) |
| **Yol 2 — Lokal Postgres (Homebrew)** | Mac’te zaten Postgres varsa **veya** Docker Hub yavaş/timeout veriyorsa |

**Yol 1 — Docker Desktop**

1. https://www.docker.com/products/docker-desktop/ → Mac için indir, kur, **Docker’ı aç** (balina ikonu çalışır olmalı)  
2. Kontrol: `docker --version` ve `docker compose version`  
3. Not: Bilgisayarında Homebrew Postgres **5432**’yi dolduruyorsa Compose **5433** portunu kullanır (aşağıda).

**Yol 2 — Lokal PostgreSQL (Homebrew, macOS)**

```bash
brew install postgresql@16
brew services start postgresql@16
psql --version
```

---

### ① Repoyu klonlama

```bash
git clone https://github.com/AtalaBaris/Tofas-Bayi-Dokuman-Yonetim-Portali.git
cd BayiDokumanYonetimPortali
```

Bu klasörün içinde `backend/`, `frontend/`, `docker-compose.yml`, `README.md` görmelisin.

---

### ② Veritabanını hazırlama

#### Yol 1 — Docker ile PostgreSQL

Docker Desktop **açık** olsun, sonra repo kökünde:

```bash
docker compose up -d
docker ps
# bayi-portal-db görünmeli
```

Compose, Postgres’i host’ta **5433** portuna map’ler (5432 çoğu Mac’te dolu olduğu için).

Connection string (**Docker kullanıyorsan Port=5433**):

```json
"DefaultConnection": "Host=localhost;Port=5433;Database=BayiPortalDb;Username=bayi;Password=bayi123"
```

Dosya: `backend/src/BayiPortal.API/appsettings.Development.json`  
(ve gerekirse `appsettings.json`)

Durdurma:

```bash
docker compose down
# veriyi de silmek istersen:
# docker compose down -v
```

> Docker Hub’dan `TLS handshake timeout` alırsan: ağ/VPN’i değiştirip tekrar `docker compose up -d` dene **veya Yol 2’ye geç**.

#### Yol 2 — Lokal Postgres ile (Docker şart değil)

Homebrew Postgres zaten `5432`’de çalışıyorsa `bayi` kullanıcısı ve DB’yi oluştur:

```bash
psql -h localhost -p 5432 -d postgres <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bayi') THEN
    CREATE ROLE bayi LOGIN PASSWORD 'bayi123';
  ELSE
    ALTER ROLE bayi WITH LOGIN PASSWORD 'bayi123';
  END IF;
END
$$;

SELECT 'CREATE DATABASE "BayiPortalDb" OWNER bayi'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'BayiPortalDb')\gexec

GRANT ALL PRIVILEGES ON DATABASE "BayiPortalDb" TO bayi;
SQL

psql -h localhost -p 5432 -d BayiPortalDb <<'SQL'
GRANT ALL ON SCHEMA public TO bayi;
ALTER SCHEMA public OWNER TO bayi;
SQL
```

Connection string (**lokal Postgres → Port=5432**):

```json
"DefaultConnection": "Host=localhost;Port=5432;Database=BayiPortalDb;Username=bayi;Password=bayi123"
```

---

### ③ Tabloları oluştur (Entity Framework migration)

Repo kökünden:

```bash
dotnet ef database update \
  --project backend/src/BayiPortal.Infrastructure \
  --startup-project backend/src/BayiPortal.API
```

Başarılı bitiş: terminalde **`Done.`** görmelisin.

Sık hatalar:

| Hata | Anlamı | Ne yap |
|------|--------|--------|
| `role "bayi" does not exist` | Yanlış Postgres’e / eksik kullanıcıya bağlanıyorsun | Yol 2’deki `CREATE ROLE`’ü çalıştır veya Docker’ın gerçekten ayakta olduğunu kontrol et |
| `Connection refused` :5432/5433 | DB kapalı veya port yanlış | `brew services start postgresql@16` veya `docker compose up -d`; connection string portunu kontrol et |
| `dotnet ef` bulunamadı | Tool PATH’te değil | Bölüm 0-C’yi tekrarla |

> Migration dosyası repoda zaten var (`InitialCreate`). Yeniden `migrations add` **gerekmez** — sadece `database update`.

---

### ④ Backend API’yi çalıştır

```bash
dotnet run --project backend/src/BayiPortal.API
```

- API: **https://localhost:7085** (veya http://localhost:5037)
- Swagger: **https://localhost:7085/swagger**
- Health: `GET /api/health`

Tarayıcı sertifika uyarısı verirse (geliştirme): Advanced → devam et / `dotnet dev-certs https --trust` (macOS).

---

### ⑤ Frontend (Angular) çalıştır

**Yeni bir terminal** aç (API açık kalsın):

```bash
cd frontend
npm install
ng serve
```

- Uygulama: **http://localhost:4200**
- API adresi: `frontend/src/environments/environment.ts` → şu an:

```ts
apiUrl: 'https://localhost:7085/api'
```

API farklı portta açılırsa **bu dosyayı** güncelle.

---

### 6️⃣ Her gün / her klon sonrası hızlı checklist

```bash
# 1) DB ayakta mı?
# Docker:  docker ps
# Lokal:   brew services list | grep postgres

# 2) (İlk sefer veya DB sıfırsa) migration
dotnet ef database update \
  --project backend/src/BayiPortal.Infrastructure \
  --startup-project backend/src/BayiPortal.API

# 3) API
dotnet run --project backend/src/BayiPortal.API

# 4) UI (ayrı terminal)
cd frontend && npm install && ng serve
```

---

### 🧪 Hızlı duman testi

1. Swagger açılır mı? (`/swagger`)  
2. `GET /api/health` → `{ status: "ok" }`  
3. Angular `http://localhost:4200` açılır mı? (login ekranı iskeleti)  
4. Auth/login + içerik akışı implemente edildikçe: upload → bayi görür → diğer bayi 403 → access-logs  

### 👤 Örnek kullanıcılar (seed — eklendikten sonra geçerli)

> Seed yazılmadan bu hesaplar **giriş yapmaz**. Şifreler yalnızca geliştirme içindir.

| Rol | E-posta (örnek) | Şifre (örnek) | Not |
|-----|-----------------|---------------|-----|
| 👑 Yönetici | `admin@bayiportal.local` | `Admin123!` | Tanımlar + erişim kayıtları |
| 📝 İçerik Yöneticisi | `editor@bayiportal.local` | `Editor123!` | İçerik yükleme / arşivleme |
| 🏪 Bayi Kullanıcısı A | `bayi.a@bayiportal.local` | `Bayi123!` | Marka seti A |
| 🏪 Bayi Kullanıcısı B | `bayi.b@bayiportal.local` | `Bayi123!` | Marka seti B (demo engeli) |

### 📎 Dosya yükleme limitleri (önerilen MVP)

| Kural | Öneri |
|-------|--------|
| Max dosya boyutu | **25 MB** (yapılandırılabilir) |
| İzin verilen türler | JPG, PNG, PDF, DOCX, PPTX, MP3, WAV, MP4 |
| Saklama | Binary diskte; metadata PostgreSQL’de |

### 🧯 Sık karşılaşılan sorunlar (troubleshooting)

| Belirti | Çözüm |
|---------|--------|
| Docker `TLS handshake timeout` | VPN/kablosuz değiştir; tekrar çek; olmazsa **Yol 2 (lokal Postgres)** |
| `role "bayi" does not exist` | Lokal Postgres’te role oluştur **veya** Docker’ın `bayi` user’lı konteynerine doğru porta bağlan |
| Mac’te 5432 dolu, Docker açılmıyor gibi | Compose zaten **5433** kullanıyor → connection string’de `Port=5433` |
| Angular API’ye ulaşamıyor / CORS | API’nin `7085`’te olduğundan ve `environment.ts` `apiUrl`’inin uyumlu olduğundan emin ol |
| `dotnet ef` komutu yok | `dotnet tool install --global dotnet-ef --version 9.0.7` + PATH |
| `ng: command not found` | `npm install -g @angular/cli` |

---

---

<a id="amac-kapsam"></a>
## 🎯 2. Projenin Amacı ve Kapsamı

### 📌 Neden bu portal?

Farklı markalara hizmet veren bayilerin ihtiyaç duyduğu güncel içeriklere **tek bir portal** üzerinden güvenli biçimde ulaşmasını sağlamak; içeriklerin kim tarafından, hangi markalar için yayımlandığını ve kimler tarafından görüntülendiğini **izlenebilir** kılmaktır.

### 🏆 MVP Başarı Tanımı

MVP’nin başarılı sayılması için aşağıdaki üç koşulun **aynı anda** sağlanması gerekir:

| # | Koşul | Açıklama |
|---|--------|----------|
| ✅ | **İçerik yükleme** | Yetkili kullanıcı (Yönetici / İçerik Yöneticisi) portal üzerinden içerik yükleyebilmeli |
| ✅ | **Marka bazlı erişim** | Bayi kullanıcısı **yalnızca** kendi bayisine bağlı markalara açılan içerikleri görebilmeli |
| ✅ | **Erişim kaydı** | Her görüntüleme; **kullanıcı – doküman – tarih – IP** bilgileriyle kaydedilmelidir |

> 💡 **Özet:** “Doğru kişi doğru içeriği görür; her erişim iz bırakır.”

### 📋 MVP Kapsamı

MVP döneminde aşağıdaki işlevler **eksiksiz** teslim edilir:

1. 🔐 **Kullanıcı girişi ve rol bazlı yetkilendirme**
2. 📄 **İçerik ekleme, düzenleme, arşivleme ve listeleme**
3. 🏷️ **Bir içeriği bir veya birden fazla markayla paylaşma**
4. 🏪 **Bayi kullanıcısına yalnızca yetkili olduğu marka içeriklerini gösterme**
5. 🔎 **Kategori, marka ve anahtar kelimeyle filtreleme**
6. 🧾 **Görüntüleme ve indirme hareketlerini kayıt altına alma**
7. 📊 **Yönetici için temel erişim kayıtları ekranı**

### 📚 İçerik Kategorileri

MVP’de içerikler şu üç kategori altında yönetilir:

| Kategori | Örnek içerikler | Örnek dosya türleri |
|----------|-----------------|---------------------|
| 📣 **Pazarlama Materyalleri** | Billboard ve broşür görseli, radyo spotu, video wall içeriği, plakalık metni/görseli, sosyal medya içeriği | JPG, PNG, PDF, MP3, WAV, MP4 |
| 📢 **Genel Duyuru** | Kampanya, operasyon, organizasyon veya bayi ağına yönelik duyurular | PDF, DOCX, görsel |
| 🎓 **Eğitim Dokümanı** | Uygulama tanıtımı, süreç anlatımı, kullanım kılavuzu, denetim dokümanı ve eğitim videosu | PDF, PPTX, DOCX, MP4 |

### 🧰 Kullanılan Teknolojiler

| Katman | Teknoloji | Rolü |
|--------|-----------|------|
| 🖥️ **Frontend** | **Angular** | Web arayüzü, formlar, route guard’lar, API istemcisi |
| ⚙️ **Backend** | **ASP.NET Core** (REST Web API) | İş kuralları, yetkilendirme, dosya yükleme, JWT |
| 🗄️ **Veritabanı** | **PostgreSQL** | İlişkisel veri saklama |
| 🧩 **ORM** | **Entity Framework Core** | Entity’ler, migration’lar, repository erişimi |

**Destekleyici araçlar :**

- 🔐 JWT tabanlı kimlik doğrulama
- 📘 Swagger / OpenAPI (API keşfi ve test)
- 🐳 Docker Compose (**yalnızca** PostgreSQL için)

---

<a id="roller-akis"></a>
## 👥 3. Kullanıcı Rolleri ve Temel Akış

> ⚠️ **Yetkilendirme kuralı:** Yetkilendirme **hem ekranda (Angular Guard)** hem de **backend (API)** tarafında uygulanmalıdır. Frontend yalnızca UX içindir; asıl güvenlik her zaman API’dedir.

| Rol | Yapabilecekleri | Görememesi gerekenler |
|-----|-----------------|------------------------|
| 👑 **Yönetici** | Kullanıcı, bayi, marka ve kategori yönetimi; tüm içerik ve erişim kayıtlarını görüntüleme | — |
| 📝 **İçerik Yöneticisi** | İçerik yükleme, düzenleme, marka seçme, yayımlama ve arşivleme | Kullanıcı şifreleri ve yetkisi dışındaki sistem ayarları |
| 🏪 **Bayi Kullanıcısı** | Kendi bayisinin markalarına açılmış aktif içerikleri listeleme, görüntüleme ve indirme | Başka markaların içerikleri, içerik yönetimi ve erişim kayıtları |

### 🔄 Temel Kullanım Akışı

| Adım | Aşama | Ne olur? |
|------|--------|----------|
| **1** | 🚪 **Giriş** | Kullanıcı sisteme giriş yapar |
| **2** | ⬆️ **Yükleme** | İçerik yöneticisi dosya ve bilgileri ekler |
| **3** | 🎯 **Hedefleme** | Kategori ve paylaşılacak markalar seçilir |
| **4** | 👀 **Erişim** | Bayi yalnızca yetkili olduğu içeriği görür |
| **5** | 📊 **İzleme** | Görüntüleme ve indirme kaydı oluşur |

```text
Giriş → Yükleme → Hedefleme → Erişim → İzleme
```

### 📖 Örnek kullanıcı hikâyeleri

| ID | Rol | Hikâye |
|----|-----|--------|
| US-01 | İçerik Yöneticisi | Bir eğitim dokümanını seçtiğim markalara yayımlamak istiyorum ki doğru bayiler görsün. |
| US-02 | Bayi Kullanıcısı | Yalnızca temsil ettiğim markalara ait güncel içerikleri görmek istiyorum. |
| US-03 | Yönetici | Belirli bir dokümanı kimlerin, ne zaman ve hangi IP’den açtığını görmek istiyorum. |
| US-04 | Bayi Kullanıcısı | İçeriği indirmek istiyorum ve indirme kaydının oluşmasını bekliyorum. |
| US-05 | İçerik Yöneticisi | Hatalı / güncel olmayan içeriği arşivleyerek bayilerden gizlemek istiyorum. |
| US-06 | Yönetici | Kullanıcı, bayi, marka ve kategori tanımlarını yönetmek istiyorum. |

> Detaylı akışlar için [Gereksinim Analizi ve Kullanım Senaryoları](#gereksinimler) bölümüne bakın.

---

<a id="ekranlar-form"></a>
## 🖥️ 4. Beklenen Ekranlar ve Form

Tasarım **sade**, **mobil uyumlu** ve anlaşılır olmalıdır.

| # | Ekran | Zorunlu fonksiyonlar |
|---|--------|----------------------|
| 1 | 🚪 **Giriş** | E-posta/kullanıcı adı ve şifre ile giriş; hatalı giriş mesajı; başarılı girişte role göre yönlendirme. *(İsteğe bağlı UX: Bayi ve Yönetim için ayrı login yüzeyi; backend yine tek `POST /api/auth/login`.)* |
| 2 | 🏠 **Ana Sayfa / İçerik Listesi** | Kart veya tablo görünümü; başlık, kategori, marka, yayımlanma tarihi; anahtar kelime, kategori ve marka filtresi |
| 3 | 📄 **İçerik Detayı** | Başlık, açıklama, kategori, markalar, yükleyen kişi, tarih ve dosya bilgisi; görüntüle / indir aksiyonu |
| 4 | 🛠️ **İçerik Yönetimi** | Yeni içerik ekleme; düzenleme; Aktif / Pasif veya Arşiv durumu; marka çoklu seçimi |
| 5 | 📚 **Tanım Yönetimi** | Yönetici için kullanıcı, bayi, marka ve kategori listeleme / ekleme / düzenleme |
| 6 | 📊 **Erişim Kayıtları** | Kullanıcı, bayi, doküman, aksiyon, tarih aralığı ve IP bazlı listeleme / filtreleme |

### 📝 İçerik ekleme formu

| Alan | Zorunluluk | Açıklama |
|------|------------|----------|
| **Başlık** | Zorunlu | Kısa ve açıklayıcı içerik adı |
| **Açıklama** | Zorunlu | İçeriğin amacı ve kullanım yeri |
| **Kategori** | Zorunlu | Pazarlama, Genel Duyuru veya Eğitim |
| **Markalar** | Zorunlu | Bir veya birden fazla marka seçilebilir |
| **Dosya** | Zorunlu | İzin verilen dosya türü ve boyutu kontrol edilir |
| **Yayın / bitiş tarihi** | Opsiyonel | İçeriğin görünürlük dönemi |
| **Durum** | Zorunlu | Taslak, Aktif veya Arşiv |

---

<a id="gereksinimler"></a>
## 📐 5. Gereksinim Analizi ve Kullanım Senaryoları

Bu bölüm MVP kapsamındaki **fonksiyonel (FR)** ve **fonksiyonel olmayan (NFR)** gereksinimleri ile yapılandırılmış kullanım senaryolarını tanımlar.

### 🎯 Fonksiyonel gereksinimler (FR)

| ID | Gereksinim | Öncelik | İlgili rol |
|----|------------|---------|------------|
| **FR-01** | Kullanıcı e-posta/kullanıcı adı ve şifre ile giriş yapabilmeli; hatalı girişte anlaşılır mesaj gösterilmeli | Must | Tümü |
| **FR-02** | Başarılı girişte kullanıcı rolüne göre yönlendirilmeli (bayi → içerik listesi; yönetim → yönetim ekranları) | Must | Tümü |
| **FR-03** | İçerik yöneticisi / yönetici içerik ekleyebilmeli (form alanları + dosya, `multipart`) | Must | Admin, ContentManager |
| **FR-04** | İçerik bir veya birden fazla markaya atanabilmeli | Must | Admin, ContentManager |
| **FR-05** | İçerik düzenlenebilmeli; durum Taslak / Aktif / Arşiv olabilmeli; silme soft-delete (arşiv) olmalı | Must | Admin, ContentManager |
| **FR-06** | Bayi kullanıcısı yalnızca bayisinin markalarıyla kesişen **aktif** içerikleri listeleyebilmeli | Must | DealerUser |
| **FR-07** | Liste; anahtar kelime, kategori ve marka ile filtrelenebilmeli | Must | Tümü (yetkiye göre) |
| **FR-08** | İçerik detayında metadata + görüntüle / indir aksiyonları sunulmalı | Must | Yetkili kullanıcı |
| **FR-09** | Detay görüntülemede **VIEW**, indirmede **DOWNLOAD** erişim kaydı oluşmalı (kullanıcı, doküman, UTC zaman, IP) | Must | Sistem |
| **FR-10** | Marka yetkisi her ilgili API isteğinde backend’de doğrulanmalı; URL bilinse bile yetkisiz içerik dönmemeli (401/403) | Must | Sistem |
| **FR-11** | Yönetici kullanıcı, bayi, marka, kategori tanımlarını listeleyip ekleyip düzenleyebilmeli | Must | Admin |
| **FR-12** | Yönetici erişim kayıtlarını kullanıcı, bayi, doküman, aksiyon, tarih aralığı ve IP’ye göre filtreleyebilmeli | Must | Admin |
| **FR-13** | Dosya uzantısı, MIME ve boyut doğrulanmalı; orijinal ad diskte kullanılmamalı (`StoredFileName`) | Must | Sistem |
| **FR-14** | Dışarıya giden veriler DTO ile taşınmalı; `PasswordHash` / sunucu yolu istemciye gitmemeli | Must | Sistem |

### ⚙️ Fonksiyonel olmayan gereksinimler (NFR)

| ID | Alan | Beklenti |
|----|------|----------|
| **NFR-01** | Usability | Arayüz sade, mobil uyumlu, anlaşılır hata mesajları |
| **NFR-02** | Security | JWT (veya Identity + JWT); düz metin parola yok; path traversal engeli |
| **NFR-03** | Authorization | Ekran (Guard) + API katmanında çift kontrol |
| **NFR-04** | Auditability | VIEW/DOWNLOAD logları UTC; IP + tercihen User-Agent |
| **NFR-05** | Maintainability | Clean Architecture / feature modüller; iş kuralları Application’da |
| **NFR-06** | Observability | Teknik hatalar backend’de loglanır; kullanıcıya stack/path gösterilmez |
| **NFR-07** | Portability (dev) | PostgreSQL Docker Compose ile; API/Angular lokal çalışır |
| **NFR-08** | Documentability | Swagger açık; README ile temiz kurulum mümkün |
| **NFR-09** | Time | Zamanlar DB’de UTC; UI’da yerel saate çevrilir |
| **NFR-10** | Upload UX | Yüklemede ilerleme göstergesi ve anlaşılır hata metni |

---

### 🎬 Kullanım senaryoları (Use Cases)

#### UC-01 — Sisteme giriş

| | |
|--|--|
| **Aktör** | Yönetici / İçerik Yöneticisi / Bayi Kullanıcısı |
| **Önkoşul** | Kullanıcı kaydı seed’de veya tanım ekranında mevcut; `IsActive = true` |
| **Tetikleyici** | Login ekranında “Giriş Yap” |
| **Ana akış** | 1) E-posta ve şifre girilir → 2) API token üretir → 3) Role göre yönlendirme |
| **Alternatif / hata** | Yanlış kimlik bilgisi → anlaşılır hata, token yok. Pasif kullanıcı → giriş reddi. |
| **Sonuç** | Oturum açılır; sonraki isteklerde JWT interceptor ile taşınır |
| **FR** | FR-01, FR-02 |

#### UC-02 — İçerik yükleme ve marka hedefleme

| | |
|--|--|
| **Aktör** | İçerik Yöneticisi / Yönetici |
| **Önkoşul** | Yönetim oturumu açık; en az bir kategori ve marka tanımlı |
| **Ana akış** | 1) Form doldurulur → 2) Dosya seçilir → 3) Marka(lar) seçilir → 4) Durum (örn. Aktif) → 5) Kayıt + disk’e unique ad ile yazım |
| **Alternatif / hata** | Eksik zorunlu alan → validasyon. Yasak uzantı / aşırı boyut → anlaşılır hata, kayıt oluşmaz. |
| **Sonuç** | `Materials` + `MaterialBrands` oluşur; bayi listelerinde (aktifse) görünür |
| **FR** | FR-03, FR-04, FR-05, FR-13, NFR-10 |

#### UC-03 — Bayi içerik listesi ve filtreleme

| | |
|--|--|
| **Aktör** | Bayi Kullanıcısı |
| **Önkoşul** | Bayi kullanıcısı oturumu; `DealerId` dolu; `DealerBrands` kayıtlı |
| **Ana akış** | 1) Liste açılır → 2) Yalnızca marka kesişimi olan aktif içerikler gelir → 3) İsteğe bağlı keyword / kategori / marka filtresi |
| **Alternatif / hata** | Kesişim yok → boş liste. Taslak / arşiv / süresi dolmuş → listede yok. |
| **Sonuç** | Kullanıcı yalnızca yetkili içerikleri görür |
| **FR** | FR-06, FR-07, FR-10 |

#### UC-04 — İçerik detayı görüntüleme (VIEW)

| | |
|--|--|
| **Aktör** | Yetkili kullanıcı (çoğunlukla Bayi) |
| **Önkoşul** | İçerik aktif ve marka yetkisi var |
| **Ana akış** | 1) Detay açılır → 2) Metadata gösterilir → 3) `AccessLogs`’a **VIEW** yazılır (UserId, MaterialId, UTC, IP) |
| **Alternatif / hata** | Yetkisiz / bilinen URL → **403** (veya giriş yoksa **401**); log’a başarılı VIEW yazılmaz veya güvenlik politikasına göre deneme loglanabilir (MVP: yetkisiz erişimde içerik dönmez) |
| **Sonuç** | Detay görünür; denetim izi oluşur |
| **FR** | FR-08, FR-09, FR-10 |

#### UC-05 — İçerik indirme (DOWNLOAD)

| | |
|--|--|
| **Aktör** | Yetkili kullanıcı |
| **Önkoşul** | UC-04 ile aynı yetki |
| **Ana akış** | 1) İndir tıklanır → 2) Dosya stream edilir → 3) `AccessLogs`’a **DOWNLOAD** yazılır |
| **Alternatif / hata** | Yetkisiz → 403. Dosya diskte yok → kullanıcıya genel hata; detay backend log’da |
| **Sonuç** | Dosya iner; indirme kaydı oluşur |
| **FR** | FR-08, FR-09, FR-10, FR-14 |

#### UC-06 — İçerik arşivleme (soft delete)

| | |
|--|--|
| **Aktör** | İçerik Yöneticisi / Yönetici |
| **Önkoşul** | İçerik kaydı mevcut |
| **Ana akış** | 1) Arşivle / DELETE uçları çağrılır → 2) `Status = Archived` → 3) Bayi listelerinden düşer |
| **Alternatif / hata** | Yetkisiz rol → 403. Hard delete yapılmaz. |
| **Sonuç** | Kayıt DB’de kalır; bayiler göremez |
| **FR** | FR-05 |

#### UC-07 — Yetkisiz erişim denemesi (negatif)

| | |
|--|--|
| **Aktör** | Farklı markadaki Bayi Kullanıcısı |
| **Önkoşul** | İçerik Marka A’ya açık; kullanıcının bayisi yalnızca Marka B |
| **Ana akış** | 1) Liste → içerik görünmez → 2) Doğrudan `GET /api/materials/{id}` → **403** |
| **Sonuç** | Veri sızmaz; demo senaryosunun negatif ayağı |
| **FR** | FR-06, FR-10 |

#### UC-08 — Erişim kayıtlarını inceleme

| | |
|--|--|
| **Aktör** | Yönetici |
| **Önkoşul** | En az bir VIEW/DOWNLOAD kaydı var |
| **Ana akış** | 1) Erişim kayıtları ekranı → 2) Kullanıcı / bayi / doküman / aksiyon / tarih / IP filtresi → 3) Sonuç listelenir |
| **Alternatif / hata** | Bayi veya içerik yöneticisi bu ekrana giremez (Guard + API 403) |
| **Sonuç** | Denetim ihtiyacı karşılanır |
| **FR** | FR-12, FR-11 (tanımlar ayrı) |

#### UC-09 — Tanım yönetimi (kullanıcı / bayi / marka / kategori)

| | |
|--|--|
| **Aktör** | Yönetici |
| **Önkoşul** | Yönetici oturumu |
| **Ana akış** | 1) Tanım ekranı → 2) Ekle / düzenle → 3) `IsActive` ile pasife alınabilir |
| **Alternatif / hata** | İçerik Yöneticisi bu alana erişemez; şifreler hash’li saklanır |
| **Sonuç** | Seed sonrası sürdürülebilir tanım yönetimi |
| **FR** | FR-11, FR-14 |

---

### 🧪 Test senaryosu checklist’i (kısa)

Manuel / Swagger / Postman ile doğrulanacak minimum set:

| # | Senaryo | Beklenen |
|---|---------|----------|
| T-01 | Doğru kimlikle login | 200 + token; role yönlendirme |
| T-02 | Yanlış şifre | Hata mesajı; token yok |
| T-03 | İçerik yöneticisi iki markaya eğitim dokümanı yükler | Kayıt + dosya metadata |
| T-04 | Yasak uzantı veya aşırı boyut | Anlaşılır validasyon hatası |
| T-05 | Marka A bayisi liste/detay/indir | Görür; VIEW + DOWNLOAD log |
| T-06 | Marka B bayisi aynı `id` ile API | **403**; içerik body’de yok |
| T-07 | Arşivlenen içerik | Bayi listesinde yok |
| T-08 | Yönetici access-logs filtre | Kullanıcı, doküman, zaman, IP görünür |
| T-09 | DTO sızıntısı kontrolü | Response’da `PasswordHash` / ham `FilePath` yok |
| T-10 | README kurulum | Temiz ortamda ayağa kalkar |

---

<a id="mimari"></a>
## 🏗️ 6. Genel Mimari ve Repository Stratejisi

> 💡 **Prensip:** Basit, okunabilir ve sürdürülebilir bir yapı yeterlidir; **gereksiz mimari karmaşıklık beklenmez.**

### 📦 Monorepo (Tek Depo)

Proje **monorepo** olarak yönetilir: frontend ve backend aynı Git deposunda yaşar. Böylece:

- 🔗 Ortak sürümleme ve PR süreçleri sadeleşir
- 📚 Tek README ve tek kurulum hikâyesi oluşur
- 👥 3 kişilik ekipte dal / klasör sahipliği net kalır

```text
BayiDokumanYonetimPortali/          ← Monorepo kökü
├── backend/                        ← ASP.NET Core (Modüler Monolit)
├── frontend/                       ← Angular (Feature Modülleri)
├── docker-compose.yml              ← Yalnızca PostgreSQL
└── README.md
```

### 🧱 Önerilen mimari (özet)

```text
┌─────────────────────────────────────┐
│  Angular                            │
│  Sayfalar • Formlar                 │
│  Servisler • Route Guard            │
└─────────────────┬───────────────────┘
                  │ HTTPS / JWT
                  ▼
┌─────────────────────────────────────┐
│  ASP.NET Core Web API               │
│  Controller • Service               │
│  EF Core • JWT • Swagger            │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  PostgreSQL + Dosya Alanı           │
│  Metadata DB’de • Fiziksel dosya    │
│  sunucuda (yapılandırılabilir yol)  │
└─────────────────────────────────────┘
```

### 🧱 Backend: Modüler Monolit (Clean Architecture)

Mikroservis **değildir**. Ancak ileride bölünebilecek şekilde **modüler monolit + Clean Architecture** standartlarında yazılır:

- Katmanlar (Core → Application → Infrastructure → API) birbirinden net ayrılır
- İş kuralları **Application** katmanında toplanır
- Controllers ince kalır; veri erişimi Infrastructure’dadır

#### Backend uygulama kuralları

| # | Kural | Beklenti |
|---|--------|----------|
| 8 | 🗄️ **Veritabanı** | EF Core ile tablo ilişkileri ve **migration** dosyaları oluşturulmalı |
| 9 | 📐 **Katman ayrımı** | **Controller → Service → Data/Repository** ayrımı korunmalı; iş kuralları tek dosyada toplanmamalı |
| 10 | 📦 **DTO** | Şifre özeti ve dosya yolu gibi dahili alanlar istemciye gönderilmemeli |
| 11 | 📘 **Swagger** | OpenAPI açık olmalı; uçlar buradan test edilebilmeli |

### 🧩 Frontend: Feature Modülleri

Angular tarafı, ekip içi çakışmaları azaltmak için **feature-based** yapıya ayrılır:

| Modül | Örnek sorumluluk |
|-------|------------------|
| `auth` | Giriş, token saklama, çıkış |
| `materials` | İçerik listesi, detay, indirme |
| `admin` | Tanımlar, içerik yönetimi, erişim kayıtları |

Route Guard ile sayfa erişimi kısıtlanır; **asıl güvenlik her zaman backend’dedir.**

#### Frontend uygulama kuralları

| # | Kural | Beklenti |
|---|--------|----------|
| 12 | 🧩 **Bileşenler** | Login, içerik listesi, detay, içerik formu ve erişim kaydı sayfaları **ayrı component** olmalı |
| 13 | 🔌 **Servis + Interceptor** | API çağrıları Angular **service** sınıflarında; token ekleme **interceptor** içinde |
| 14 | 🛡️ **Route Guard** | Role göre sayfa erişimi sınırlandırılır; yine de asıl güvenlik backend’dedir |
| 15 | ⏳ **UX** | Yükleme sırasında **ilerleme** ve anlaşılır hata mesajı gösterilmeli |
---

<a id="klasor-yapisi"></a>
## 📂 7. Detaylı Klasör Yapısı

Backend yapısı, iş kurallarının ve altyapı bağımlılıklarının birbirine karışmasını engellemek için **genişletilmiş Clean Architecture** ile granüler tutulur. Frontend’de ise **“her feature kendi içinde bağımsız yaşar”** prensibi benimsenir; her sayfanın `.ts` / `.html` / `.scss` dosyaları izole edilir.

### 🔙 7.1 Backend — Genişletilmiş Clean Architecture

```text
backend/
├── src/
│   ├── BayiPortal.Core/                 # Domain — en iç katman, dışarıyı bilmez
│   │   ├── Entities/                    # User.cs, Material.cs, Dealer.cs, Brand.cs...
│   │   ├── Enums/                       # RoleType.cs, ActionType.cs, MaterialStatus.cs
│   │   └── Exceptions/                  # MaterialNotFoundException.cs vb.
│   │
│   ├── BayiPortal.Application/          # İş kuralları ve use-case’ler ⭐
│   │   ├── DTOs/
│   │   │   ├── Requests/                # CreateMaterialRequest.cs (istemciden gelen)
│   │   │   └── Responses/               # MaterialDetailResponse.cs (istemciye giden)
│   │   ├── Interfaces/
│   │   │   ├── Repositories/            # IMaterialRepository.cs
│   │   │   └── Services/                # IAuthService.cs, IMaterialService.cs
│   │   ├── Mappings/                    # AutoMapper profilleri (Entity ↔ DTO)
│   │   ├── Validators/                  # FluentValidation (dosya boyutu/uzantı vb.)
│   │   └── Services/                    # MaterialManager.cs, AuthManager.cs...
│   │
│   ├── BayiPortal.Infrastructure/       # Altyapı — dış dünya ile iletişim
│   │   ├── Data/
│   │   │   ├── Contexts/                # ApplicationDbContext.cs (EF Core)
│   │   │   └── Configurations/          # Fluent API: tablo ilişkileri, kısıtlar
│   │   ├── Migrations/                  # EF Core veritabanı sürüm dosyaları
│   │   ├── Repositories/                # IRepository → EF Core implementasyonları
│   │   └── Storage/                     # FileStorageService.cs (unique dosya adı)
│   │
│   └── BayiPortal.API/                  # Sunum katmanı — giriş noktası
│       ├── Controllers/                 # AuthController.cs, MaterialsController.cs
│       ├── Middlewares/                 # GlobalExceptionMiddleware.cs
│       ├── Extensions/                  # ServiceCollectionExtensions.cs (Program.cs temiz kalsın)
│       ├── Program.cs                   # Swagger, JWT, DI, CORS
│       └── appsettings.json             # Connection string & ayarlar
│
└── BayiPortal.sln
```

#### 🧭 Backend katman mantığı

| Katman | Ne yapar? | Ne yapmaz? |
|--------|-----------|------------|
| **Core** | Entity, enum, domain exception | DB, HTTP, framework bilmez |
| **Application** | ⭐ **Tüm iş kuralları**, DTO (Request/Response), validasyon, mapping, use-case | Controllers / EF Core burada olmaz |
| **Infrastructure** | DbContext, Fluent API, migration, repository, dosya I/O | İş kuralı yazılmaz |
| **API** | Endpoint, middleware, DI eklentileri, JWT/Swagger wiring | İş mantığı şişirilmez |

> ⚠️ **Altın kural:** Tüm iş kuralları **Application** katmanındadır. Controller ince kalır → service çağırır → **DTO** döner. Kullanıcıya teknik hata göstermemek için `GlobalExceptionMiddleware` kullanılır.

---

### 🔜 7.2 Frontend — Genişletilmiş Feature Modül Yapısı

```text
frontend/
├── src/
│   ├── app/
│   │   ├── core/                        # AppModule tarafından 1 kez yüklenir
│   │   │   ├── guards/                  # auth.guard.ts, role.guard.ts
│   │   │   ├── interceptors/            # jwt.interceptor.ts, error.interceptor.ts
│   │   │   ├── services/                # api.service.ts, auth.service.ts
│   │   │   └── models/                  # material.interface.ts, user.interface.ts
│   │   │
│   │   ├── features/                    # Ana sayfalar ve feature modülleri
│   │   │   ├── auth/                    # --- GİRİŞ MODÜLÜ ---
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   └── login.component.scss
│   │   │   │   └── auth.module.ts
│   │   │   │
│   │   │   ├── materials/               # --- İÇERİK (DOKÜMAN) MODÜLÜ ---
│   │   │   │   ├── material-list/       # Kart/tablo + filtreler
│   │   │   │   │   ├── material-list.component.ts
│   │   │   │   │   ├── material-list.component.html
│   │   │   │   │   └── material-list.component.scss
│   │   │   │   ├── material-detail/     # Detay görüntüleme + indirme
│   │   │   │   │   ├── material-detail.component.ts
│   │   │   │   │   ├── material-detail.component.html
│   │   │   │   │   └── material-detail.component.scss
│   │   │   │   ├── material-form/       # Yeni içerik + dosya yükleme
│   │   │   │   │   ├── material-form.component.ts
│   │   │   │   │   ├── material-form.component.html
│   │   │   │   │   └── material-form.component.scss
│   │   │   │   └── materials.module.ts
│   │   │   │
│   │   │   └── admin/                   # --- YÖNETİCİ MODÜLÜ ---
│   │   │       ├── access-logs/         # Erişim kayıtları tablosu
│   │   │       │   ├── access-logs.component.ts
│   │   │       │   ├── access-logs.component.html
│   │   │       │   └── access-logs.component.scss
│   │   │       └── admin.module.ts
│   │   │
│   │   ├── shared/                      # Ortak, yeniden kullanılabilir UI
│   │   │   ├── components/
│   │   │   │   ├── file-upload/         # Sürükle-bırak dosya yükleme
│   │   │   │   ├── navbar/              # Rol bazlı üst menü
│   │   │   │   └── loader/              # Yükleniyor animasyonu
│   │   │   └── shared.module.ts
│   │   │
│   │   ├── app-routing.module.ts        # Lazy loading yönlendirmeleri
│   │   └── app.component.ts
│   │
│   ├── assets/
│   │   ├── images/                      # Logo ve ikonlar
│   │   └── styles/                      # _variables.scss, _mixins.scss
│   │
│   └── environments/
│       ├── environment.ts               # Geliştirme API URL
│       └── environment.prod.ts          # Canlı ortam API URL
│
├── angular.json
└── package.json
```

#### 🧭 Frontend mantığı

| Klasör | Amaç |
|--------|------|
| **core** | Guard, interceptor, HTTP servisleri, modeller — uygulama iskeleti (tek yükleme) |
| **features** | `auth` / `materials` / `admin` — her özellik kendi component’leriyle bağımsız yaşar |
| **shared** | `file-upload`, `navbar`, `loader` gibi ortak bileşenler |
| **environments** | Localhost vs production API adresi |

> 🔑 **Token yönetimi:** JWT, `jwt.interceptor.ts` ile HTTP isteklerine otomatik eklenir. Her serviste manuel `Authorization` header yazılmaz.  
> 🛡️ **Hata yönetimi:** `error.interceptor.ts` teknik detayları kullanıcıya sızdırmaz; anlaşılır mesaj gösterir.

---

<a id="docker-db"></a>
## 🐳 8. Veritabanı ve Docker Mantığı

### ✅ Ne Dockerize edilir? Ne edilmez?

| Bileşen | Docker? | Neden? |
|---------|---------|--------|
| 🟢 **PostgreSQL** | **Evet** (Docker Compose) | Tüm ekipte aynı DB sürümü, temiz kurulum, “benim makinemde çalışıyor” tartışmasını bitirir |
| 🔴 **ASP.NET Core API** | **Hayır** | Geliştirme sırasında lokal `dotnet run` ile çalışır |
| 🔴 **Angular Frontend** | **Hayır** | Geliştirme sırasında lokal `ng serve` ile çalışır |

### 🎯 Net politika

> **Uygulamalar (API + Frontend) lokal ortamda çalışır. Docker yalnızca yerel geliştirmede PostgreSQL için kullanılır.**

```text
┌─────────────────┐     ┌─────────────────┐
│  ng serve       │     │  dotnet run     │
│  (Frontend)     │────▶│  (API)          │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ PostgreSQL      │
                        │ (Docker Compose)│
                        └─────────────────┘
```

### 📄 Örnek `docker-compose.yml` (PostgreSQL)

> Host portu **5433** → container 5432. Mac’te Homebrew Postgres çoğu zaman 5432’yi kullandığı için bilinçli seçildi. Docker ile çalışırken connection string’de `Port=5433` kullan.

```yaml
services:
  postgres:
    image: postgres:16
    container_name: bayi-portal-db
    environment:
      POSTGRES_USER: bayi
      POSTGRES_PASSWORD: bayi123
      POSTGRES_DB: BayiPortalDb
    ports:
      - "5433:5432"
    volumes:
      - bayi_pgdata:/var/lib/postgresql/data

volumes:
  bayi_pgdata:
```

> 🔐 Üretim şifresi / connection string’leri asla commit etmeyin. Yerel geliştirme için örnek değerler README ve `appsettings.Development.json` seviyesinde tutulabilir.

> 💡 Docker şart değil: lokal Postgres ile de geliştirilebilir. Adımlar için [§1 Getting Started](#getting-started) → Yol 2.


---

<a id="veri-modeli-api"></a>
## 🗄️ 9. Veri Modeli ve REST API’ler

Aşağıdaki yapı yol göstericidir; ekip isimlendirmeleri değiştirebilir. İlişkisel model PostgreSQL üzerinde EF Core ile kurulur.

### 🗺️ ER özeti (ilişkiler)

```text
Users ──► Dealers ──◄ DealerBrands ►── Brands
                ▲                         ▲
                │                         │
         (DealerId?)              MaterialBrands
                                          │
Categories ◄── Materials ─────────────────┘
                   ▲
                   │
              AccessLogs ◄── Users
```

**Kritik iş ilişkisi:** Bir bayi kullanıcısının içerik görmesi için  
`DealerBrands(bayinin markaları) ∩ MaterialBrands(içeriğin markaları) ≠ ∅` olmalıdır.

### 🧩 Temel tablolar — detaylı açıklama

#### 👤 Kullanıcı ve bayi yönetimi

##### `Users` — sistem kullanıcıları

Portal’a giriş yapan her kişiyi tutar. Rol alanı yetkiyi belirler; bayi kullanıcıları bir `Dealer` kaydına bağlanır.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `Id` | int (PK) | Benzersiz kullanıcı kimliği |
| `Name` | varchar | Ad soyad |
| `Email` | varchar (unique) | Giriş için kullanılan e-posta |
| `PasswordHash` | varchar | Düz metin **değil**; irreversible hash |
| `Role` | varchar | `Admin` / `ContentManager` / `DealerUser` |
| `DealerId` | int? (FK → Dealers) | Bayi kullanıcısı için dolu; yönetici/içerik yöneticisinde **null** olabilir |
| `IsActive` | boolean | Hesap aktif mi? Pasifte giriş engellenir |

##### `Dealers` — bayiler

Bayi kurumlarını temsil eder. Marka yetkisi `DealerBrands` üzerinden yürür.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `Id` | int (PK) | Benzersiz bayi kimliği |
| `Name` | varchar | Bayinin resmi adı |
| `Code` | varchar | Kurum / cari kodu (kısa benzersiz kod) |
| `IsActive` | boolean | Bayi sistemde aktif mi? |

---

#### 🏷️ Marka yönetimi

##### `Brands` — markalar

İçerik hedeflemesi ve bayi yetkilendirmesinin ortak anahtarıdır.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `Id` | int (PK) | Benzersiz marka kimliği |
| `Name` | varchar | Markanın tam adı |
| `Code` | varchar | İç kod (örn. `MRK01`) |
| `IsActive` | boolean | Marka aktif mi? |

##### `DealerBrands` — bayi ↔ marka (çoktan çoğa)

Bir bayi birden fazla markaya hizmet edebilir; bir marka birden fazla bayide olabilir. **Bileşik PK:** (`DealerId`, `BrandId`).

| Alan | Tip | Açıklama |
|------|-----|----------|
| `DealerId` | int (PK, FK → Dealers) | Bayi |
| `BrandId` | int (PK, FK → Brands) | Marka |

> Bu tablo, bayi kullanıcısının “hangi markaların içeriklerini görebileceğini” belirler.

---

#### 📄 İçerik (doküman) yönetimi

##### `Categories` — içerik kategorileri

MVP seed örnekleri: **Pazarlama Materyalleri**, **Genel Duyuru**, **Eğitim Dokümanı**.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `Id` | int (PK) | Benzersiz kategori kimliği |
| `Name` | varchar | Kategori adı |
| `Description` | varchar | Kategorinin amacı / kapsamı |
| `IsActive` | boolean | Listelerde görünsün mü? |

##### `Materials` — içerikler / dokümanlar

Portal’ın merkez tablosu. Dosyanın **binary’si diskte**; bu tabloda **metadata** tutulur.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `Id` | int (PK) | Benzersiz içerik kimliği |
| `Title` | varchar | Listede görünen başlık |
| `Description` | varchar | Amaç ve kullanım açıklaması |
| `CategoryId` | int (FK → Categories) | Kategori bağlantısı |
| `FileName` | varchar | Kullanıcıya gösterilen **orijinal** dosya adı |
| `StoredFileName` | varchar | Sunucuda saklanan **benzersiz** ad (güvenlik) |
| `FilePath` | varchar | Yapılandırılabilir klasör yolu (istemciye DTO’da sızdırılmaz) |
| `MimeType` | varchar | örn. `application/pdf`, `image/png` |
| `FileSize` | int | Boyut (bayt) |
| `Status` | varchar | `Draft` / `Active` / `Archived` (hard delete yok) |
| `PublishedAt` | timestamp | Yayın zamanı |
| `ExpiresAt` | timestamp? | Opsiyonel görünürlük bitiş tarihi |
| `CreatedBy` | int (FK → Users) | Yükleyen / oluşturan kullanıcı |
| `CreatedAt` | timestamp | Oluşturma zamanı (UTC önerilir) |
| `UpdatedAt` | timestamp | Son güncelleme zamanı |

##### `MaterialBrands` — içerik ↔ marka (çoktan çoğa)

Bir doküman bir veya birden fazla markaya açılır. **Bileşik PK:** (`MaterialId`, `BrandId`).

| Alan | Tip | Açıklama |
|------|-----|----------|
| `MaterialId` | int (PK, FK → Materials) | İçerik |
| `BrandId` | int (PK, FK → Brands) | Hedef marka |

> İçerik yöneticisinin “hedefleme” adımı bu tabloya yazar.

---

#### 📊 Log (izleme) yönetimi

##### `AccessLogs` — görüntüleme / indirme kayıtları

Her detay görüntüleme (`VIEW`) ve indirme (`DOWNLOAD`) için denetim izi bırakır.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `Id` | int (PK) | Benzersiz log kimliği |
| `UserId` | int (FK → Users) | İşlemi yapan kullanıcı |
| `MaterialId` | int (FK → Materials) | Erişilen içerik |
| `Action` | varchar | `VIEW` veya `DOWNLOAD` |
| `ViewedAtUtc` | timestamp | İşlem zamanı (**UTC**) |
| `IpAddress` | varchar | `HttpContext` üzerinden alınan IP |
| `UserAgent` | varchar? | Tarayıcı / istemci bilgisi (tercihen) |

---

### 🔗 Foreign key ilişkileri (Ref)

```text
Users.DealerId            → Dealers.Id
DealerBrands.DealerId     → Dealers.Id
DealerBrands.BrandId      → Brands.Id
Materials.CategoryId      → Categories.Id
Materials.CreatedBy       → Users.Id
MaterialBrands.MaterialId → Materials.Id
MaterialBrands.BrandId    → Brands.Id
AccessLogs.UserId         → Users.Id
AccessLogs.MaterialId     → Materials.Id
```

| İlişki | Kardinalite | Anlamı |
|--------|-------------|--------|
| Dealer → Users | 1 : N | Bir bayinin birden fazla kullanıcısı olabilir |
| Dealer ↔ Brand | N : M (`DealerBrands`) | Bayinin hizmet verdiği markalar |
| Category → Materials | 1 : N | Bir kategoride birçok içerik |
| Material ↔ Brand | N : M (`MaterialBrands`) | İçeriğin paylaşıldığı markalar |
| User → Materials (`CreatedBy`) | 1 : N | Kim yükledi? |
| User / Material → AccessLogs | 1 : N | Kim, neye, ne zaman erişti? |

> 💡 İsimlendirme ekip kararına göre değişebilir; yukarıdaki alanların **anlamı** korunmalıdır (özellikle `StoredFileName`, soft-delete `Status`, VIEW/DOWNLOAD logları).

### 🌐 Örnek REST API uçları

| Metot ve uç | Amaç | Rol |
|-------------|------|-----|
| `POST /api/auth/login` | Giriş yap ve erişim tokenı üret | Tümü |
| `GET /api/materials` | Yetkiye göre içerikleri listele ve filtrele | Tümü |
| `GET /api/materials/{id}` | İçerik detayını getir ve **VIEW** kaydı oluştur | Yetkili kullanıcı |
| `GET /api/materials/{id}/download` | Dosyayı indir ve **DOWNLOAD** kaydı oluştur | Yetkili kullanıcı |
| `POST /api/materials` | Yeni içerik + dosya yükle (`multipart/form-data`) | Yönetici / İçerik Yöneticisi |
| `PUT /api/materials/{id}` | İçerik bilgilerini güncelle | Yönetici / İçerik Yöneticisi |
| `DELETE /api/materials/{id}` | Fiziksel silmek yerine **arşivle** | Yönetici / İçerik Yöneticisi |
| `GET /api/brands` \| `categories` \| `dealers` | Tanım listelerini getir | Yetkiye göre |
| `GET /api/access-logs` | Erişim kayıtlarını filtrele | Yönetici |

> 📘 Swagger/OpenAPI açık olmalı; temel uçlar buradan denenebilmelidir.

---

<a id="guvenlik"></a>
## 🔐 10. Kritik İş Kuralları ve Güvenlik

### 10.1 Marka eşleşme kuralı

Bir **bayi kullanıcısının** içeriği görmesi / indirmesi için:

> Kullanıcının bağlı olduğu bayinin markalarından **en az biri**, içeriğe atanmış markalarla **kesişmelidir**.

- ❌ Bu kontrol yalnızca Angular ekranında **yeterli değildir**
- ✅ **Her ilgili API isteğinde** backend’de uygulanmalıdır
- ✅ URL bilinse bile yetkisiz içerik **döndürülmez**; **401** (giriş yok) ve **403** (yetki yok) doğru kullanılır

```text
DealerBrands ∩ MaterialBrands  ≠  ∅   →  erişim var
DealerBrands ∩ MaterialBrands  =  ∅   →  403 Forbidden
```

> 📌 **Önemli:** API, kullanıcıya gösterilmeyen bir içeriği URL’si bilinse bile yanıt gövdesinde vermemelidir.

### 10.2 Soft delete (Arşiv)

- ❌ **Hard delete** (fiziksel satır silme) yapılmaz
- ✅ Kayıt `Status = Arşiv` (veya eşdeğeri) olarak işaretlenir
- ✅ Bayi listelerinde yalnızca **Aktif** (ve geçerli yayın dönemindeyse) içerikler görünür

### 10.3 Dosya yükleme yaklaşımı

Dosyanın kendisi sunucuda **yapılandırılabilir bir klasörde** saklanır; PostgreSQL’de ise yalnızca metadata tutulur:

| Alan (DB) | Anlamı |
|-----------|--------|
| `FileName` | Orijinal dosya adı (gösterim için) |
| `StoredFileName` | Sistemin ürettiği **benzersiz** saklama adı |
| `FilePath` | Sunucudaki göreli/yapılandırılmış yol |
| `MimeType` / uzantı | İçerik türü |
| `FileSize` | Boyut (bayt) |

| Güvenlik kuralı | Açıklama |
|-----------------|----------|
| 🆔 **Unique storage name** | Orijinal ad diskte klasör/yol olarak **kullanılmaz** |
| 🛡️ **Path Traversal** | `../` engellenir; benzersiz ad üretilir |
| ✅ **Doğrulama** | Uzantı, MIME türü ve maksimum boyut kontrol edilir |

### 10.4 Hata ve DTO politikası

| Kural | Beklenti |
|-------|----------|
| 🙈 Kullanıcıya teknik hata / stack trace / **sunucu dosya yolu gösterilmez** | |
| 📝 Hatalar backend’de **anlamlı log** tutulur | |
| 📦 Dışarıya veri çıkarken **mutlaka DTO** kullanılır | `PasswordHash`, internal `FilePath` vb. asla sızdırılmaz |
| ⏰ Zamanlar DB’de **UTC**; ekranda yerel saate çevrilir | |

### 10.5 Güvenlik ve kayıt kuralları

| Kural | Beklenti |
|-------|----------|
| 🔐 **Kimlik doğrulama** | ASP.NET Core Identity **veya** güvenli parola hash’leme + JWT; düz metin parola tutulmaz |
| 📎 **Dosya doğrulama** | Uzantı, MIME türü ve boyut kontrolü; benzersiz saklama adı; path traversal engeli |
| 🧾 **Erişim kaydı** | `UserId`, `MaterialId`, `VIEW` / `DOWNLOAD`, UTC zaman, IP; tercihen `User-Agent` |
| 🌐 **IP bilgisi** | `HttpContext` üzerinden alınır; reverse proxy varsa yalnızca güvenilen proxy ayarıyla **Forwarded Headers** kullanılır |
| ⏰ **Zaman** | Veritabanında UTC saklanır; ekranda yerel saate dönüştürülür |
| 🧯 **Hata yönetimi** | Kullanıcıya teknik detay / sunucu yolu gösterilmez; backend’de anlamlı log tutulur |

> Route Guard frontend’de UX içindir; **asıl yetki backend’dedir.**
---

<a id="plan-teslim"></a>
## 📅 11. Çalışma Planı, Teslimler ve Demo

Süreler öneridir; ekip büyüklüğüne ve staj süresine göre ayarlanabilir (**hedef: 4–6 hafta**).

### 🧭 Önerilen geliştirme sırası

| Aşama | Çıktı | Önerilen süre |
|-------|--------|---------------|
| **1. Analiz ve kurulum** | Ekran taslakları, repo yapısı, Angular / API / PostgreSQL ayağa kaldırma | 2–3 gün |
| **2. Kullanıcı ve tanımlar** | Login, roller, marka, bayi, kategori ve örnek seed veriler | 4–5 gün |
| **3. İçerik yönetimi** | CRUD, dosya yükleme, marka atama ve filtreleme | 5–7 gün |
| **4. Bayi erişimi ve logging** | Marka bazlı yetki, VIEW / DOWNLOAD kayıtları, log ekranı | 4–5 gün |
| **5. Test ve teslim** | Hata düzeltme, README, örnek kullanıcılar ve demo | 4–5 gün |

### 📦 Teslim edilecekler

1. ✅ Angular ve .NET kaynak kodları
2. ✅ PostgreSQL migration / seed dosyaları
3. ✅ README: ön koşullar, kurulum, çalıştırma ve **örnek kullanıcılar**
4. ✅ Kısa test senaryosu veya API test koleksiyonu (ör. Postman / Thunder Client)
5. ✅ **5–10 dakikalık** canlı demo

### 🎬 Demo senaryosu (tek uçtan uca akış)

1. 📝 İçerik yöneticisi **iki markaya** açık bir eğitim dokümanı yükler  
2. 🏪 İlgili bayi kullanıcısı içeriği **görür ve indirir**  
3. 🚫 Farklı markadaki bayi aynı içeriğe **erişemez**  
4. 👑 Yönetici erişim kaydında kullanıcı, doküman, zaman ve **IP** bilgisini görüntüler  

---

<a id="kabul-kriterleri"></a>
## ✅ 12. MVP Kabul Kriterleri

Minimum kabul için aşağıdakilerin tamamı sağlanmalıdır:

- [ ] Proje README’deki adımlarla temiz bir ortamda çalıştırılabiliyor
- [ ] Yönetici / içerik yöneticisi izin verilen türde dosya yükleyebiliyor
- [ ] İçerikte yükleyen kullanıcı, kategori, marka ve tarih bilgileri görülebiliyor
- [ ] Bayi kullanıcısı yalnızca bağlı olduğu markalara açılan **aktif** içerikleri görebiliyor
- [ ] Yetkisiz kullanıcı, doğrudan URL veya API isteğiyle başka içeriğe erişemiyor
- [ ] Detay görüntüleme ve indirme işlemlerinde kullanıcı, doküman, zaman ve IP kaydı oluşuyor
- [ ] Erişim kayıtları yönetici ekranında filtrelenebiliyor
- [ ] Hatalı dosya türü / boyutu ve eksik alanlar için anlaşılır mesaj gösteriliyor
- [ ] Veritabanı migration’ları ve örnek başlangıç (seed) verileri projede bulunuyor
- [ ] Swagger üzerinden temel API uçları denenebiliyor

---

<a id="katki"></a>
## 🤝 13. Katkı ve Çalışma Notları

### 🌿 Dal önerisi

| Dal | Amaç |
|-----|------|
| `main` | Stabil / demo’ya hazır |
| `develop` | Entegrasyon |
| `feature/*` | Kısa ömürlü özellik dalları |

### 🧭 Mimari hatırlatmalar

1. 🧠 İş kuralı → **Application**
2. 📦 Dışarıya çıkış → **DTO**
3. 🗑️ Silme → **Arşiv (soft delete)**
4. 📁 Dosya adı → **Unique storage name**
5. 🔐 Yetki → **Her API çağrısında backend**
6. 🐳 Docker → **Sadece PostgreSQL**

---

<a id="iletisim"></a>
## 📞 İletişim / Sahiplik

| Alan | Sorumluluk (örnek) |
|------|---------------------|
| Backend / API | Ekip içinde belirlenecek |
| Frontend / Angular | Ekip içinde belirlenecek |
| DB / Migration / Seed | Ekip içinde belirlenecek |

---

<div align="center">

**Bayi Doküman Yönetimi Portalı — MVP**  
*Basit • Okunabilir • Sürdürülebilir*

Made with ☕ by the internship team · 2026

</div>
