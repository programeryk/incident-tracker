'use client';

type IncidentPaginationProps = {
  page: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
};

export function IncidentPagination({
  page,
  pageCount,
  hasNextPage,
  hasPreviousPage,
  isFetching = false,
  onPageChange,
}: IncidentPaginationProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span>
          Page {page} of {Math.max(pageCount, 1)}
        </span>
        {isFetching ? <span>Refreshing...</span> : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className="rounded-md border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="rounded-md border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}