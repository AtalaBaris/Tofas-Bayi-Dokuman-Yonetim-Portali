/** Geliştirme ortamı — API Docker backend (8080).
 * Full stack: docker compose up -d → http://localhost:8081 (nginx /api proxy)
 * Lokal ng serve: http://localhost:4200 → bu apiUrl ile Docker API'ye bağlanır
 * 5037 / 7085 lokal `dotnet run` portlarıdır; Docker kullanırken bağlanmayın.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};
