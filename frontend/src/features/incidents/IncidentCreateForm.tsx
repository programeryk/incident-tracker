'use client';

import { type FormEvent, useState } from 'react';
import { useCreateIncidentMutation } from './api';
import { formatApiError } from './apiError';
import type { IncidentPriority, IncidentStatus } from './types';

const PRIORITY_OPTIONS: IncidentPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];
const STATUS_OPTIONS: IncidentStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

type CreateFormState = {
  title: string;
  machineId: string;
  priority: IncidentPriority;
  description: string;
  status: IncidentStatus;
  occurredAt: string;
};

const initialState: CreateFormState = {
  title: '',
  machineId: '',
  priority: 'MEDIUM',
  description: '',
  status: 'OPEN',
  occurredAt: '',
};

function toIncidentDate(value: string) {
  if (!value) {
    return undefined;
  }

  return new Date(value).toISOString();
}

export function IncidentCreateForm() {
  const [form, setForm] = useState<CreateFormState>(initialState);
  const [formMessage, setFormMessage] = useState('');
  const [createIncident, { isLoading }] = useCreateIncidentMutation();

  const updateField = <Field extends keyof CreateFormState>(
    field: Field,
    value: CreateFormState[Field],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const machineId = form.machineId.trim();
    const description = form.description.trim();

    if (!title || !machineId) {
      setFormMessage('Title and machine ID are required.');
      return;
    }

    try {
      await createIncident({
        title,
        machineId,
        priority: form.priority,
        status: form.status,
        ...(description ? { description } : {}),
        ...(form.occurredAt
          ? { occurredAt: toIncidentDate(form.occurredAt) }
          : {}),
      }).unwrap();

      setForm(initialState);
      setFormMessage('Incident created.');
    } catch (error) {
      setFormMessage(formatApiError(error, 'Incident could not be created.'));
    }
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div>
        <h2 className="text-lg font-medium text-slate-100">Create incident</h2>
        <p className="mt-1 text-sm text-slate-400">
          Report a machine issue and put it into the incident queue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              maxLength={120}
              required
              placeholder="Hydraulic leak on press 04"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Machine ID</span>
            <input
              type="text"
              value={form.machineId}
              onChange={(event) => updateField('machineId', event.target.value)}
              maxLength={80}
              required
              placeholder="PRESS-04"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Priority</span>
            <select
              value={form.priority}
              onChange={(event) =>
                updateField('priority', event.target.value as IncidentPriority)
              }
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Initial status</span>
            <select
              value={form.status}
              onChange={(event) =>
                updateField('status', event.target.value as IncidentStatus)
              }
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Occurred</span>
            <input
              type="datetime-local"
              value={form.occurredAt}
              onChange={(event) =>
                updateField('occurredAt', event.target.value)
              }
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Description</span>
          <textarea
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="What happened, where it was observed, and any immediate action taken."
            className="resize-y rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {formMessage ? (
            <p className="text-sm text-slate-300">{formMessage}</p>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Creating...' : 'Create incident'}
          </button>
        </div>
      </form>
    </section>
  );
}
