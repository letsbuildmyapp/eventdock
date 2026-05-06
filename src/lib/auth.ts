import { create } from 'zustand';
import { db } from './store';
import type { User, Role } from './types';
import { uid } from './utils';

const AUTH_KEY = 'eventdock:auth';
const DEMO_PASSWORD = 'demo1234';

type AuthState = {
  user: User | null;
  hydrated: boolean;
  hydrate: () => void;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signInAs: (userId: string) => User;
  signUp: (email: string, password: string, name: string, role: Role) => Promise<User>;
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
  signIn: async (email, password) => {
    if (password !== DEMO_PASSWORD) {
      throw new Error('Use password "demo1234" — this is a portfolio demo.');
    }
    const existing = db.getUserByEmail(email);
    if (!existing) throw new Error('No account with that email. Try a demo tile or sign up.');
    persist(existing);
    set({ user: existing });
    return existing;
  },
  signInWithGoogle: async () => {
    // Simulated Google: pick or create the organizer demo account.
    let u = db.getUserByEmail('organizer@eventdock.demo');
    if (!u) {
      u = { id: uid('u_'), email: 'organizer@eventdock.demo', name: 'Maya Chen', role: 'organizer' };
      db.upsertUser(u);
    }
    persist(u);
    set({ user: u });
    return u;
  },
  signInAs: (userId) => {
    const u = db.getUser(userId);
    if (!u) throw new Error('User not found');
    persist(u);
    set({ user: u });
    return u;
  },
  signUp: async (email, _password, name, role) => {
    if (db.getUserByEmail(email)) throw new Error('Email already in use.');
    const u: User = { id: uid('u_'), email, name, role };
    db.upsertUser(u);
    persist(u);
    set({ user: u });
    return u;
  },
  signOut: () => {
    persist(null);
    set({ user: null });
  },
}));

export const DEMO_PWD = DEMO_PASSWORD;
