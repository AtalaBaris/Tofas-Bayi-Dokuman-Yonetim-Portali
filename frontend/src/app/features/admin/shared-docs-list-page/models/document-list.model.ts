/** Doküman listesi mock / UI modelleri. */
import type { Material } from '../../../../core/models/material.interface';

export type DocumentStatus = 'active' | 'draft' | 'archived';
/** Liste sekmesi: tüm durumlar + All. */
export type DocumentStatusTab = DocumentStatus | 'all';
export type DocumentFileKind = 'pdf' | 'doc' | 'video';

export interface DocumentBrandTag {
  label: string;
  tone: 'fiat' | 'jeep' | 'all' | 'default';
}

export interface DocumentListItem {
  id: number;
  title: string;
  dateLabel: string;
  category: string;
  sizeLabel: string;
  brands: DocumentBrandTag[];
  /** Görüntüleyen benzersiz kişi sayısı. */
  viewedCount: number;
  /** Hedef kitle (yetkili bayi kullanıcısı) sayısı. */
  audienceCount: number;
  status: DocumentStatus;
  fileKind: DocumentFileKind;
  description: string;
  uploader: string;
  uploadedAt: string;
  /** ISO tarih (YYYY-MM-DD); yoksa sadece yükleme tarihi geçerli. */
  expiresAt?: string | null;
  fileSizeDetail: string;
  version: string;
  fileName: string;
}

/** Örn. "1000/1200 kişi gördü" */
export function viewCoverageLabel(viewed: number, audience: number): string {
  return `${viewed}/${audience} kişi gördü`;
}

/** Örn. "%83 görüldü" */
export function viewCoveragePercent(viewed: number, audience: number): number {
  if (audience <= 0) {
    return 0;
  }
  return Math.round((viewed / audience) * 100);
}

export function viewCoveragePercentLabel(viewed: number, audience: number): string {
  return `%${viewCoveragePercent(viewed, audience)} görüldü`;
}

/** Bitiş tarihine kalan gün; tarih yoksa null. */
export function daysUntilExpiry(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) {
    return null;
  }

  const end = new Date(`${expiresAt}T00:00:00`);
  if (Number.isNaN(end.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Liste kartı için "20 gün kaldı" metni. */
export function remainingDaysLabel(expiresAt: string | null | undefined): string | null {
  const days = daysUntilExpiry(expiresAt);
  if (days === null) {
    return null;
  }
  if (days > 1) {
    return `${days} gün kaldı`;
  }
  if (days === 1) {
    return '1 gün kaldı';
  }
  if (days === 0) {
    return 'Bugün son gün';
  }
  return 'Süresi doldu';
}

function fileKindFromMimeType(mimeType: string): DocumentFileKind {
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  return 'doc';
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso)
  );
}

function brandTone(name: string): DocumentBrandTag['tone'] {
  const lower = name.toLowerCase();
  if (lower.includes('fiat')) {
    return 'fiat';
  }
  if (lower.includes('jeep')) {
    return 'jeep';
  }
  return 'default';
}

/**
 * Backend MaterialResponse'unu admin doküman listesinin kullandığı karta çevirir.
 * viewedCount/audienceCount/version alanları henüz backend'de karşılığı olmadığından
 * (AccessLog'da MaterialId bağlantısı yok) 0/boş döner — satır ve drawer bu durumda
 * ilgili göstergeyi gizler.
 */
export function toAdminDocumentListItem(material: Material): DocumentListItem {
  return {
    id: material.id,
    title: material.title,
    dateLabel: formatDateLabel(material.publishedAt),
    category: material.categoryName,
    sizeLabel: formatFileSize(material.fileSize),
    brands: material.brandNames.map((name) => ({ label: name, tone: brandTone(name) })),
    viewedCount: 0,
    audienceCount: 0,
    status: material.status.toLowerCase() as DocumentStatus,
    fileKind: fileKindFromMimeType(material.mimeType),
    description: material.description,
    uploader: material.createdByName,
    uploadedAt: formatDateLabel(material.publishedAt),
    expiresAt: material.expiresAt ? material.expiresAt.slice(0, 10) : null,
    fileSizeDetail: formatFileSize(material.fileSize),
    version: '',
    fileName: material.fileName,
  };
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface DocumentViewerRow {
  id: number;
  name: string;
  dealer: string;
  whenLabel: string;
  initials?: string;
  avatarUrl?: string;
}

export const SEED_DOCUMENTS: DocumentListItem[] = [
  {
    id: 1,
    title: 'Haziran Pazarlama Kampanyası',
    dateLabel: '12 Haz 2023',
    category: 'Pazarlama',
    sizeLabel: '2.4 MB',
    brands: [
      { label: 'Fiat', tone: 'fiat' },
      { label: 'Jeep', tone: 'jeep' },
    ],
    viewedCount: 1000,
    audienceCount: 1200,
    status: 'active',
    fileKind: 'pdf',
    description:
      'Bu kampanya dokümanı, Haziran ayı boyunca geçerli olacak Fiat marka araçlar için özel finansman ve takas desteği detaylarını içermektedir. Bayi ağımızın tüm satış temsilcilerinin bu yönergeleri dikkatle incelemesi ve müşteri görüşmelerinde belirtilen kampanya kodlarını kullanması rica olunur.',
    uploader: 'Yönetici',
    uploadedAt: '12 Haz 2023',
    expiresAt: daysFromNow(20),
    fileSizeDetail: '15.4 MB',
    version: 'v1.2 (Son)',
    fileName: 'haziran_pazarlama_kampanyasi_v2.pdf',
  },
  {
    id: 2,
    title: 'Yeni Bayi Yönergeleri 3. Çeyrek',
    dateLabel: '05 Haz 2023',
    category: 'Kurumsal',
    sizeLabel: '1.1 MB',
    brands: [{ label: 'Tüm Markalar', tone: 'all' }],
    viewedCount: 890,
    audienceCount: 1200,
    status: 'active',
    fileKind: 'doc',
    description: 'Üçüncü çeyrek bayi operasyon yönergeleri ve süreç güncellemeleri.',
    uploader: 'İçerik Yöneticisi',
    uploadedAt: '05 Haz 2023',
    expiresAt: null,
    fileSizeDetail: '1.1 MB',
    version: 'v1.0',
    fileName: 'bayi_yonergeleri_q3.pdf',
  },
  {
    id: 3,
    title: '2024 Ürün Yol Haritası Sunumu',
    dateLabel: '28 May 2023',
    category: 'Strateji',
    sizeLabel: '45 MB',
    brands: [{ label: 'Jeep', tone: 'jeep' }],
    viewedCount: 340,
    audienceCount: 480,
    status: 'active',
    fileKind: 'video',
    description: '2024 ürün yol haritası sunumu ve bayi bilgilendirme videosu.',
    uploader: 'Yönetici',
    uploadedAt: '28 May 2023',
    expiresAt: daysFromNow(5),
    fileSizeDetail: '45 MB',
    version: 'v1.0',
    fileName: 'urun_yol_haritasi_2024.mp4',
  },
  {
    id: 4,
    title: 'Peugeot Servis Bülteni Taslağı',
    dateLabel: '20 May 2023',
    category: 'Teknik',
    sizeLabel: '800 KB',
    brands: [{ label: 'Peugeot', tone: 'default' }],
    viewedCount: 0,
    audienceCount: 220,
    status: 'draft',
    fileKind: 'pdf',
    description: 'Yayımlanmamış servis bülteni taslağı.',
    uploader: 'İçerik Yöneticisi',
    uploadedAt: '20 May 2023',
    expiresAt: null,
    fileSizeDetail: '800 KB',
    version: 'v0.3',
    fileName: 'peugeot_servis_bulteni_draft.pdf',
  },
  {
    id: 5,
    title: 'Eski Opel Kampanya Arşivi',
    dateLabel: '10 Oca 2023',
    category: 'Pazarlama',
    sizeLabel: '3.2 MB',
    brands: [{ label: 'Opel', tone: 'default' }],
    viewedCount: 120,
    audienceCount: 350,
    status: 'archived',
    fileKind: 'pdf',
    description: 'Süresi dolmuş Opel kampanya dokümanı.',
    uploader: 'Yönetici',
    uploadedAt: '10 Oca 2023',
    expiresAt: daysFromNow(-30),
    fileSizeDetail: '3.2 MB',
    version: 'v1.0',
    fileName: 'opel_kampanya_arsiv.pdf',
  },
];

/** Infinite scroll demosu — seed'lerden ~60 kayıt üretir. */
export const MOCK_DOCUMENTS: DocumentListItem[] = Array.from({ length: 60 }, (_, index) => {
  const seed = SEED_DOCUMENTS[index % SEED_DOCUMENTS.length];
  const id = index + 1;
  return {
    ...seed,
    id,
    title: index < SEED_DOCUMENTS.length ? seed.title : `${seed.title} (#${id})`,
    brands: seed.brands.map((b) => ({ ...b })),
  };
});

export const MOCK_VIEWERS: DocumentViewerRow[] = [
  {
    id: 1,
    name: 'Ahmet Yılmaz',
    dealer: 'Fiat Ankara',
    whenLabel: '2 saat önce',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9wLd3k12mslKGK4V6IfYp0nD85dUEKKaImF3BIrTy80_JLwqR_Ii3j6O1BtTN3R0NYetJQKxIw-LP2krIkGnk_D742AYh4RTttWVYJTZSXgje4Ev1EdpfChHaBEHtyJL1wTz0Sn8ntUS3Y8v0081LFm1pKurRzpJ-lWk_eYH1OvnxXYmv3ZVJJKsl1s036e3EyFnSayz__r7L5BFu7ro9ldFf6MA_R4vFOgQ2d27CN0Y9xOdrrjx8',
  },
  {
    id: 2,
    name: 'Ayşe Kaya',
    dealer: 'Metro Otomotiv',
    whenLabel: '5 saat önce',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ3h2BJ47vvkHhDgdarrHRZulP_7L9rJH4FDZNzA3yoyk72fApcXXnzu_ztCT-mWFPW9tYD2g4xKoGUFo2h8Dy4_33cSyHBD37XxVsWT6XPY-KHL39mnRfK_frSKpx864SjqNf5tAT_-MCJ4LC07MKu5RbpJQdm2enmfGsh9YG5UeVNsitL5snq81GBhKpF_se-zCZ7DkKf5pMRo4tCpC-L0S8LI1zRSOkZQuqiyZntDsy3lMWcJ2H',
  },
  {
    id: 3,
    name: 'Mehmet Demir',
    dealer: 'Pasifik Motors',
    whenLabel: '1 gün önce',
    initials: 'MD',
  },
];
