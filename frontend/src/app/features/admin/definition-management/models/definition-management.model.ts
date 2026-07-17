import type {
  BrandDto,
  CategoryDto,
  DealerDto,
  UserDto,
} from '../../../../core/models/definition.models';

export type DefinitionSection = 'users' | 'dealers' | 'brands' | 'categories';

export interface DefinitionUser {
  id: number;
  name: string;
  email: string;
  /** Backend role: Admin | ContentManager | DealerUser */
  role: string;
  roleLabel: string;
  dealerId: number | null;
  dealer: string;
  active: boolean;
}

export interface SimpleDefinitionItem {
  id: number;
  name: string;
  detail: string;
  active: boolean;
  code?: string;
  description?: string;
  brandIds?: number[];
}

export const DEFINITION_LABELS: Record<DefinitionSection, string> = {
  users: 'Kullanıcılar',
  dealers: 'Bayiler',
  brands: 'Markalar',
  categories: 'Kategoriler',
};

export const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Admin', label: 'Sistem Yöneticisi' },
  { value: 'ContentManager', label: 'İçerik Yöneticisi' },
  { value: 'DealerUser', label: 'Bayi Kullanıcısı' },
];

export function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((opt) => opt.value === role)?.label ?? role;
}

export function mapUser(dto: UserDto): DefinitionUser {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    roleLabel: roleLabel(dto.role),
    dealerId: dto.dealerId,
    dealer: dto.dealerName?.trim() || '—',
    active: dto.isActive,
  };
}

export function mapDealer(dto: DealerDto): SimpleDefinitionItem {
  const brands = dto.brandNames?.length ? dto.brandNames.join(', ') : 'Marka yok';
  return {
    id: dto.id,
    name: dto.name,
    detail: `${dto.code} · ${brands}`,
    active: dto.isActive,
    code: dto.code,
    brandIds: [...(dto.brandIds ?? [])],
  };
}

export function mapBrand(dto: BrandDto): SimpleDefinitionItem {
  return {
    id: dto.id,
    name: dto.name,
    detail: dto.code,
    active: dto.isActive,
    code: dto.code,
  };
}

export function mapCategory(dto: CategoryDto): SimpleDefinitionItem {
  return {
    id: dto.id,
    name: dto.name,
    detail: dto.description?.trim() || '—',
    active: dto.isActive,
    description: dto.description,
  };
}

export function isDefinitionSection(value: string | null): value is DefinitionSection {
  return value === 'users' || value === 'dealers' || value === 'brands' || value === 'categories';
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR'))
    .join('');
}
