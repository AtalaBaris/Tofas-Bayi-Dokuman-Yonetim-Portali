# bayi/

Bayi kullanıcısına (`DealerUser`) ait ekranlar.

```
bayi/
├── bayi.routes.ts
├── guards/bayi.guards.ts
├── login/                 # Public giriş (/login)
├── shell/                 # Üst bar + mobil bottom nav
├── home/                  # Ana sayfa dashboard
└── documents/             # Liste + detay (şimdilik mock)
```

| URL | Erişim |
|-----|--------|
| `/login` | Public — bayi girişi |
| `/bayi` | DealerUser — ana sayfa |
| `/bayi/documents` | DealerUser — doküman listesi |
| `/bayi/documents/:id` | DealerUser — doküman detayı |
