'use client';

import { type FormEvent, useState } from 'react';
import {
  useCreateUserMutation,
  useGetUsersQuery,
} from '@/features/incidents/api';
import { formatApiError } from '@/features/incidents/apiError';
import type { UserRole } from '@/features/incidents/types';

const roles: UserRole[] = ['OPERATOR', 'TECHNICIAN', 'SUPERVISOR', 'ADMIN'];
const initialForm = {
  email: '',
  name: '',
  role: 'OPERATOR' as UserRole,
  password: '',
};

export function UsersAdmin() {
  const { data, isLoading } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      await createUser(form).unwrap();
      setForm(initialForm);
      setMessage('User created.');
    } catch (error) {
      setMessage(formatApiError(error, 'User could not be created.'));
    }
  };

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">
            Access Control
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Users</h1>
        </header>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-medium">Create user</h2>
          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Name</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Role</span>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as UserRole,
                  }))
                }
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Temporary password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
                minLength={12}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>

            <div className="flex items-center justify-between md:col-span-2">
              <p className="text-sm text-slate-300">{message}</p>
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? 'Creating...' : 'Create user'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-medium">Directory</h2>
          {isLoading ? <p className="mt-4 text-sm">Loading users...</p> : null}
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data?.map((user) => (
              <article
                key={user.id}
                className="rounded-md border border-slate-800 bg-slate-950 p-4"
              >
                <p className="font-medium text-slate-100">{user.name}</p>
                <p className="mt-1 text-sm text-slate-400">{user.email}</p>
                <p className="mt-3 text-sm text-cyan-200">{user.role}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
