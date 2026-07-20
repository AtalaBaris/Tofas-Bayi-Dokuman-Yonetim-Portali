/** Blob indirme/önizleme yardımcıları — backend /materials/{id}/download hep "attachment" döndürdüğü için
 * doğrudan <a href> ile önizleme yapılamıyor; blob'u XHR ile çekip biz kararlaştırıyoruz. */

export function saveBlobAsFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function openBlobInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Yeni sekme URL'yi yükleyene kadar bekle, sonra serbest bırak.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
