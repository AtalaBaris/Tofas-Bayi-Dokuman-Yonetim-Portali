/** Bayi portalı doküman kartı — gerçek Materials API'sinden (Material) türetilir. */
import type { Material } from '../../../../core/models/material.interface';

export type BayiDocFileKind = 'pdf' | 'video' | 'doc';

/** Kullanıcının bu dokümana erişim durumu (AccessLogs VIEW/DOWNLOAD özet, backend MaterialResponse.myAccessStatus). */
export type BayiDocAccessStatus = 'unread' | 'viewed' | 'downloaded';

export interface BayiDocumentCard {
  id: number;
  title: string;
  category: string;
  brands: string[];
  fileKind: BayiDocFileKind;
  dateLabel: string;
  /** Kaç gün önce eklendi — “bu hafta” hesabı için. */
  daysAgo: number;
  isNew?: boolean;
  expiresInDays?: number | null;
  /** Kullanıcının bu dokümana erişim özeti. */
  accessStatus: BayiDocAccessStatus;
  description?: string;
  fileName?: string;
  fileSize?: string;
  pageCount?: number | null;
  uploadedBy?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function fileKindFromMimeType(mimeType: string): BayiDocFileKind {
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

/** Backend MaterialResponse'unu bayi ekranlarının kullandığı kart modeline çevirir. */
export function toBayiDocumentCard(material: Material): BayiDocumentCard {
  const publishedAt = new Date(material.publishedAt);
  const daysAgo = Math.max(0, Math.floor((Date.now() - publishedAt.getTime()) / DAY_MS));

  let expiresInDays: number | null = null;
  if (material.expiresAt) {
    const diff = Math.ceil((new Date(material.expiresAt).getTime() - Date.now()) / DAY_MS);
    expiresInDays = diff > 0 ? diff : 0;
  }

  return {
    id: material.id,
    title: material.title,
    category: material.categoryName,
    brands: material.brandNames,
    fileKind: fileKindFromMimeType(material.mimeType),
    dateLabel: formatDateLabel(material.publishedAt),
    daysAgo,
    isNew: daysAgo < 7,
    expiresInDays,
    accessStatus: material.myAccessStatus,
    description: material.description,
    fileName: material.fileName,
    fileSize: formatFileSize(material.fileSize),
    uploadedBy: undefined,
  };
}

export interface BayiAccessStatusMeta {
  label: string;
  icon: string;
  tone: 'neutral' | 'info' | 'success';
}

export function accessStatusMeta(status: BayiDocAccessStatus): BayiAccessStatusMeta {
  switch (status) {
    case 'viewed':
      return { label: 'Görüntülendi', icon: 'visibility', tone: 'info' };
    case 'downloaded':
      return { label: 'İndirildi', icon: 'download_done', tone: 'success' };
    default:
      return { label: 'Henüz açılmadı', icon: 'mark_email_unread', tone: 'neutral' };
  }
}

export function fileKindLabel(kind: BayiDocFileKind): string {
  switch (kind) {
    case 'video':
      return 'Video';
    case 'doc':
      return 'Word';
    default:
      return 'PDF';
  }
}

export function cardVisualIcon(doc: BayiDocumentCard): string {
  if (doc.expiresInDays != null && doc.expiresInDays <= 7) {
    return 'warning';
  }
  if (doc.fileKind === 'video') {
    return 'play_circle';
  }
  if (doc.category === 'Pazarlama') {
    return 'campaign';
  }
  return fileKindIcon(doc.fileKind);
}

export function isUrgentDocument(doc: BayiDocumentCard): boolean {
  return doc.expiresInDays != null && doc.expiresInDays <= 7;
}

export function viewActionLabel(doc: BayiDocumentCard): string {
  return doc.fileKind === 'video' ? 'İzle' : 'Görüntüle';
}

export function fileKindIcon(kind: BayiDocFileKind): string {
  switch (kind) {
    case 'pdf':
      return 'picture_as_pdf';
    case 'video':
      return 'smart_display';
    default:
      return 'description';
  }
}
