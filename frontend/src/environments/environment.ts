/** Geliştirme ortamı ayarları.
 * HTTP kullanıyoruz: tarayıcı ASP.NET dev sertifikasını reddettiğinde
 * (ERR_CERT_AUTHORITY_INVALID) login kırılmasın diye.
 * API'yi https profiliyle çalıştırın; aynı anda http://localhost:5037 de açılır.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5037/api',
};
