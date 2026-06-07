export interface CollectorCredentials {
  username: string;
  temporaryPassword: string;
}

const STORAGE_KEY = 'collector-credentials';

export function loadCollectorCredentials(): Record<string, CollectorCredentials> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveCollectorCredentials(
  collectorId: string,
  credentials: CollectorCredentials
): Record<string, CollectorCredentials> {
  const all = loadCollectorCredentials();
  all[collectorId] = credentials;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all;
}

export function removeCollectorCredentials(collectorId: string): Record<string, CollectorCredentials> {
  const all = loadCollectorCredentials();
  delete all[collectorId];
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all;
}
