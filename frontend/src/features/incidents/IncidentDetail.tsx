'use client';

import Link from 'next/link';
import { useGetIncidentQuery } from './api';
import { PriorityBadge, StatusBadge } from './IncidentBadges';

type IncidentDetailProps = {
  incidentId: string;
};

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
}

function formatDowntime(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'Not set';
  }

  return `${value} min`;
}

export function IncidentDetail({ incidentId }: IncidentDetailProps) {
    const { data, isLoading, isError, error } = useGetIncidentQuery(incidentId);

    return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
        >
          Back to incidents
        </Link>

        {isLoading ? (
          <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Loading incident...</p>
          </section>
        ) : null}

        {isError ? (
          <section className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 p-5">
            <h1 className="text-lg font-semibold text-red-100">
              Incident could not be loaded
            </h1>
            <pre className="mt-4 overflow-auto text-sm text-red-200">
              {JSON.stringify(error, null, 2)}
            </pre>
          </section>
        ) : null}

        {data ? (
          <div className="mt-8 space-y-6">
            <header className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">
                    {data.machineId}
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold">{data.title}</h1>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={data.status} />
                  <PriorityBadge priority={data.priority} />
                </div>
              </div>

              {data.description ? (
                <p className="mt-5 max-w-3xl text-slate-300">
                  {data.description}
                </p>
              ) : (
                <p className="mt-5 text-slate-500">No description provided.</p>
              )}
            </header>

            <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-medium">Lifecycle</h2>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm text-slate-400">Occurred</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {formatDate(data.occurredAt)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-slate-400">Acknowledged</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {formatDate(data.acknowledgedAt)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-slate-400">Resolved</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {formatDate(data.resolvedAt)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-slate-400">Downtime</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {formatDowntime(data.downtimeMinutes)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-medium">Comments</h2>

              {data.comments.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">
                  No comments have been added.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {data.comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-md border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-slate-200">
                          {comment.author ?? 'Unknown author'}
                        </p>
                        <time className="text-xs text-slate-500">
                          {formatDate(comment.createdAt)}
                        </time>
                      </div>

                      <p className="mt-3 text-sm text-slate-300">
                        {comment.message}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
