# ER Diyagramı

`backend/src/BayiPortal.Core/Entities/*.cs` içindeki gerçek entity/ilişki tanımlarından
çıkarıldı (2026-07-22, `MaterialFile` eklendi). `README.md`'deki kavramsal veri modeliyle
küçük farklar olabilir — buradaki diyagram kod ile birebir eşleşir.

![ER Diyagramı](er-diagram.png)

Aşağıdaki Mermaid kaynağından üretildi (`@mermaid-js/mermaid-cli` ile PNG'ye render
edildi). Diyagramı güncellemek için bu kod bloğunu düzenleyip yeniden render edin.

```mermaid
erDiagram
    DEALER ||--o{ USER : "employs"
    DEALER ||--o{ DEALER_BRAND : "has access to"
    BRAND ||--o{ DEALER_BRAND : "granted to"
    BRAND ||--o{ MATERIAL_BRAND : "targets"
    CATEGORY ||--o{ MATERIAL : "classifies"
    USER ||--o{ MATERIAL : "creates"
    MATERIAL ||--o{ MATERIAL_BRAND : "shared with"
    MATERIAL ||--o{ MATERIAL_FILE : "has"
    USER ||--o{ ACCESS_LOG : "performs"
    MATERIAL ||--o{ ACCESS_LOG : "target of"
    MATERIAL_FILE ||--o{ ACCESS_LOG : "target of"

    DEALER {
        int Id PK
        string Name
        string Code
        bool IsActive
    }

    BRAND {
        int Id PK
        string Name
        string Code
        bool IsActive
    }

    DEALER_BRAND {
        int DealerId PK,FK
        int BrandId PK,FK
    }

    CATEGORY {
        int Id PK
        string Name
        string Description
        bool IsActive
    }

    USER {
        int Id PK
        string Name
        string Email
        string PasswordHash
        string Role
        int DealerId FK "nullable"
        bool IsActive
        string Phone "nullable"
    }

    MATERIAL {
        int Id PK
        string Title
        string Description
        int CategoryId FK
        string FileName
        string StoredFileName
        string FilePath
        string MimeType
        long FileSize
        string Status
        int Version
        datetime PublishedAt
        datetime ExpiresAt "nullable"
        int CreatedBy FK
        datetime CreatedAt
        datetime UpdatedAt
    }

    MATERIAL_BRAND {
        int MaterialId PK,FK
        int BrandId PK,FK
    }

    MATERIAL_FILE {
        int Id PK
        int MaterialId FK
        string FileName
        string StoredFileName
        string FilePath
        string MimeType
        long FileSize
        int SortOrder
        datetime CreatedAt
    }

    ACCESS_LOG {
        int Id PK
        int UserId FK "nullable"
        string UserName "nullable"
        int MaterialId FK "nullable"
        int MaterialFileId FK "nullable"
        string Action
        string Description
        string LoginStatus "nullable"
        datetime ViewedAtUtc
        string IpAddress
        string UserAgent "nullable"
    }
```

## Notlar

- `DEALER_BRAND` ve `MATERIAL_BRAND`, composite PK'lı (`DealerId+BrandId`,
  `MaterialId+BrandId`) çoktan-çoğa köprü tablolar — bayi/marka ve materyal/marka
  eşleşme kuralının (`DealerBrands ∩ MaterialBrands ≠ ∅`) veritabanı karşılığı.
- `AccessLog.UserId` / `AccessLog.MaterialId` **nullable FK** — PR #9
  (`feature-backend-bayiGirisLog`) ile sistem geneli loglama için ilişkiler
  opsiyonel hale getirildi (örn. materyali olmayan başarısız giriş denemesi).
- `User.Role` (`string`) ve `Material.Status` (enum-backed `string` kolon) ayrı bir
  lookup tablosuna FK değil — `TODO.md`'deki "hâlâ string kullanıyor" notuyla
  tutarlı.
- `Material.Version`, `AddVersionToMaterials` migration'ı ile eklendi; her
  `UpdateAsync`'te `+1` artırılır (bkz. `feature-backend-dokuman-goruntulenme-sayaci`,
  PR #17).
- `User.Phone` (nullable), `AddPhoneToUsers` migration'ı ile eklendi.
- `MATERIAL_FILE`, `AddMaterialFiles` migration'ı ile eklendi (bir materyal artık birden
  fazla dosyaya sahip olabilir). `MATERIAL`'in eski tekil dosya kolonları
  (`FileName`/`StoredFileName`/`FilePath`/`MimeType`/`FileSize`) geriye dönük uyumluluk
  için kasıtlı olarak korundu ve migration'daki backfill ile mevcut materyallerin dosyası
  birer `MATERIAL_FILE` satırına kopyalandı — "ilk dosya" özeti olarak dolu kalmaya devam
  ediyorlar, kaynak artık `MATERIAL_FILE`.
- `ACCESS_LOG.MaterialFileId` (nullable FK, `SetNull`), aynı migration'la eklendi; hangi
  dosyanın görüntülendiğini/indirildiğini materyal-geneli değil dosya bazında izlemeyi
  sağlar. Geçmiş loglarda bu alan `NULL` kalır (geriye dönük eşleme yapılmadı).
