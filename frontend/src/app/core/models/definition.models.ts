/** Tanım yönetimi API DTO'ları (backend camelCase). */

export type ApiRole = 'Admin' | 'ContentManager' | 'DealerUser';

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: string;
  dealerId: number | null;
  dealerName: string | null;
  isActive: boolean;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: string;
  dealerId?: number | null;
}

export interface UpdateUserDto {
  name: string;
  role: string;
  dealerId?: number | null;
  isActive: boolean;
}

export interface DealerDto {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  brandIds: number[];
  brandNames: string[];
  /** Aktif DealerUser sayısı — 0 ise bayi kullanıcıssız. */
  activeUserCount: number;
}

export interface CreateDealerDto {
  name: string;
  code: string;
  brandIds: number[];
  /** Bayi create sırasında zorunlu ilk DealerUser. */
  initialUser: {
    name: string;
    email: string;
    password: string;
  };
}

export interface UpdateDealerDto {
  name: string;
  code: string;
  isActive: boolean;
  brandIds: number[];
}

export interface BrandDto {
  id: number;
  name: string;
  code: string;
  badgeLabel: string;
  badgeColor: string;
  isActive: boolean;
}

export interface CreateBrandDto {
  name: string;
  code: string;
  badgeLabel?: string;
  badgeColor?: string;
}

export interface UpdateBrandDto {
  name: string;
  code: string;
  badgeLabel?: string;
  badgeColor?: string;
  isActive: boolean;
}

export interface CategoryDto {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CreateCategoryDto {
  name: string;
  description: string;
}

export interface UpdateCategoryDto {
  name: string;
  description: string;
  isActive: boolean;
}
