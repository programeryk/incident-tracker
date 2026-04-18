import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
};

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

function isSerializedError(error: unknown): error is SerializedError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

function formatMessage(message: string | string[]) {
  return Array.isArray(message) ? message.join(' ') : message;
}

export function formatApiError(error: unknown, fallback: string) {
  if (isFetchBaseQueryError(error)) {
    if (typeof error.data === 'object' && error.data !== null) {
      const body = error.data as ApiErrorBody;

      if (body.message) {
        return formatMessage(body.message);
      }

      if (body.error) {
        return body.error;
      }
    }

    if (typeof error.status === 'number') {
      return `${fallback} Status ${error.status}.`;
    }
  }

  if (isSerializedError(error) && error.message) {
    return error.message;
  }

  return fallback;
}
