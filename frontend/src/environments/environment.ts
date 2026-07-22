/** Geliştirme ortamı — API Docker backend (8080).
 * Full stack için: docker compose up -d → http://localhost:8081
 * Sadece Angular lokal: ng serve → yine Docker API'ye (8080) bağlanır.
 * Eski lokal API portu 5037 artık kullanılmıyor.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};
