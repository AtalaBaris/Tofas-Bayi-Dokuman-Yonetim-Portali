/** Bayi bildirimleri — mock (API sonrası push/in-app bildirim servisinden gelir). */

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

export const BAYI_MOCK_NOTIFICATIONS: BayiNotification[] = [
  {
    id: 1,
    title: 'Yeni doküman',
    message: '2024 Q4 Kampanya Görselleri ve Kullanım Kılavuzu markanıza açıldı.',
    timeLabel: '2 saat önce',
    icon: 'description',
    isRead: false,
    kind: 'document',
    documentId: 1,
  },
  {
    id: 2,
    title: 'Süre uyarısı',
    message: 'Acil Servis Bülteni Güncellemesi 3 gün içinde sona erecek.',
    timeLabel: '5 saat önce',
    icon: 'schedule',
    isRead: false,
    kind: 'expiry',
    documentId: 4,
  },
  {
    id: 3,
    title: 'Yeni duyuru',
    message: 'Ekim Ayı Güncel Fiyat Listesi yayınlandı. İncelemenizi öneririz.',
    timeLabel: 'Dün',
    icon: 'campaign',
    isRead: false,
    kind: 'announcement',
    documentId: 3,
  },
  {
    id: 4,
    title: 'İndirme tamamlandı',
    message: '2024 Ürün Yol Haritası videosu başarıyla indirildi.',
    timeLabel: '2 gün önce',
    icon: 'download_done',
    isRead: true,
    kind: 'document',
    documentId: 2,
  },
];
