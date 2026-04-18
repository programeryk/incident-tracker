import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  AddIncidentCommentRequest,
  CreateIncidentRequest,
  Incident,
  IncidentComment,
  IncidentFilters,
  PaginatedIncidentsResponse,
  UpdateIncidentStatusRequest,
} from './types';

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
    params.set('fromDate', `${filters.fromDate}T00:00:00.000Z`);
  }

  if (filters.toDate) {
    params.set('toDate', `${filters.toDate}T23:59:59.999Z`);
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
      providesTags: (result) => [
        { type: 'Incidents', id: 'LIST' },
        ...(result?.data.map((incident) => ({
          type: 'Incidents' as const,
          id: incident.id,
        })) ?? []),
      ],
    }),
    getIncident: builder.query<Incident, string>({
      query: (id) => `incidents/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Incidents', id }],
    }),
    createIncident: builder.mutation<Incident, CreateIncidentRequest>({
      query: (body) => ({
        url: 'incidents',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Incidents', id: 'LIST' }],
    }),
    updateIncidentStatus: builder.mutation<
      Incident,
      UpdateIncidentStatusRequest
    >({
      query: ({ id, status }) => ({
        url: `incidents/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Incidents', id },
        { type: 'Incidents', id: 'LIST' },
      ],
    }),
    addIncidentComment: builder.mutation<
      IncidentComment,
      AddIncidentCommentRequest
    >({
      query: ({ incidentId, ...body }) => ({
        url: `incidents/${incidentId}/comments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { incidentId }) => [
        { type: 'Incidents', id: incidentId },
        { type: 'Incidents', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useAddIncidentCommentMutation,
  useCreateIncidentMutation,
  useGetIncidentQuery,
  useGetIncidentsQuery,
  useUpdateIncidentStatusMutation,
} = incidentsApi;
