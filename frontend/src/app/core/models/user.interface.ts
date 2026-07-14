/** Kullanıcı tipi — API response ile uyumlu tutulmalı. */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'ContentManager' | 'DealerUser';
  dealerId?: number | null;
}
