/** Doküman erişim raporu — UI mock (README AccessLogs / FR-09 / FR-12 ile hizalı). */

export type AccessReportTab = 'viewed' | 'pending';

/**
 * README `AccessLogs.Action`: VIEW | DOWNLOAD.
 * Pending satırlar henüz log üretmemiş hedef kitle (kapsama UX’i).
 */
export type AccessAction = 'VIEW' | 'DOWNLOAD';

export interface AccessReportRow {
  id: number;
  /** Users.Name — README “kullanıcı”; tek alan (ad + soyad birleşik). */
  userName: string;
  initials: string;
  /** Dealers.Name — README “bayi”. */
  dealerName: string;
  /** Materials.Title — README “doküman” (sayfa zaten dokümana sabit). */
  documentTitle: string;
  /** VIEW | DOWNLOAD; bekleyenlerde null. */
  action: AccessAction | null;
  /** ViewedAtUtc → yerel tarih (gg aaa yyyy). */
  date: string | null;
  /** ViewedAtUtc → yerel saat (ss:dd). */
  time: string | null;
  /** HttpContext IP. */
  ipAddress: string | null;
  /** Tercihen User-Agent (NFR-04). */
  userAgent: string | null;
}

export interface AccessReportMetrics {
  audienceCount: number;
  viewedCount: number;
  pendingCount: number;
  engagementPercent: number;
}

export interface AccessActionMeta {
  code: string;
  label: string;
  icon: string;
  tone: 'success' | 'info' | 'muted';
}

export function accessActionMeta(action: AccessAction | null): AccessActionMeta {
  switch (action) {
    case 'DOWNLOAD':
      return { code: 'DOWNLOAD', label: 'İndirme', icon: 'download', tone: 'info' };
    case 'VIEW':
      return { code: 'VIEW', label: 'Görüntüleme', icon: 'visibility', tone: 'success' };
    default:
      return {
        code: '—',
        label: 'Henüz erişim yok',
        icon: 'visibility_off',
        tone: 'muted',
      };
  }
}

/** Erişim kayıtları (VIEW/DOWNLOAD) — aynı bayiden birden fazla kullanıcı. */
const VIEWED_SEED: Omit<AccessReportRow, 'id' | 'documentTitle'>[] = [
  {
    dealerName: 'Fiat Ankara',
    userName: 'Ahmet Yılmaz',
    initials: 'AY',
    action: 'DOWNLOAD',
    date: '14 Haz 2023',
    time: '10:45',
    ipAddress: '85.105.12.41',
    userAgent: 'Chrome / macOS',
  },
  {
    dealerName: 'Fiat Ankara',
    userName: 'Selin Yılmaz',
    initials: 'SY',
    action: 'VIEW',
    date: '14 Haz 2023',
    time: '11:02',
    ipAddress: '85.105.12.41',
    userAgent: 'Safari / iOS',
  },
  {
    dealerName: 'Renault İstanbul Merkez',
    userName: 'Mehmet Kaya',
    initials: 'MK',
    action: 'DOWNLOAD',
    date: '14 Haz 2023',
    time: '11:15',
    ipAddress: '176.33.90.12',
    userAgent: 'Chrome / Windows',
  },
  {
    dealerName: 'Renault İstanbul Merkez',
    userName: 'Cemre Kaya',
    initials: 'CK',
    action: 'VIEW',
    date: '14 Haz 2023',
    time: '12:40',
    ipAddress: '176.33.90.18',
    userAgent: 'Edge / Windows',
  },
  {
    dealerName: 'Ford İzmir Showroom',
    userName: 'Ayşe Demir',
    initials: 'AD',
    action: 'VIEW',
    date: '14 Haz 2023',
    time: '13:20',
    ipAddress: '78.186.44.9',
    userAgent: 'Firefox / Linux',
  },
  {
    dealerName: 'Jeep Bursa',
    userName: 'Zeynep Aksoy',
    initials: 'ZA',
    action: 'DOWNLOAD',
    date: '15 Haz 2023',
    time: '09:05',
    ipAddress: '95.70.21.55',
    userAgent: 'Chrome / Android',
  },
  {
    dealerName: 'Jeep Bursa',
    userName: 'Onur Aksoy',
    initials: 'OA',
    action: 'VIEW',
    date: '15 Haz 2023',
    time: '09:18',
    ipAddress: '95.70.21.55',
    userAgent: 'Chrome / Android',
  },
  {
    dealerName: 'Peugeot Antalya',
    userName: 'Can Öztürk',
    initials: 'CÖ',
    action: 'VIEW',
    date: '15 Haz 2023',
    time: '14:40',
    ipAddress: '212.175.10.3',
    userAgent: 'Safari / macOS',
  },
  {
    dealerName: 'Opel Adana',
    userName: 'Elif Şahin',
    initials: 'EŞ',
    action: 'DOWNLOAD',
    date: '16 Haz 2023',
    time: '08:30',
    ipAddress: '88.255.100.7',
    userAgent: 'Chrome / Windows',
  },
  {
    dealerName: 'Metro Otomotiv',
    userName: 'Burak Yıldız',
    initials: 'BY',
    action: 'VIEW',
    date: '16 Haz 2023',
    time: '16:10',
    ipAddress: '46.1.88.200',
    userAgent: 'Chrome / macOS',
  },
  {
    dealerName: 'Pasifik Motors',
    userName: 'Selin Arslan',
    initials: 'SA',
    action: 'DOWNLOAD',
    date: '17 Haz 2023',
    time: '11:55',
    ipAddress: '31.223.40.16',
    userAgent: 'Chrome / Windows',
  },
  {
    dealerName: 'Pasifik Motors',
    userName: 'Kerem Arslan',
    initials: 'KA',
    action: 'VIEW',
    date: '17 Haz 2023',
    time: '15:20',
    ipAddress: '31.223.40.22',
    userAgent: 'Firefox / Windows',
  },
];

const PENDING_SEED: Omit<AccessReportRow, 'id' | 'documentTitle'>[] = [
  {
    dealerName: 'Fiat Konya',
    userName: 'Hasan Çelik',
    initials: 'HÇ',
    action: null,
    date: null,
    time: null,
    ipAddress: null,
    userAgent: null,
  },
  {
    dealerName: 'Fiat Konya',
    userName: 'Nazlı Çelik',
    initials: 'NÇ',
    action: null,
    date: null,
    time: null,
    ipAddress: null,
    userAgent: null,
  },
  {
    dealerName: 'Jeep Trabzon',
    userName: 'Merve Aydın',
    initials: 'MA',
    action: null,
    date: null,
    time: null,
    ipAddress: null,
    userAgent: null,
  },
  {
    dealerName: 'Peugeot Samsun',
    userName: 'Emre Koç',
    initials: 'EK',
    action: null,
    date: null,
    time: null,
    ipAddress: null,
    userAgent: null,
  },
  {
    dealerName: 'Peugeot Samsun',
    userName: 'İpek Koç',
    initials: 'İK',
    action: null,
    date: null,
    time: null,
    ipAddress: null,
    userAgent: null,
  },
  {
    dealerName: 'Opel Eskişehir',
    userName: 'Deniz Kara',
    initials: 'DK',
    action: null,
    date: null,
    time: null,
    ipAddress: null,
    userAgent: null,
  },
  {
    dealerName: 'Ford Gaziantep',
    userName: 'Gül Yavuz',
    initials: 'GY',
    action: null,
    date: null,
    time: null,
    ipAddress: null,
    userAgent: null,
  },
];

export function buildMockAccessRows(
  documentId: number,
  documentTitle: string,
  tab: AccessReportTab,
  count: number
): AccessReportRow[] {
  const seed = tab === 'viewed' ? VIEWED_SEED : PENDING_SEED;
  const n = Math.max(0, count);
  return Array.from({ length: n }, (_, index) => {
    const base = seed[index % seed.length];
    return {
      id: documentId * 1000 + (tab === 'viewed' ? 0 : 500) + index + 1,
      documentTitle,
      dealerName: base.dealerName,
      userName: base.userName,
      initials: base.initials,
      action: base.action,
      date: base.date,
      time: base.time,
      ipAddress: base.ipAddress,
      userAgent: base.userAgent,
    };
  });
}

export function buildMockMetrics(viewedCount: number, audienceCount: number): AccessReportMetrics {
  const audience = Math.max(0, audienceCount);
  const viewed = Math.min(Math.max(0, viewedCount), audience || viewedCount);
  const pending = Math.max(0, audience - viewed);
  const engagementPercent = audience > 0 ? Math.round((viewed / audience) * 100) : 0;
  return {
    audienceCount: audience,
    viewedCount: viewed,
    pendingCount: pending,
    engagementPercent,
  };
}
