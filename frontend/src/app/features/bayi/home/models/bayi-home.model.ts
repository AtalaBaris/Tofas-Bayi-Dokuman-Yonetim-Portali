/** Bayi portalı mock dokümanları (API bağlanana kadar). */

export type BayiDocFileKind = 'pdf' | 'video' | 'doc';

/** Kullanıcının bu dokümana erişim durumu (AccessLogs VIEW/DOWNLOAD özet). */
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
  /** Detay sayfası — API sonrası Materials DTO’dan gelir. */
  description?: string;
  fileName?: string;
  fileSize?: string;
  pageCount?: number | null;
  uploadedBy?: string;
}

export const BAYI_MOCK_DOCUMENTS: BayiDocumentCard[] = [
  {
    id: 1,
    title: '2024 Q4 Kampanya Görselleri ve Kullanım Kılavuzu',
    category: 'Pazarlama',
    brands: ['Fiat'],
    fileKind: 'pdf',
    dateLabel: '24 Eki 2024',
    daysAgo: 1,
    isNew: true,
    accessStatus: 'viewed',
    fileSize: '3.1 MB',
  },
  {
    id: 2,
    title: '2024 Ürün Yol Haritası - Video Anlatım',
    category: 'Eğitim',
    brands: ['Jeep'],
    fileKind: 'video',
    dateLabel: '22 Eki 2024',
    daysAgo: 3,
    isNew: true,
    accessStatus: 'downloaded',
    fileSize: '45 MB',
  },
  {
    id: 3,
    title: 'Ekim Ayı Güncel Fiyat Listesi ve Opsiyonlar',
    category: 'Genel Duyuru',
    brands: ['Fiat', 'Jeep'],
    fileKind: 'pdf',
    dateLabel: '20 Eki 2024',
    daysAgo: 5,
    isNew: true,
    accessStatus: 'unread',
    fileSize: '1.8 MB',
  },
  {
    id: 4,
    title: 'Acil Servis Bülteni Güncellemesi',
    category: 'Eğitim',
    brands: ['Fiat'],
    fileKind: 'pdf',
    dateLabel: '18 Eki 2024',
    daysAgo: 7,
    expiresInDays: 3,
    accessStatus: 'unread',
    fileSize: '890 KB',
  },
  {
    id: 5,
    title: 'Haziran Pazarlama Kampanyası',
    category: 'Pazarlama',
    brands: ['Fiat', 'Jeep'],
    fileKind: 'pdf',
    dateLabel: '12 Haz 2024',
    daysAgo: 40,
    accessStatus: 'viewed',
    fileName: 'haziran_kampanya.pdf',
    fileSize: '2.4 MB',
    pageCount: 24,
    uploadedBy: 'Merkez Admin',
    description:
      'Bu doküman, Haziran ayı boyunca Türkiye genelindeki tüm yetkili satıcılarımızda uygulanacak olan entegre pazarlama kampanyasının detaylarını, görsel materyallerini ve dijital iletişim stratejilerini içermektedir. Kampanya, özellikle Fiat ve Jeep markalarının öne çıkan modellerinde (Egea Cross, Renegade) uygulanacak özel finansman seçeneklerini desteklemek üzere kurgulanmıştır.\n\nDoküman içerisinde showroom içi POP malzemelerinin yerleşim planları, sosyal medya paylaşım takvimi, radyo spot metinleri ve yerel basın ilan şablonları bulunmaktadır. Lütfen kampanya başlangıç tarihinden en az 3 gün önce tüm materyallerin showroom\'larınızda hazır olduğundan emin olunuz.',
  },
  {
    id: 6,
    title: 'Yeni Bayi Yönergeleri 3. Çeyrek',
    category: 'Genel Duyuru',
    brands: ['Jeep'],
    fileKind: 'doc',
    dateLabel: '05 Haz 2024',
    daysAgo: 50,
    accessStatus: 'downloaded',
    fileSize: '1.1 MB',
  },
];

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

/** Seed dealerId → gösterim adı (login henüz DealerName dönmüyor). */
export function dealerDisplayName(dealerId: number | null | undefined): string {
  if (dealerId === 1) {
    return 'Bayi A';
  }
  if (dealerId === 2) {
    return 'Bayi B';
  }
  return 'Bayiniz';
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
