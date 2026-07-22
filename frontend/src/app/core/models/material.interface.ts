/** İçerik (material) tipi — backend MaterialResponse DTO ile birebir eşleşir. */
export interface MaterialBrandBadge {
  id: number;
  name: string;
  badgeLabel: string;
  badgeColor: string;
}

export interface MaterialFile {
  id: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
}

export interface Material {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  /** İlk dosya (geriye dönük uyumluluk için korunuyor) — tüm dosyalar için bkz. `files`. */
  fileName: string;
  mimeType: string;
  fileSize: number;
  files: MaterialFile[];
  status: string;
  version: number;
  publishedAt: string;
  expiresAt?: string | null;
  scheduledPublishAt?: string | null;
  recurrenceKind?: string;
  recurrenceDayOfWeek?: number | null;
  recurrenceDayOfMonth?: number | null;
  scheduleTemplateId?: number | null;
  createdAt: string;
  updatedAt: string;
  brandIds: number[];
  brandNames: string[];
  brands: MaterialBrandBadge[];
  createdByName: string;
  /** İsteği atan kullanıcının bu materyale erişim durumu (DealerUser için anlamlı; Admin/ContentManager için hep "unread"). */
  myAccessStatus: 'unread' | 'viewed' | 'downloaded';
  /** Görüntüleyen benzersiz kullanıcı sayısı. */
  viewedCount: number;
  /** Hedef kitle: materyalin markalarıyla eşleşen bayilerdeki aktif kullanıcı sayısı. */
  audienceCount: number;
}

export interface MaterialScheduleItem {
  id: number;
  title: string;
  status: string;
  at: string;
  recurrenceKind: string;
  recurrenceDayOfWeek?: number | null;
  recurrenceDayOfMonth?: number | null;
  brandIds: number[];
}
