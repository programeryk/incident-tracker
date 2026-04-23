'use client';

import { type FormEvent, useState } from 'react';
import { useLoginMutation } from '@/features/incidents/api';
import { formatApiError } from '@/features/incidents/apiError';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      await login({ email, password }).unwrap();
    } catch (error) {
      setMessage(formatApiError(error, 'Login failed.'));
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <section className="w-full rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">
            Maintenance Operations
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            Sign in to Incident Tracker
          </h1>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>

            {message ? <p className="text-sm text-red-200">{message}</p> : null}

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
