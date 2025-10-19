// File: frontend/src/lib/api.ts
const API = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3001';

async function handleJSON<T>(res: Response): Promise<T> {
  // If the server returned no content, don't try to parse JSON
  if (res.status === 204) {
    // @ts-expect-error: caller should not expect a body on 204
    return undefined;
  }
  const text = await res.text();
  try {
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    throw new Error(`Failed to parse JSON: ${text || '(empty)'}`);
  }
}

function assertOk(res: Response) {
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
}

// -------- Graph --------
export type GraphResponse = {
  users: Array<{
    id: string;
    username: string;
    age: number;
    hobbies: string[];
    friends: string[];
    createdAt: string;
    popularityScore: number;
  }>;
  friendships: Array<{ user_id_a: string; user_id_b: string }>;
};

export async function fetchGraph(): Promise<GraphResponse> {
  const res = await fetch(`${API}/api/graph`, { cache: 'no-store' });
  assertOk(res);
  return handleJSON<GraphResponse>(res);
}

// -------- Users --------
export type User = GraphResponse['users'][number];

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API}/api/users`, { cache: 'no-store' });
  assertOk(res);
  return handleJSON<User[]>(res);
}

export async function createUser(payload: {
  username: string;
  age: number;
  hobbies: string[];
}): Promise<User> {
  const res = await fetch(`${API}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload),
  });
  assertOk(res);
  return handleJSON<User>(res);
}

export async function updateUser(id: string, payload: Partial<User>): Promise<User> {
  const res = await fetch(`${API}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload),
  });
  assertOk(res);
  return handleJSON<User>(res);
}

// Debounced variant (used by hobby drop). Feel free to keep using updateUser directly.
let updateTimer: ReturnType<typeof setTimeout> | null = null;
export function updateUserDebounced(id: string, payload: Partial<User>, delay = 250): Promise<User> {
  return new Promise((resolve, reject) => {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(async () => {
      try {
        const res = await updateUser(id, payload);
        resolve(res);
      } catch (e) {
        reject(e);
      }
    }, delay);
  });
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API}/api/users/${id}`, {
    method: 'DELETE',
    cache: 'no-store',
  });
  // IMPORTANT: don't parse JSON on 204
  if (res.status === 204) return;
  assertOk(res);
  // If your backend ever returns JSON (e.g. {message:'deleted'}) this will handle it,
  // but we ignore it because caller expects void.
  await handleJSON(res).catch(() => undefined);
}

// -------- Friendships --------
export async function linkUsers(a: string, b: string) {
  const res = await fetch(`${API}/api/users/${a}/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ friendId: b }),
  });
  assertOk(res);
  return handleJSON(res);
}

export async function unlinkUsers(a: string, b: string) {
  const res = await fetch(`${API}/api/users/${a}/unlink`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ friendId: b }),
  });
  assertOk(res);
  return handleJSON(res);
}
