/** Bayi profil ek alanları — telefon vb. (API sonrası Users DTO genişler). */
import { BAYI_PROFILE_EXTRA_KEY } from '../../../../core/auth-storage';

export interface BayiProfileExtra {
  phone: string;
}

const DEFAULT_EXTRA: BayiProfileExtra = {
  phone: '',
};

export function readBayiProfileExtra(): BayiProfileExtra {
  const raw =
    localStorage.getItem(BAYI_PROFILE_EXTRA_KEY) ??
    sessionStorage.getItem(BAYI_PROFILE_EXTRA_KEY);
  if (!raw) {
    return { ...DEFAULT_EXTRA };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BayiProfileExtra>;
    return { ...DEFAULT_EXTRA, ...parsed };
  } catch {
    return { ...DEFAULT_EXTRA };
  }
}

export function writeBayiProfileExtra(extra: BayiProfileExtra): void {
  const payload = JSON.stringify(extra);
  if (localStorage.getItem(BAYI_PROFILE_EXTRA_KEY) || localStorage.getItem('bayi_portal_user')) {
    localStorage.setItem(BAYI_PROFILE_EXTRA_KEY, payload);
  }
  if (sessionStorage.getItem(BAYI_PROFILE_EXTRA_KEY) || sessionStorage.getItem('bayi_portal_user')) {
    sessionStorage.setItem(BAYI_PROFILE_EXTRA_KEY, payload);
  }
  if (
    !localStorage.getItem(BAYI_PROFILE_EXTRA_KEY) &&
    !sessionStorage.getItem(BAYI_PROFILE_EXTRA_KEY)
  ) {
    localStorage.setItem(BAYI_PROFILE_EXTRA_KEY, payload);
  }
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function joinFullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
}
