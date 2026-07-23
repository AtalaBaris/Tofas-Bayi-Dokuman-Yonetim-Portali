/** Doküman erişim raporu — gerçek erişim log/hedef kitle verisiyle beslenir. */

export type AccessReportTab = 'viewed' | 'pending';

/**
 * README `AccessLogs.Action`: VIEW | DOWNLOAD.
 * Pending satırlar henüz log üretmemiş hedef kitle (kapsama UX'i).
 */
export type AccessAction = 'VIEW' | 'DOWNLOAD';

export interface AccessReportRow {
  id: number;
  /** Users.Name — README "kullanıcı"; tek alan (ad + soyad birleşik). */
  userName: string;
  initials: string;
  /** Dealers.Name — README "bayi". */
  dealerName: string;
  /** Materials.Title — README "doküman" (sayfa zaten dokümana sabit). */
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

export function buildMetrics(viewedCount: number, audienceCount: number): AccessReportMetrics {
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
