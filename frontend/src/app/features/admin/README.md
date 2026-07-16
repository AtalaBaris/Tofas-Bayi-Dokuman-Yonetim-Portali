# admin/

Yönetici / içerik yöneticisi ekranları. Tüm URL'ler `/admin` altında.

```
admin/
├── admin.routes.ts          # /admin child route'ları
├── guards/                  # adminAuthGuard, adminRoleGuard
├── login/
│   ├── components/          # AdminLogin sayfası
│   ├── styles/              # login SCSS
│   └── animations/          # Angular animations
└── access-logs/             # Erişim kayıtları (private)
```

| URL | Erişim |
|-----|--------|
| `/admin` | → `/admin/login` |
| `/admin/login` | Public |
| `/admin/access-logs` | Private — Admin |
| `/admin/materials/new` | Private — Admin, ContentManager |
