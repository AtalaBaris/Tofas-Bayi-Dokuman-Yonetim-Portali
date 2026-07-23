/** Kullanıcı tipi — API response ile uyumlu tutulmalı. */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'ContentManager' | 'DealerUser';
  dealerId?: number | null;
  dealerName?: string | null;
  dealerCity?: string | null;
  dealerPhone?: string | null;
  dealerContactInfo?: string | null;
  phone?: string | null;
  isActive?: boolean;
  emailNotifications?: boolean;
  documentAlerts?: boolean;
  expiryReminders?: boolean;
}
