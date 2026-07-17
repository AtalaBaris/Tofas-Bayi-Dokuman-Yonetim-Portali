export type DefinitionSection = 'users' | 'dealers' | 'brands' | 'categories';

export interface DefinitionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  dealer: string;
  active: boolean;
}

export interface SimpleDefinitionItem {
  id: number;
  name: string;
  detail: string;
  active: boolean;
}

export const DEFINITION_LABELS: Record<DefinitionSection, string> = {
  users: 'Kullanıcılar',
  dealers: 'Bayiler',
  brands: 'Markalar',
  categories: 'Kategoriler',
};

export const MOCK_USERS: DefinitionUser[] = [
  {
    id: 1,
    name: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@ornek.com',
    role: 'Sistem Yöneticisi',
    dealer: '—',
    active: true,
  },
  {
    id: 2,
    name: 'Ceren Demir',
    email: 'ceren.d@bayi1.com',
    role: 'Bayi Yöneticisi',
    dealer: 'Marmara Otomotiv',
    active: true,
  },
  {
    id: 3,
    name: 'Mehmet Kaya',
    email: 'm.kaya@bayi2.com',
    role: 'Satış Temsilcisi',
    dealer: 'Ege Motorlu Araçlar',
    active: false,
  },
  {
    id: 4,
    name: 'Zeynep Şahin',
    email: 'z.sahin@merkez.com',
    role: 'İçerik Yöneticisi',
    dealer: '—',
    active: true,
  },
];

export const SIMPLE_DEFINITIONS: Record<
  Exclude<DefinitionSection, 'users'>,
  SimpleDefinitionItem[]
> = {
  dealers: [
    { id: 1, name: 'Marmara Otomotiv', detail: 'İstanbul · Fiat, Jeep', active: true },
    { id: 2, name: 'Ege Motorlu Araçlar', detail: 'İzmir · Peugeot, Opel', active: true },
    { id: 3, name: 'İç Anadolu Distribütör', detail: 'Ankara · Citroen', active: false },
  ],
  brands: [
    { id: 1, name: 'Fiat', detail: '18 bağlı bayi', active: true },
    { id: 2, name: 'Jeep', detail: '12 bağlı bayi', active: true },
    { id: 3, name: 'Peugeot', detail: '15 bağlı bayi', active: true },
    { id: 4, name: 'Opel', detail: '14 bağlı bayi', active: true },
    { id: 5, name: 'Citroen', detail: '11 bağlı bayi', active: true },
  ],
  categories: [
    { id: 1, name: 'Pazarlama', detail: '24 doküman', active: true },
    { id: 2, name: 'Satış', detail: '17 doküman', active: true },
    { id: 3, name: 'Teknik', detail: '31 doküman', active: true },
    { id: 4, name: 'Kurumsal', detail: '9 doküman', active: true },
  ],
};

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
