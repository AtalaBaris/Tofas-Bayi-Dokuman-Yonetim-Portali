/** İçerik (material) tipi — backend MaterialResponse DTO ile birebir eşleşir. */
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
  version: number;
  publishedAt: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  brandIds: number[];
  brandNames: string[];
  createdByName: string;
  /** İsteği atan kullanıcının bu materyale erişim durumu (DealerUser için anlamlı; Admin/ContentManager için hep "unread"). */
  myAccessStatus: 'unread' | 'viewed' | 'downloaded';
  /** Görüntüleyen benzersiz kullanıcı sayısı. */
  viewedCount: number;
  /** Hedef kitle: materyalin markalarıyla eşleşen bayilerdeki aktif kullanıcı sayısı. */
  audienceCount: number;
}
