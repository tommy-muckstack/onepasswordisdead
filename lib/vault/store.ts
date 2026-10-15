"use client";
import { isBlob, type VaultBlob } from "./crypto";
/** Only the encrypted blob and non-secret preferences are written to localStorage. */
const k = (uid: string, name: string) => `onepasswordisdead:${uid}:${name}`;
export const loadBlob = (uid: string): VaultBlob | null => { try { const raw = localStorage.getItem(k(uid, "vault")); const j = raw ? JSON.parse(raw) : null; return isBlob(j) ? j : null; } catch { return null; } };
export const saveBlob = (uid: string, b: VaultBlob) => localStorage.setItem(k(uid, "vault"), JSON.stringify(b));
export const eraseBlob = (uid: string) => localStorage.removeItem(k(uid, "vault"));
export const loadPrefs = (uid: string): { lockMin: number } => { try { const j = JSON.parse(localStorage.getItem(k(uid, "prefs")) ?? "{}"); return { lockMin: [1, 5, 15, 30, 60].includes(j.lockMin) ? j.lockMin : 5 }; } catch { return { lockMin: 5 }; } };
export const savePrefs = (uid: string, p: { lockMin: number }) => localStorage.setItem(k(uid, "prefs"), JSON.stringify(p));
