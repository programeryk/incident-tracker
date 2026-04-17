'use client';

import { useGetIncidentsQuery } from './api';
import { IncidentFilters } from './IncidentFilters';
import { IncidentPagination } from './IncidentPagination';
import { setPage } from './incidentsSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import Link from 'next/link';
import { PriorityBadge, StatusBadge } from './IncidentBadges';

export function IncidentDashboard() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.incidents);
  const { data, isLoading, isFetching, isError, error } =
    useGetIncidentsQuery(filters);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">
            Maintenance Operations
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Incident Tracker Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Review machine incidents, filter operational issues, and track
            response progress.
          </p>
        </header>

        <div className="space-y-6">
          <IncidentFilters />

          <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium">Incidents</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Paginated incident data from the Nest API.
                </p>
              </div>

              {data ? (
                <div className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300">
                  {data.meta.itemCount} total
                </div>
              ) : null}
            </div>

            <div className="mt-6">
              {isLoading ? (
                <p className="text-sm text-slate-400">Loading incidents...</p>
              ) : null}

              {isError ? (
                <pre className="overflow-auto rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {JSON.stringify(error, null, 2)}
                </pre>
              ) : null}

              {data && data.data.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No incidents match the current filters.
                </p>
              ) : null}

              {data && data.data.length > 0 ? (
                <div className="overflow-hidden rounded-md border border-slate-800">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Title</th>
                        <th className="px-4 py-3 font-medium">Machine</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Priority</th>
                        <th className="px-4 py-3 font-medium">Occurred</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {data.data.map((incident) => (
                        <tr key={incident.id} className="hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-medium text-slate-100">
                            <Link
                              href={`/incidents/${incident.id}`}
                              className="text-cyan-200 hover:text-cyan-100"
                            >
                              {incident.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {incident.machineId}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={incident.status} />
                          </td>

                          <td className="px-4 py-3">
                            <PriorityBadge priority={incident.priority} />
                          </td>

                          <td className="px-4 py-3 text-slate-300">
                            {new Date(incident.occurredAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {data ? (
                <IncidentPagination
                  page={data.meta.page}
                  pageCount={data.meta.pageCount}
                  hasNextPage={data.meta.hasNextPage}
                  hasPreviousPage={data.meta.hasPreviousPage}
                  isFetching={isFetching}
                  onPageChange={(page) => dispatch(setPage(page))}
                />
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
