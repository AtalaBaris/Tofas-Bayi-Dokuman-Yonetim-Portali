# admin/

Yönetici / içerik yöneticisi ekranları. Tüm korumalı URL'ler `/admin` altında `AdminShell` layout'u (shared sidebar) ile açılır.

```
admin/
├── admin.routes.ts
├── guards/
├── login/                      # Public giriş
├── shared-docs-list-page/      # Doküman kütüphanesi
│   ├── components/
│   ├── styles/
│   ├── animations/
│   └── models/
├── add-document/               # Yeni içerik ekleme
│   ├── components/
│   ├── styles/
│   ├── animations/
│   └── models/
├── login-activity/             # Başarılı / başarısız giriş kayıtları
│   ├── components/
│   ├── styles/
│   └── models/
├── definition-management/      # Kullanıcı, bayi, marka ve kategori tanımları
│   ├── components/
│   ├── styles/
│   ├── animations/
│   └── models/
└── access-logs/                # Doküman VIEW/DOWNLOAD kayıtları (ayrı)
```

| URL | Erişim |
|-----|--------|
| `/admin` | → `/admin/login` |
| `/admin/login` | Public |
| `/admin/documents` | Private — Admin, ContentManager |
| `/admin/documents/new` | Private — Admin, ContentManager |
| `/admin/materials/new` | → `/admin/documents/new` |
| `/admin/definitions/users` | Private — Admin |
| `/admin/definitions/dealers` | Private — Admin |
| `/admin/definitions/brands` | Private — Admin |
| `/admin/definitions/categories` | Private — Admin |
| `/admin/login-activity` | Private — Admin, ContentManager |
| `/admin/access-logs` | Private — Admin |

Shared layout: `shared/components/admin-shell` + `admin-sidebar`
