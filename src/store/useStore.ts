'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import {
  Box, Collector, Collection, Assignment, Expense, Complaint, Activity,
  IssueStatus, Message, TwilioSettings
} from '@/types';


const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

interface AuthState {
  isLoggedIn: boolean;
  role: 'admin' | 'collector' | null;
  currentUserId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  loginWithCredentials: (username: string, password: string) => Promise<{ success: boolean; error?: string; firstLogin?: boolean }>;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
}

interface AppState {
  // Data
  boxes: Box[];
  collectors: Collector[];
  collections: Collection[];
  assignments: Assignment[];
  expenses: Expense[];
  complaints: Complaint[];
  activities: Activity[];
  monthlyData: { month: string; amount: number }[];
  messages: Message[];
  twilioSettings: TwilioSettings | null;

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'warning'; id: string } | null;
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
  clearToast: () => void;

  // Fetch Action
  fetchData: () => Promise<void>;

  // Box actions
  addBox: (box: Omit<Box, 'id' | 'createdAt' | 'qrCodeData'>) => Promise<Box>;
  updateBox: (id: string, updates: Partial<Box>) => Promise<void>;
  deleteBox: (id: string) => Promise<void>;
  deleteAllBoxes: () => Promise<void>;

  // Admin actions
  registerAdmin: (name: string, email: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;

  // Collector actions
  addCollector: (collector: Omit<Collector, 'id' | 'createdAt'>) => Promise<{ id?: string; temporaryPassword?: string; username?: string } | null>;
  updateCollector: (id: string, updates: Partial<Collector>) => Promise<void>;
  changeCollectorPassword: (id: string, currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAllCollectors: () => Promise<void>;

  // Collection actions
  addCollection: (collection: Omit<Collection, 'id' | 'createdAt'>) => Promise<{ success: boolean; smsSent?: boolean; smsReason?: string; error?: string }>;
  updateCollection: (id: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>) => Promise<{ success: boolean; error?: string }>;

  // Assignment actions
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => Promise<void>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;

  // Complaint actions
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt'>) => Promise<void>;
  updateComplaintStatus: (id: string, status: IssueStatus) => Promise<void>;

  // Chat actions
  sendMessage: (content: string, senderId: string, receiverId: string, senderName: string) => Promise<void>;
  markMessagesAsRead: (collectorId: string, role: 'admin' | 'collector') => Promise<void>;
  appendMessage: (message: Message) => void;
  applyMessagesRead: (payload: { collectorId: string; role: 'admin' | 'collector' }) => void;

  // Twilio settings (admin)
  fetchTwilioSettings: () => Promise<TwilioSettings | null>;
  updateTwilioSettings: (updates: Partial<TwilioSettings>) => Promise<{ success: boolean; error?: string }>;
  sendTwilioTestSms: (phone: string) => Promise<{ success: boolean; error?: string }>;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      useAuthStore.getState().setTokens(data.access, data.refresh ?? refreshToken);
      return data.access as string;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { accessToken, logout } = useAuthStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && accessToken) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers.Authorization = `Bearer ${newAccess}`;
      res = await fetch(url, { ...options, headers });
    } else {
      logout();
    }
  }

  return res;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await apiFetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${url} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      role: null,
      currentUserId: null,
      accessToken: null,
      refreshToken: null,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),
      loginWithCredentials: async (username, password) => {
        try {
          const res = await fetch(`${API_BASE}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            set({
              isLoggedIn: true,
              role: data.role,
              currentUserId: data.currentUserId,
              accessToken: data.access,
              refreshToken: data.refresh,
            });
            await useAppStore.getState().fetchData();
            return { success: true, firstLogin: data.firstLogin };
          }
          return { success: false, error: data.error || 'Invalid username or password' };
        } catch (e) {
          console.error('Auth server connection error', e);
          return { success: false, error: 'Could not connect to authentication server' };
        }
      },
      logout: () =>
        set({
          isLoggedIn: false,
          role: null,
          currentUserId: null,
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        role: state.role,
        currentUserId: state.currentUserId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}

async function waitForAuthHydration(): Promise<void> {
  if (useAuthStore.persist.hasHydrated()) return;
  await new Promise<void>((resolve) => {
    useAuthStore.persist.onFinishHydration(() => resolve());
  });
}

export async function ensureSessionReady(): Promise<boolean> {
  await waitForAuthHydration();
  const { isLoggedIn, accessToken, refreshToken } = useAuthStore.getState();
  if (!isLoggedIn) return false;
  if (accessToken) return true;
  if (!refreshToken) return false;
  const newAccess = await refreshAccessToken();
  return !!newAccess;
}

export function useSessionBootstrap() {
  const hydrated = useAuthHydrated();
  const [bootstrapped, setBootstrapped] = useState(false);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const role = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    (async () => {
      const sessionOk = await ensureSessionReady();
      if (cancelled) return;

      if (sessionOk) {
        await useAppStore.getState().fetchData();
      }

      if (!cancelled) {
        setBootstrapped(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  const authenticated = isLoggedIn && !!accessToken && !!role;

  return {
    ready: hydrated && bootstrapped,
    authenticated,
    role,
    accessToken,
  };
}

export const useAppStore = create<AppState>()((set, get) => ({
  // Initial empty data state
  boxes: [],
  collectors: [],
  collections: [],
  assignments: [],
  expenses: [],
  complaints: [],
  activities: [],
  monthlyData: [],
  messages: [],
  twilioSettings: null,

  // Toast
  toast: null,
  showToast: (message, type) => {
    const id = generateId('toast');
    set({ toast: { message, type, id } });
    setTimeout(() => {
      const current = get().toast;
      if (current?.id === id) {
        set({ toast: null });
      }
    }, 4000);
  },
  clearToast: () => set({ toast: null }),

  // Fetch Data action from Django Backend
  fetchData: async () => {
    const { isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn) return;

    try {
      const [boxes, collectors, collections, assignments, expenses, complaints, activities, messages] = await Promise.all([
        fetchJson<Box[]>(`${API_BASE}/boxes/`),
        fetchJson<Collector[]>(`${API_BASE}/collectors/`),
        fetchJson<Collection[]>(`${API_BASE}/collections/`),
        fetchJson<Assignment[]>(`${API_BASE}/assignments/`),
        fetchJson<Expense[]>(`${API_BASE}/expenses/`),
        fetchJson<Complaint[]>(`${API_BASE}/complaints/`),
        fetchJson<Activity[]>(`${API_BASE}/activities/`),
        fetchJson<Message[]>(`${API_BASE}/messages/`),
      ]);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyDataMap: { [key: string]: number } = {};
      months.forEach(m => { monthlyDataMap[m] = 0; });

      collections.forEach((c: Collection) => {
        const dateObj = new Date(c.collectionDate);
        const mName = months[dateObj.getMonth()];
        if (mName) {
          monthlyDataMap[mName] += Number(c.amount) || 0;
        }
      });

      const monthlyData = months.map(m => ({
        month: m,
        amount: monthlyDataMap[m]
      }));

      set({
        boxes,
        collectors,
        collections,
        assignments,
        expenses,
        complaints,
        activities,
        messages,
        monthlyData
      });
    } catch (e) {
      console.error('Failed to sync state from backend database', e);
    }
  },

  deleteAllBoxes: async () => {
    try {
      const res = await apiFetch(`${API_BASE}/boxes/`, { method: 'DELETE' });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error('Failed to delete all boxes', e);
    }
  },

  deleteAllCollectors: async () => {
    try {
      const res = await apiFetch(`${API_BASE}/collectors/`, { method: 'DELETE' });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error('Failed to delete all collectors', e);
    }
  },

  addBox: async (boxData) => {
    const res = await apiFetch(`${API_BASE}/boxes/`, {
      method: 'POST',
      body: JSON.stringify(boxData),
    });
    const newBox = await res.json();
    await get().fetchData();
    return newBox;
  },

  updateBox: async (id, updates) => {
    await apiFetch(`${API_BASE}/boxes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    await get().fetchData();
  },

  deleteBox: async (id) => {
    await apiFetch(`${API_BASE}/boxes/${id}/`, {
      method: 'DELETE',
    });
    await get().fetchData();
  },

  registerAdmin: async (name, email, username, password) => {
    try {
      const res = await fetch(`${API_BASE}/register-admin/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Could not connect to registration server' };
    }
  },

  addCollector: async (collectorData) => {
    const res = await apiFetch(`${API_BASE}/collectors/`, {
      method: 'POST',
      body: JSON.stringify(collectorData),
    });
    const data = await res.json();
    await get().fetchData();
    if (res.ok) {
      return {
        id: data.id,
        temporaryPassword: data.temporaryPassword,
        username: data.username,
      };
    }
    return null;
  },

  updateCollector: async (id, updates) => {
    await apiFetch(`${API_BASE}/collectors/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    await get().fetchData();
  },

  changeCollectorPassword: async (id, currentPassword, newPassword) => {
    try {
      const res = await apiFetch(`${API_BASE}/collectors/${id}/change-password/`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, password: newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await get().fetchData();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to change password' };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Could not connect to the server' };
    }
  },

  addCollection: async (collectionData) => {
    let smsSent = false;
    let smsReason: string | undefined;

    try {
      const collectionDate = collectionData.collectionDate ?? '';
      const payload = {
        ...collectionData,
        collectionDate: collectionDate.includes('T')
          ? collectionDate
          : `${collectionDate}T12:00:00Z`,
      };
      const res = await apiFetch(`${API_BASE}/collections/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to save collection' };
      }
      smsSent = Boolean(data.smsSent);
      smsReason = data.smsReason as string | undefined;
    } catch (e) {
      console.error('Failed to add collection', e);
      return { success: false, error: 'Could not connect to the server' };
    }

    try {
      await get().fetchData();
    } catch (e) {
      console.error('Collection saved but failed to refresh data', e);
    }

    return { success: true, smsSent, smsReason };
  },

  updateCollection: async (id, updates) => {
    try {
      const payload = { ...updates };
      if (payload.collectionDate && !payload.collectionDate.includes('T')) {
        payload.collectionDate = `${payload.collectionDate}T12:00:00Z`;
      }
      const res = await apiFetch(`${API_BASE}/collections/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update collection' };
      }
      await get().fetchData();
      return { success: true };
    } catch (e) {
      console.error('Failed to update collection', e);
      return { success: false, error: 'Could not connect to the server' };
    }
  },

  addAssignment: async (assignmentData) => {
    await apiFetch(`${API_BASE}/assignments/`, {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
    await get().fetchData();
  },

  updateAssignment: async (id, updates) => {
    await apiFetch(`${API_BASE}/assignments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    await get().fetchData();
  },

  addExpense: async (expenseData) => {
    await apiFetch(`${API_BASE}/expenses/`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    await get().fetchData();
  },

  addComplaint: async (complaintData) => {
    await apiFetch(`${API_BASE}/complaints/`, {
      method: 'POST',
      body: JSON.stringify(complaintData),
    });
    await get().fetchData();
  },

  updateComplaintStatus: async (id, status) => {
    await apiFetch(`${API_BASE}/complaints/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await get().fetchData();
  },

  sendMessage: async (content, senderId, receiverId, senderName) => {
    await apiFetch(`${API_BASE}/messages/`, {
      method: 'POST',
      body: JSON.stringify({ content, senderId, receiverId, senderName }),
    });
  },

  markMessagesAsRead: async (collectorId, role) => {
    get().applyMessagesRead({ collectorId, role });
    try {
      await apiFetch(`${API_BASE}/messages/read/`, {
        method: 'POST',
        body: JSON.stringify({ collectorId, role }),
      });
    } catch (e) {
      console.error('Failed to mark messages as read', e);
      await get().fetchData();
    }
  },

  appendMessage: (message) => {
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) {
        return state;
      }
      const messages = [...state.messages, message].sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
      );
      return { messages };
    });
  },

  applyMessagesRead: ({ collectorId, role }) => {
    set((state) => ({
      messages: state.messages.map((m) => {
        if (role === 'admin') {
          if (collectorId === '__all__') {
            if (m.receiverId === 'admin' && m.senderId !== 'admin' && !m.isRead) {
              return { ...m, isRead: true };
            }
          } else if (m.senderId === collectorId && m.receiverId === 'admin' && !m.isRead) {
            return { ...m, isRead: true };
          }
        } else if (
          role === 'collector' &&
          m.senderId === 'admin' &&
          m.receiverId === collectorId &&
          !m.isRead
        ) {
          return { ...m, isRead: true };
        }
        return m;
      }),
    }));
  },

  fetchTwilioSettings: async () => {
    try {
      const res = await apiFetch(`${API_BASE}/settings/twilio/`);
      if (!res.ok) return null;
      const data = (await res.json()) as TwilioSettings;
      set({ twilioSettings: data });
      return data;
    } catch (e) {
      console.error('Failed to fetch Twilio settings', e);
      return null;
    }
  },

  updateTwilioSettings: async (updates) => {
    try {
      const res = await apiFetch(`${API_BASE}/settings/twilio/`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to save settings' };
      }
      const data = (await res.json()) as TwilioSettings;
      set({ twilioSettings: data });
      return { success: true };
    } catch (e) {
      console.error('Failed to update Twilio settings', e);
      return { success: false, error: 'Network error while saving settings' };
    }
  },

  sendTwilioTestSms: async (phone) => {
    try {
      const res = await apiFetch(`${API_BASE}/settings/twilio/test/`, {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to send test SMS' };
      }
      return { success: true };
    } catch (e) {
      console.error('Failed to send test SMS', e);
      return { success: false, error: 'Network error while sending test SMS' };
    }
  },
}));
