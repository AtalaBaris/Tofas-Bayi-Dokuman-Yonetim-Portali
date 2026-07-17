/** Giriş denemesi kayıtları (UI / mock). */
export type LoginAttemptStatus = 'success' | 'failure';
export type LoginPortal = 'admin' | 'bayi';

export interface LoginActivityItem {
  id: number;
  email: string;
  status: LoginAttemptStatus;
  ipAddress: string;
  userAgent: string;
  portal: LoginPortal;
  /** ISO UTC */
  occurredAt: string;
  /** Başarısız giriş nedeni (opsiyonel). */
  failureReason?: string | null;
}

export const MOCK_LOGIN_ACTIVITY: LoginActivityItem[] = [
  {
    id: 1,
    email: 'admin@bayiportal.local',
    status: 'success',
    ipAddress: '185.122.45.18',
    userAgent: 'Chrome · macOS',
    portal: 'admin',
    occurredAt: '2026-07-17T07:12:04Z',
  },
  {
    id: 2,
    email: 'admin@bayiportal.local',
    status: 'failure',
    ipAddress: '185.122.45.18',
    userAgent: 'Chrome · macOS',
    portal: 'admin',
    occurredAt: '2026-07-17T07:11:41Z',
    failureReason: 'Hatalı şifre',
  },
  {
    id: 3,
    email: 'admin@bayiportal.local',
    status: 'failure',
    ipAddress: '185.122.45.18',
    userAgent: 'Chrome · macOS',
    portal: 'admin',
    occurredAt: '2026-07-17T07:11:22Z',
    failureReason: 'Hatalı şifre',
  },
  {
    id: 4,
    email: 'admin@bayiportal.local',
    status: 'failure',
    ipAddress: '185.122.45.18',
    userAgent: 'Chrome · macOS',
    portal: 'admin',
    occurredAt: '2026-07-17T07:11:05Z',
    failureReason: 'Hatalı şifre',
  },
  {
    id: 5,
    email: 'admin@bayiportal.local',
    status: 'failure',
    ipAddress: '185.122.45.18',
    userAgent: 'Chrome · macOS',
    portal: 'admin',
    occurredAt: '2026-07-17T07:10:48Z',
    failureReason: 'Hatalı şifre',
  },
  {
    id: 6,
    email: 'admin@bayiportal.local',
    status: 'failure',
    ipAddress: '185.122.45.18',
    userAgent: 'Chrome · macOS',
    portal: 'admin',
    occurredAt: '2026-07-17T07:10:31Z',
    failureReason: 'Hatalı şifre',
  },
  {
    id: 7,
    email: 'editor@bayiportal.local',
    status: 'success',
    ipAddress: '78.190.12.44',
    userAgent: 'Safari · iOS',
    portal: 'admin',
    occurredAt: '2026-07-16T14:22:11Z',
  },
  {
    id: 8,
    email: 'bayi.a@bayiportal.local',
    status: 'success',
    ipAddress: '88.241.77.9',
    userAgent: 'Firefox · Windows',
    portal: 'bayi',
    occurredAt: '2026-07-16T09:05:33Z',
  },
  {
    id: 9,
    email: 'bayi.a@bayiportal.local',
    status: 'failure',
    ipAddress: '88.241.77.9',
    userAgent: 'Firefox · Windows',
    portal: 'bayi',
    occurredAt: '2026-07-16T09:05:02Z',
    failureReason: 'Hatalı şifre',
  },
  {
    id: 10,
    email: 'unknown@example.com',
    status: 'failure',
    ipAddress: '203.0.113.42',
    userAgent: 'Unknown',
    portal: 'admin',
    occurredAt: '2026-07-15T21:44:18Z',
    failureReason: 'Kullanıcı bulunamadı',
  },
];

export function formatLoginDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
