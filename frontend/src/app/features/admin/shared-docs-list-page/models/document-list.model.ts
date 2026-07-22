/** Doküman listesi UI modelleri. */
export type DocumentStatus = 'active' | 'draft' | 'archived' | 'scheduled';
/** Liste sekmesi: tüm durumlar + All. */
export type DocumentStatusTab = DocumentStatus | 'all';
export type DocumentFileKind = 'pdf' | 'doc' | 'video';

export interface DocumentBrandTag {
  label: string;
  /** Badge arka plan rengi (#RRGGBB). */
  color: string;
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
  scheduledPublishAt?: string | null;
  recurrenceKind?: string;
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTrDate(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function fileKindFromMime(mimeType: string, fileName: string): DocumentFileKind {
  const mime = mimeType.toLowerCase();
  const name = fileName.toLowerCase();
  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return 'pdf';
  }
  if (mime.startsWith('video/') || name.endsWith('.mp4')) {
    return 'video';
  }
  return 'doc';
}

function mapStatus(status: string): DocumentStatus {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'draft';
    case 'archived':
      return 'archived';
    case 'scheduled':
      return 'scheduled';
    default:
      return 'active';
  }
}

/** Backend MaterialResponse → liste kartı. */
export function materialToDocumentListItem(material: {
  id: number;
  title: string;
  description: string;
  categoryName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  version?: number;
  publishedAt: string;
  expiresAt?: string | null;
  scheduledPublishAt?: string | null;
  recurrenceKind?: string;
  brandNames: string[];
  brands?: { badgeLabel: string; badgeColor: string; name: string }[];
  createdByName?: string;
  viewedCount?: number;
  audienceCount?: number;
}): DocumentListItem {
  const sizeLabel = formatBytes(material.fileSize);
  const scheduleIso = material.scheduledPublishAt ?? null;
  const dateLabel = formatTrDateTime(scheduleIso) !== '—'
    ? formatTrDateTime(scheduleIso)
    : formatTrDate(material.publishedAt);
  const brands: DocumentBrandTag[] =
    material.brands?.length
      ? material.brands.map((b) => ({
          label: b.badgeLabel || b.name,
          color: b.badgeColor || '#374151',
        }))
      : material.brandNames.map((label) => ({ label, color: '#374151' }));
  const version = material.version && material.version > 0 ? material.version : 1;
  return {
    id: material.id,
    title: material.title,
    dateLabel,
    category: material.categoryName,
    sizeLabel,
    brands,
    viewedCount: material.viewedCount ?? 0,
    audienceCount: material.audienceCount ?? 0,
    status: mapStatus(material.status),
    fileKind: fileKindFromMime(material.mimeType, material.fileName),
    description: material.description,
    uploader: material.createdByName?.trim() || '—',
    uploadedAt: formatTrDate(material.publishedAt),
    expiresAt: material.expiresAt ? material.expiresAt.slice(0, 10) : null,
    scheduledPublishAt: scheduleIso,
    recurrenceKind: material.recurrenceKind ?? 'None',
    fileSizeDetail: sizeLabel,
    version: `v${version}.0`,
    fileName: material.fileName,
  };
}

function formatTrDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
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

export interface DocumentViewerRow {
  id: number;
  name: string;
  dealer: string;
  whenLabel: string;
  initials?: string;
  avatarUrl?: string;
}


