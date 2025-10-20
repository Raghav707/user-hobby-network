// File: frontend/src/components/UserPanel.tsx
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUser, deleteUser, fetchUsers, updateUser } from '../lib/api';
import type { User } from '../lib/types';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';

// ✅ Zod schema
const schema = z.object({
  username: z.string().min(2, 'Username is too short'),
  age: z.coerce.number().int().min(1, 'Age must be a positive number'),
  hobbies: z.string().optional(), // comma-separated for the form
});

// ✅ Form value type
type FormValues = z.infer<typeof schema>;

export default function UserPanel() {
  // ✅ Step 1: include hobbies from context
  const { refresh, setHobbies, hobbies } = useApp();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => users.find((u) => u.id === selectedId) || null,
    [users, selectedId]
  );

  // Load users for table + populate hobbies for sidebar
  useEffect(() => {
    (async () => {
      try {
        const dirtyList = await fetchUsers();

        // ✅ FINAL, SAFER FIX: Clean the bad data from /api/users
        const cleanList = dirtyList.map(user => ({
          ...user,
          // This makes sure hobbies is ALWAYS an array
          hobbies: (typeof user.hobbies === 'string')
            ? (user.hobbies as any).split(',').filter(Boolean)
            : Array.isArray(user.hobbies) ? user.hobbies : []
        }));
        
        setUsers(cleanList); // <-- Use the clean list
        const all = new Set<string>();
        cleanList.forEach((u) => u.hobbies.forEach((h: string) => all.add(h))); // <-- FIXED! // <-- Use the clean list
        setHobbies([...all].sort());

      } catch (e: any) {
        toast.error(e?.message || 'Failed to fetch users');
      }
    })();
  }, [refresh, setHobbies]);

  // ✅ Strongly type the form + the resolver
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', age: 18, hobbies: '' },
  });

  // Prefill form on select
  useEffect(() => {
    if (selected) {
      reset({
        username: selected.username,
        age: selected.age,
        hobbies: selected.hobbies.join(', '),
      });
    } else {
      reset({ username: '', age: 18, hobbies: '' });
    }
  }, [selectedId, reset]);

  // ✅ Step 2: Replace onSubmit
  async function onSubmit(values: FormValues) {
    const payload = {
      username: values.username.trim(),
      age: Number(values.age),
      hobbies: values.hobbies
        ? values.hobbies.split(',').map((h) => h.trim()).filter(Boolean)
        : [],
    };

    try {
      if (selected) {
        // UPDATE
        const updated = await updateUser(selected.id, payload);

        // update list in place
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

        // update hobby cloud (array, not callback)
        const merged = new Set<string>([...hobbies, ...updated.hobbies]);
        setHobbies([...merged].sort());

        toast.success('User updated');
      } else {
        // CREATE
        await createUser(payload); // 1. Create the user, but ignore the broken object it returns
        toast.success('User created');

        // 2. INSTEAD, just re-fetch the ENTIRE list of users
        // This is the same code from your useEffect hook!
        try {
          const dirtyList = await fetchUsers();

          // ✅ FINAL, SAFER FIX: Clean the bad data from /api/users
          const cleanList = dirtyList.map(user => ({
            ...user,
            // This makes sure hobbies is ALWAYS an array
            hobbies: (typeof user.hobbies === 'string')
              ? (user.hobbies as any).split(',').filter(Boolean)
              : Array.isArray(user.hobbies) ? user.hobbies : []
          }));

          setUsers(cleanList); // <-- Use the clean list
          const all = new Set<string>();
          cleanList.forEach((u) => u.hobbies.forEach((h: string) => all.add(h))); // <-- FIXED! // <-- Use the clean list
          setHobbies([...all].sort());

        } catch (e: any) {
          toast.error(e?.message || 'Failed to fetch users');
        }

        // 3. We still refresh the graph
        refresh();
      }


      // clear selection + form
      setSelectedId(null);
      reset({ username: '', age: 18, hobbies: '' });

      // refresh graph
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save user');
    }
  }

  // ✅ Step 3: Replace onDelete
  async function onDelete(id: string) {
    const ok = window.confirm('Delete this user? (Must be unlinked first)');
    if (!ok) return;

    try {
      await deleteUser(id);

      // remove locally
      const nextUsers = users.filter((u) => u.id !== id);
      setUsers(nextUsers);

      // recompute hobby cloud from remaining users
      const all = new Set<string>();
      nextUsers.forEach((u) => u.hobbies.forEach((h) => all.add(h)));
      setHobbies([...all].sort());

      setSelectedId(null);
      toast.success('User deleted');
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete user');
    }
  }

  // ✅ Step 4: Removed reloadUsers (unused)

  return (
    <aside className="w-[28rem] shrink-0 border-l bg-white/80 backdrop-blur p-4 space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">User Management</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="text-sm font-medium">Username</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            {...register('username')}
          />
          {errors.username && (
            <p className="text-xs text-red-600 mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Age</label>
          <input
            type="number"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            {...register('age')}
          />
          {errors.age && (
            <p className="text-xs text-red-600 mt-1">{errors.age.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Hobbies (comma-separated)</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="e.g. chess, gym"
            {...register('hobbies')}
          />
          {errors.hobbies && (
            <p className="text-xs text-red-600 mt-1">
              {errors.hobbies.message as string}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            disabled={isSubmitting}
            className="rounded-xl bg-sky-600 text-white px-4 py-2 text-sm hover:bg-sky-700 disabled:opacity-50"
          >
            {selected ? 'Update' : 'Create'}
          </button>

          {selected && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* User list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Existing Users</h3>
        <div className="space-y-2 max-h-[45vh] overflow-auto pr-1">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">
                  {u.username}{' '}
                  <span className="text-xs text-slate-500">({u.age})</span>
                </div>
                <div className="text-xs text-slate-500 truncate max-w-[14rem]">
                  {u.hobbies.join(', ') || '—'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedId(u.id)}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(u.id)}
                  className="rounded-lg px-3 py-1 text-sm bg-red-50 text-red-700 hover:bg-red-100"
                  title="Must unlink first"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!users.length && (
            <p className="text-xs text-slate-500">No users yet.</p>
          )}
        </div>
      </div>
    </aside>
  );
}