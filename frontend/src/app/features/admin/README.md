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
└── access-logs/
```

| URL | Erişim |
|-----|--------|
| `/admin` | → `/admin/login` |
| `/admin/login` | Public |
| `/admin/documents` | Private — Admin, ContentManager |
| `/admin/access-logs` | Private — Admin |
| `/admin/materials/new` | Private — Admin, ContentManager |

Shared layout: `shared/components/admin-shell` + `admin-sidebar`
