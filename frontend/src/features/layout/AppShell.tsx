'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useGetMeQuery,
  useLogoutMutation,
} from '@/features/incidents/api';
import { LoginScreen } from '@/features/auth/LoginScreen';
import type { UserRole } from '@/features/incidents/types';

type AppShellProps = {
  children: React.ReactNode;
};

function canManage(role?: UserRole) {
  return role === 'SUPERVISOR' || role === 'ADMIN';
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { data, isLoading, isError } = useGetMeQuery();
  const [logout] = useLogoutMutation();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
        <p className="text-sm text-slate-400">Checking session...</p>
      </main>
    );
  }

  if (isError || !data?.user) {
    return <LoginScreen />;
  }

  const nav = [
    { href: '/', label: 'Incidents', show: true },
    { href: '/machines', label: 'Machines', show: canManage(data.user.role) },
    { href: '/users', label: 'Users', show: data.user.role === 'ADMIN' },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
              Maintenance Operations
            </p>
            <h1 className="mt-1 text-xl font-semibold">Incident Tracker</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span>
              {data.user.name} / {data.user.role}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
