/** Bayi bildirimleri — API /api/notifications. */

export type BayiNotificationKind = 'document' | 'expiry' | 'announcement';

export interface BayiNotification {
  id: number;
  title: string;
  message: string;
  timeLabel: string;
  icon: string;
  isRead: boolean;
  kind: BayiNotificationKind;
  documentId?: number;
}

export function mapNotificationDto(dto: {
  id: number;
  kind: string;
  title: string;
  body: string;
  materialId?: number | null;
  isRead: boolean;
  createdAt: string;
}): BayiNotification {
  const kind = normalizeKind(dto.kind);
  return {
    id: dto.id,
    title: dto.title,
    message: dto.body,
    timeLabel: relativeTimeLabel(dto.createdAt),
    icon: iconForKind(kind),
    isRead: dto.isRead,
    kind,
    documentId: dto.materialId ?? undefined,
  };
}

function normalizeKind(kind: string): BayiNotificationKind {
  const k = kind.toLowerCase();
  if (k === 'expiry') {
    return 'expiry';
  }
  if (k === 'announcement') {
    return 'announcement';
  }
  return 'document';
}

function iconForKind(kind: BayiNotificationKind): string {
  switch (kind) {
    case 'expiry':
      return 'schedule';
    case 'announcement':
      return 'campaign';
    default:
      return 'description';
  }
}

function relativeTimeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) {
    return 'Az önce';
  }
  if (mins < 60) {
    return `${mins} dk önce`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours} saat önce`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return 'Dün';
  }
  if (days < 7) {
    return `${days} gün önce`;
  }
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
  }).format(d);
}
