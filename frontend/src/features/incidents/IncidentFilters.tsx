'use client';

import {
  resetFilters,
  setActiveOnly,
  setArea,
  setAssignedToUserId,
  setLine,
  setFromDate,
  setMachineId,
  setPriority,
  setStatus,
  setToDate,
  setPageSize,
} from './incidentsSlice';

import type { IncidentPriority, IncidentStatus } from './types';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { useGetMeQuery, useGetUsersQuery } from './api';

const STATUS_OPTIONS: Array<IncidentStatus> = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
];
const PRIORITY_OPTIONS: Array<IncidentPriority> = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

export function IncidentFilters() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.incidents);
  const { data: currentUser } = useGetMeQuery();
  const canFilterUsers =
    currentUser?.user.role === 'SUPERVISOR' ||
    currentUser?.user.role === 'ADMIN';
  const { data: users } = useGetUsersQuery(undefined, {
    skip: !canFilterUsers,
  });

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-100">Filters</h2>
          <p className="mt-1 text-sm text-slate-400">
            Narrow incidents by machine, status, priority, and date range.
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch(resetFilters())}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          RESET
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Machine ID</span>
          <input
            type="text"
            value={filters.machineId}
            onChange={(event) => dispatch(setMachineId(event.target.value))}
            placeholder="e.g. CNC-01"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Area</span>
          <input
            type="text"
            value={filters.area}
            onChange={(event) => dispatch(setArea(event.target.value))}
            placeholder="Press Hall"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Line</span>
          <input
            type="text"
            value={filters.line}
            onChange={(event) => dispatch(setLine(event.target.value))}
            placeholder="Line 3"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">STATUS</span>
          <select
            value={filters.status}
            onChange={(event) =>
              dispatch(setStatus(event.target.value as IncidentStatus | ''))
            }
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        {canFilterUsers ? (
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Assigned</span>
            <select
              value={filters.assignedToUserId}
              onChange={(event) =>
                dispatch(setAssignedToUserId(event.target.value))
              }
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="">Anyone</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Priority</span>
          <select
            value={filters.priority}
            onChange={(event) =>
              dispatch(setPriority(event.target.value as IncidentPriority | ''))
            }
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
          >
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">From date</span>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(event) => dispatch(setFromDate(event.target.value))}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">To date</span>
          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => dispatch(setToDate(event.target.value))}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-300">Page size</span>
          <select
            value={filters.pageSize}
            onChange={(event) =>
              dispatch(setPageSize(Number(event.target.value)))
            }
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>

        <label className="flex flex-row items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={filters.activeOnly}
            onChange={(event) => dispatch(setActiveOnly(event.target.checked))}
            className="h-4 w-4 rounded border-slate-700 bg-slate-950"
          />
          <span className="text-slate-300">Active only</span>
        </label>
      </div>
    </section>
  );
}
