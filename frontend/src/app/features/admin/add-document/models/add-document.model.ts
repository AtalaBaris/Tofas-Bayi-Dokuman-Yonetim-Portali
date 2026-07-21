/** Yeni içerik ekleme formu modelleri. */

export type MaterialFormStatus = 'draft' | 'active' | 'pool' | 'archived' | 'scheduled';
export type RecurrenceFormKind = 'None' | 'Weekly' | 'MonthlyDay';

export interface BrandOption {
  id: number;
  label: string;
}

export interface CategoryOption {
  value: string; // categoryId stringified
  label: string;
}

export interface SelectedFileInfo {
  name: string;
  sizeLabel: string;
  kind: 'pdf' | 'video' | 'image' | 'other';
  /** Yükleme için ham File (API FormData). */
  file: File;
  sizeBytes: number;
}

export const STATUS_OPTIONS: { value: MaterialFormStatus; label: string }[] = [
  { value: 'draft', label: 'Taslak' },
  { value: 'active', label: 'Aktif' },
  { value: 'pool', label: 'Havuza Ekle' },
  { value: 'scheduled', label: 'Zamanlanmış' },
  { value: 'archived', label: 'Arşiv' },
];

export const RECURRENCE_OPTIONS: { value: RecurrenceFormKind; label: string }[] = [
  { value: 'None', label: 'Tek seferlik' },
  { value: 'Weekly', label: 'Her hafta' },
  { value: 'MonthlyDay', label: 'Her ay' },
];

export const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 0, label: 'Pazar' },
];

/** README ile aynı izinler; backend de aynı listeyi doğrular. */
export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.pdf',
  '.docx',
  '.pptx',
  '.mp3',
  '.wav',
  '.mp4',
] as const;

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export function emptyBrandIds(): number[] {
  return [];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function detectFileKind(fileName: string): SelectedFileInfo['kind'] {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') {
    return 'pdf';
  }
  if (ext === 'mp4' || ext === 'webm' || ext === 'mov') {
    return 'video';
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    return 'image';
  }
  return 'other';
}

export function validateSelectedFile(file: File): string | null {
  if (file.size <= 0) {
    return 'Boş dosya yüklenemez.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Dosya boyutu en fazla 25 MB olabilir.';
  }
  const name = file.name.toLowerCase();
  const ok = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!ok) {
    return 'Bu dosya türü desteklenmiyor. İzin verilen türler: JPG, PNG, PDF, DOCX, PPTX, MP3, WAV, MP4.';
  }
  return null;
}

export function toApiStatus(status: MaterialFormStatus): 'Draft' | 'Active' | 'Scheduled' {
  if (status === 'draft') {
    return 'Draft';
  }
  if (status === 'pool') {
    return 'Draft';
  }
  if (status === 'scheduled') {
    return 'Scheduled';
  }
  return 'Active';
}

/** date input (YYYY-MM-DD) → ISO UTC gün sonu (backend ExpiresAt). */
export function expiresAtToIso(dateOnly: string): string | null {
  if (!dateOnly.trim()) {
    return null;
  }
  return `${dateOnly.trim()}T23:59:59.000Z`;
}

/** datetime-local (YYYY-MM-DDTHH:mm) → ISO UTC. */
export function scheduledAtToIso(localDateTime: string): string | null {
  if (!localDateTime.trim()) {
    return null;
  }
  const d = new Date(localDateTime);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

export function defaultScheduledLocal(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
