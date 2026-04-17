import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { IncidentFilters, PaginatedIncidentsResponse } from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

function buildIncidentQuery(filters: IncidentFilters) {
  const params = new URLSearchParams();

  params.set('page', String(filters.page));
  params.set('pageSize', String(filters.pageSize));

  if (filters.machineId.trim()) {
    params.set('machineId', filters.machineId.trim());
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.priority) {
    params.set('priority', filters.priority);
  }

  if (filters.fromDate) {
    params.set('fromDate', new Date(filters.fromDate).toISOString());
  }

  if (filters.toDate) {
    params.set('toDate', new Date(filters.toDate).toISOString());
  }

  return `incidents?${params.toString()}`;
}

export const incidentsApi = createApi({
  reducerPath: 'incidentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
  }),
  tagTypes: ['Incidents'],
  endpoints: (builder) => ({
    getIncidents: builder.query<PaginatedIncidentsResponse, IncidentFilters>({
      query: buildIncidentQuery,
      providesTags: ['Incidents'],
    }),
  }),
});

export const { useGetIncidentsQuery } = incidentsApi;