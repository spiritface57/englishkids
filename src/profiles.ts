import { useEffect, useState } from 'react';

// Child profiles on one device ("Who's playing?"). Each child's progress (stickers, best scores, streaks, finished
// stories…) is stored separately in this browser; nothing is sent anywhere.
// The first profile has id '' and uses the original, unprefixed keys, so progress saved before profiles existed
// simply belongs to it. Other profiles store their keys as `kid:<id>:<key>`.

export type Profile = { id: string; name: string; avatar: string };

export const avatars = ['🦁', '🐼', '🐰', '🦊', '🐸', '🐯', '🐨', '🦄', '🐙', '🐵', '🐧', '🐝'];
export const MAX_PROFILES = 6;

const LIST_KEY = 'profiles';
const ACTIVE_KEY = 'activeProfile';
const EVENT = 'profile-changed';

export function getProfiles(): Profile[] {
  try {
    const list = JSON.parse(localStorage.getItem(LIST_KEY) ?? '[]') as Profile[];
    if (list.length) return list;
  } catch {
    // fall through to the default profile
  }
  return [{ id: '', name: localStorage.getItem('childName') ?? '', avatar: avatars[0] }];
}

const saveProfiles = (list: Profile[]) => {
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
};

export const activeProfileId = () => {
  const id = localStorage.getItem(ACTIVE_KEY) ?? '';
  return getProfiles().some((p) => p.id === id) ? id : '';
};

const prefix = (id = activeProfileId()) => (id ? `kid:${id}:` : '');

// localStorage for the active child's progress.
export const kidStorage = {
  getItem: (key: string) => localStorage.getItem(prefix() + key),
  setItem: (key: string, value: string) => localStorage.setItem(prefix() + key, value),
};

export function switchProfile(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
  window.dispatchEvent(new Event(EVENT));
}

export function addProfile(name: string, avatar: string) {
  const list = getProfiles();
  if (list.length >= MAX_PROFILES) return;
  const id = Date.now().toString(36);
  saveProfiles([...list, { id, name: name.trim(), avatar }]);
  switchProfile(id);
}

export function updateProfile(id: string, patch: Partial<Omit<Profile, 'id'>>) {
  saveProfiles(getProfiles().map((p) => (p.id === id ? { ...p, ...patch } : p)));
}

// Removes a child and all of their saved progress. The first profile can be renamed but not removed.
export function removeProfile(id: string) {
  if (!id) return;
  const p = prefix(id);
  for (const key of Object.keys(localStorage)) if (key.startsWith(p)) localStorage.removeItem(key);
  if (activeProfileId() === id) localStorage.setItem(ACTIVE_KEY, '');
  saveProfiles(getProfiles().filter((x) => x.id !== id));
}

export function useProfiles() {
  const [state, setState] = useState(() => ({ profiles: getProfiles(), active: activeProfileId() }));
  useEffect(() => {
    const sync = () => setState({ profiles: getProfiles(), active: activeProfileId() });
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const current = state.profiles.find((p) => p.id === state.active) ?? state.profiles[0];
  return { ...state, current };
}
