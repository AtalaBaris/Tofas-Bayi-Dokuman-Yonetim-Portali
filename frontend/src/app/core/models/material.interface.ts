/** İçerik (material) tipi — list/detail ekranlarında kullanılır. */
export interface Material {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  brandNames?: string[];
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  publishedAt: string;
  expiresAt?: string | null;
  createdByName?: string;
}
