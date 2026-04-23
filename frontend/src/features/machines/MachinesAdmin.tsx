'use client';

import { type FormEvent, useState } from 'react';
import {
  useCreateMachineMutation,
  useGetMachinesQuery,
} from '@/features/incidents/api';
import { formatApiError } from '@/features/incidents/apiError';

const initialForm = {
  code: '',
  name: '',
  area: '',
  line: '',
  description: '',
};

export function MachinesAdmin() {
  const { data, isLoading } = useGetMachinesQuery();
  const [createMachine, { isLoading: isCreating }] = useCreateMachineMutation();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      await createMachine({
        code: form.code,
        name: form.name,
        area: form.area,
        ...(form.line ? { line: form.line } : {}),
        ...(form.description ? { description: form.description } : {}),
      }).unwrap();
      setForm(initialForm);
      setMessage('Machine created.');
    } catch (error) {
      setMessage(formatApiError(error, 'Machine could not be created.'));
    }
  };

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">
            Asset Registry
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Machines</h1>
        </header>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-medium">Create machine</h2>
          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            {[
              ['code', 'Code', 'PRESS-04'],
              ['name', 'Name', 'Hydraulic Press 04'],
              ['area', 'Area', 'Press Hall'],
              ['line', 'Line', 'Line 3'],
            ].map(([field, label, placeholder]) => (
              <label key={field} className="grid gap-2 text-sm">
                <span className="text-slate-300">{label}</span>
                <input
                  value={form[field as keyof typeof form]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  required={field !== 'line'}
                  placeholder={placeholder}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                />
              </label>
            ))}

            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="text-slate-300">Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
            </label>

            <div className="flex items-center justify-between md:col-span-2">
              <p className="text-sm text-slate-300">{message}</p>
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? 'Creating...' : 'Create machine'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-medium">Registry</h2>
          {isLoading ? <p className="mt-4 text-sm">Loading machines...</p> : null}
          <div className="mt-5 overflow-hidden rounded-md border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Line</th>
                  <th className="px-4 py-3">Incidents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.data.map((machine) => (
                  <tr key={machine.id}>
                    <td className="px-4 py-3 font-medium text-cyan-200">
                      {machine.code}
                    </td>
                    <td className="px-4 py-3">{machine.name}</td>
                    <td className="px-4 py-3">{machine.area}</td>
                    <td className="px-4 py-3">{machine.line ?? 'Not set'}</td>
                    <td className="px-4 py-3">
                      {machine._count?.incidents ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

