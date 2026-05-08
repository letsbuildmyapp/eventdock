import { create } from 'zustand';
import { db } from './store';
import type { User } from './types';

/**
 * Demo auth — role-tile picker only. No email/password, no OAuth, no signup.
 * The selected user persists in localStorage so a page reload keeps the role;
 * Reset Demo clears it along with the rest of the eventdock keys.
 */

const AUTH_KEY = 'eventdock:auth';

type AuthState = {
  user: User | null;
  hydrated: boolean;
  hydrate: () => void;
  signInAs: (userId: string) => User;
  signOut: () => void;
};

function persist(u: User | null) {
  if (u) localStorage.setItem(AUTH_KEY, JSON.stringify({ id: u.id }));
  else localStorage.removeItem(AUTH_KEY);
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  hydrate: () => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const { id } = JSON.parse(raw);
        const u = db.getUser(id) ?? null;
        set({ user: u, hydrated: true });
        return;
      }
    } catch { /* ignore */ }
    set({ hydrated: true });
  },
  signInAs: (userId) => {
    const u = db.getUser(userId);
    if (!u) throw new Error('User not found');
    persist(u);
    set({ user: u });
    return u;
  },
  signOut: () => {
    persist(null);
    set({ user: null });
  },
}));
