'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import {
  useAddIncidentCommentMutation,
  useGetIncidentEventsQuery,
  useGetIncidentQuery,
  useUpdateIncidentStatusMutation,
} from './api';
import { formatApiError } from './apiError';
import { PriorityBadge, StatusBadge } from './IncidentBadges';
import type { IncidentStatus } from './types';

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

function getNextStatuses(status: IncidentStatus): IncidentStatus[] {
  if (status === 'OPEN') {
    return ['IN_PROGRESS', 'RESOLVED'];
  }

  if (status === 'IN_PROGRESS') {
    return ['RESOLVED'];
  }

  return ['IN_PROGRESS'];
}

export function IncidentDetail({ incidentId }: IncidentDetailProps) {
  const { data, isLoading, isError, error } = useGetIncidentQuery(incidentId);
  const { data: events } = useGetIncidentEventsQuery(incidentId);
  const [updateIncidentStatus, { isLoading: isUpdatingStatus }] =
    useUpdateIncidentStatusMutation();
  const [addIncidentComment, { isLoading: isAddingComment }] =
    useAddIncidentCommentMutation();
  const [statusMessage, setStatusMessage] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentBody, setCommentBody] = useState('');

  const handleStatusChange = async (status: IncidentStatus) => {
    setStatusMessage('');

    try {
      await updateIncidentStatus({ id: incidentId, status }).unwrap();
      setStatusMessage(`Status updated to ${status.replace('_', ' ')}.`);
    } catch (mutationError) {
      setStatusMessage(
        formatApiError(mutationError, 'Status could not be updated.'),
      );
    }
  };

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCommentMessage('');

    const message = commentBody.trim();
    const author = commentAuthor.trim();

    if (!message) {
      setCommentMessage('Comment message is required.');
      return;
    }

    try {
      await addIncidentComment({
        incidentId,
        message,
        ...(author ? { author } : {}),
      }).unwrap();
      setCommentBody('');
      setCommentMessage('Comment added.');
    } catch (mutationError) {
      setCommentMessage(
        formatApiError(mutationError, 'Comment could not be added.'),
      );
    }
  };

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
            <p className="mt-4 text-sm text-red-200">
              {formatApiError(error, 'Incident could not be loaded.')}
            </p>
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-medium">Lifecycle</h2>
                  {statusMessage ? (
                    <p className="mt-1 text-sm text-slate-300">
                      {statusMessage}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {getNextStatuses(data.status).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => void handleStatusChange(status)}
                      disabled={isUpdatingStatus}
                      className="rounded-md border border-cyan-400/40 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUpdatingStatus
                        ? 'Updating...'
                        : `Set ${status.replace('_', ' ')}`}
                    </button>
                  ))}
                </div>
              </div>

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

                <div>
                  <dt className="text-sm text-slate-400">Assigned</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {data.assignedToUser?.name ?? 'Unassigned'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-medium">Timeline</h2>
              {events?.length ? (
                <div className="mt-5 space-y-3">
                  {events.map((event) => (
                    <article
                      key={event.id}
                      className="rounded-md border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-cyan-200">
                          {event.type.replace('_', ' ')}
                        </p>
                        <time className="text-xs text-slate-500">
                          {formatDate(event.createdAt)}
                        </time>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">
                        {event.message ?? 'Timeline event recorded.'}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Actor: {event.actorUser?.name ?? 'System'}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">
                  No timeline events have been recorded.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-medium">Comments</h2>

              <form onSubmit={handleCommentSubmit} className="mt-5 grid gap-4">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-slate-300">Message</span>
                  <textarea
                    value={commentBody}
                    onChange={(event) => {
                      setCommentBody(event.target.value);
                      setCommentMessage('');
                    }}
                    maxLength={2000}
                    rows={3}
                    required
                    placeholder="Add a progress update or maintenance note."
                    className="resize-y rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="text-slate-300">Author</span>
                    <input
                      type="text"
                      value={commentAuthor}
                      onChange={(event) => {
                        setCommentAuthor(event.target.value);
                        setCommentMessage('');
                      }}
                      maxLength={80}
                      placeholder="maintenance-tech"
                      className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isAddingComment}
                    className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAddingComment ? 'Adding...' : 'Add comment'}
                  </button>
                </div>

                {commentMessage ? (
                  <p className="text-sm text-slate-300">{commentMessage}</p>
                ) : null}
              </form>

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
