/** İçerik (material) tipi — backend MaterialResponse DTO ile birebir eşleşir. */
export interface MaterialBrandBadge {
  id: number;
  name: string;
  badgeLabel: string;
  badgeColor: string;
}

export interface Material {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: string;
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
  /** İsteği atan kullanıcının bu materyale erişim durumu (DealerUser için anlamlı; Admin/ContentManager için hep "unread"). */
  myAccessStatus: 'unread' | 'viewed' | 'downloaded';
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
