/** Yeni içerik ekleme formu modelleri (UI / mock). */
export type MaterialFormStatus = 'draft' | 'active' | 'archived';

export interface BrandOption {
  id: string;
  label: string;
}

export interface CategoryOption {
  value: string;
  label: string;
}

export interface SelectedFileInfo {
  name: string;
  sizeLabel: string;
  kind: 'pdf' | 'video' | 'image' | 'other';
}

export interface AddDocumentFormValue {
  title: string;
  description: string;
  category: string;
  brands: string[];
  publishedAt: string;
  expiresAt: string;
  status: MaterialFormStatus;
  file: SelectedFileInfo | null;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'kampanya', label: 'Kampanya Materyalleri' },
  { value: 'egitim', label: 'Eğitim Dokümanları' },
  { value: 'fiyat', label: 'Fiyat Listeleri' },
  { value: 'gorsel', label: 'Görsel Varlıklar' },
];

export const BRAND_OPTIONS: BrandOption[] = [
  { id: 'fiat', label: 'Fiat' },
  { id: 'jeep', label: 'Jeep' },
  { id: 'peugeot', label: 'Peugeot' },
  { id: 'opel', label: 'Opel' },
  { id: 'citroen', label: 'Citroen' },
];

export const STATUS_OPTIONS: { value: MaterialFormStatus; label: string }[] = [
  { value: 'draft', label: 'Taslak' },
  { value: 'active', label: 'Aktif' },
  { value: 'archived', label: 'Arşiv' },
];

export function emptyAddDocumentForm(): AddDocumentFormValue {
  return {
    title: '',
    description: '',
    category: '',
    brands: ['Fiat', 'Jeep'],
    publishedAt: '',
    expiresAt: '',
    status: 'active',
    file: null,
  };
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
