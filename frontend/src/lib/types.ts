// File: frontend/src/lib/types.ts

// ===== Backend domain types =====
export type User = {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
  friends: string[];         // friend IDs
  createdAt: string;         // ISO string
  popularityScore: number;   // computed
};

export type Friendship = {
  user_id_a: string;
  user_id_b: string;
};

export type GraphResponse = {
  users: User[];
  friendships: Friendship[];
};

// ===== React Flow node data =====
export type RFNodeData = {
  label: string;
  userData: User;
  _version: string; // helps transitions when score changes
};
