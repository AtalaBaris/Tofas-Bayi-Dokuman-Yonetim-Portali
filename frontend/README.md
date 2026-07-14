# Frontend — Angular

Kurulum ve genel proje bilgisi için ana dizindeki [`README.md`](../README.md) dosyasına bak.

## Klasör mantığı

| Klasör | Ne işe yarar? |
|--------|----------------|
| `src/app/core` | Guard, interceptor, HTTP servisleri, modeller — uygulama iskeleti (1 kez) |
| `src/app/features` | Sayfalar: `auth`, `materials`, `admin` — her özellik kendi klasöründe |
| `src/app/shared` | Navbar, loader, file-upload gibi ortak UI parçaları |
| `src/environments` | API URL (dev / prod) |
| `src/assets` | Logo, global SCSS değişkenleri |

## Önemli dosyalar

| Dosya | Görev |
|-------|--------|
| `main.ts` | Angular’ı başlatır |
| `app.config.ts` | Router + HttpClient + interceptor kaydı |
| `app.routes.ts` | URL → hangi component / lazy load / guard |
| `app.ts` + `app.html` | Kök kabuk (`router-outlet`) |
| `core/interceptors/jwt.interceptor.ts` | Her istekte `Authorization: Bearer …` ekler |
| `core/guards/auth.guard.ts` | Giriş yoksa `/login`’e atar |
| `core/guards/role.guard.ts` | Role göre sayfa engeli (asıl güvenlik API’dedir) |

## Çalıştırma

```bash
cd frontend
npm install
ng serve
# http://localhost:4200
```

API adresi: `src/environments/environment.ts` → `apiUrl`.
