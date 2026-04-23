import {
  createApi,
  fetchBaseQuery,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type {
  AddIncidentCommentRequest,
  AuthResponse,
  CreateIncidentRequest,
  CreateMachineRequest,
  CreateUserRequest,
  Incident,
  IncidentComment,
  IncidentEvent,
  IncidentFilters,
  IncidentMetrics,
  Machine,
  PaginatedIncidentsResponse,
  PaginatedMachinesResponse,
  UpdateIncidentStatusRequest,
  UserSummary,
} from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
});

const baseQueryWithRefresh: typeof rawBaseQuery = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const path = typeof args === 'string' ? args : (args as FetchArgs).url;

  if (
    (result.error as FetchBaseQueryError | undefined)?.status === 401 &&
    !String(path).startsWith('auth/')
  ) {
    const refresh = await rawBaseQuery(
      { url: 'auth/refresh', method: 'POST' },
      api,
      extraOptions,
    );

    if (!refresh.error) {
      return rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

function buildIncidentQuery(filters: IncidentFilters) {
  const params = new URLSearchParams();

  params.set('page', String(filters.page));
  params.set('pageSize', String(filters.pageSize));

  if (filters.machineId.trim()) {
    params.set('machineId', filters.machineId.trim().toUpperCase());
  }

  if (filters.area.trim()) {
    params.set('area', filters.area.trim());
  }

  if (filters.line.trim()) {
    params.set('line', filters.line.trim());
  }

  if (filters.assignedToUserId) {
    params.set('assignedToUserId', filters.assignedToUserId);
  }

  if (filters.activeOnly) {
    params.set('activeOnly', 'true');
  }

  if (filters.status && !filters.activeOnly) {
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
  baseQuery: baseQueryWithRefresh,
  tagTypes: [
    'Auth',
    'Incidents',
    'IncidentEvents',
    'IncidentMetrics',
    'Machines',
    'Users',
  ],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({
        url: 'auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Auth',
        'Incidents',
        'IncidentMetrics',
        'Machines',
        'Users',
      ],
    }),
    logout: builder.mutation<{ ok: true }, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
    getMe: builder.query<AuthResponse, void>({
      query: () => 'auth/me',
      providesTags: ['Auth'],
    }),
    getUsers: builder.query<UserSummary[], void>({
      query: () => 'users',
      providesTags: ['Users'],
    }),
    createUser: builder.mutation<UserSummary, CreateUserRequest>({
      query: (body) => ({
        url: 'users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Users'],
    }),
    getMachines: builder.query<PaginatedMachinesResponse, void>({
      query: () => 'machines?pageSize=100',
      providesTags: ['Machines'],
    }),
    createMachine: builder.mutation<Machine, CreateMachineRequest>({
      query: (body) => ({
        url: 'machines',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Machines'],
    }),
    updateMachine: builder.mutation<
      Machine,
      { id: string; body: Partial<CreateMachineRequest> }
    >({
      query: ({ id, body }) => ({
        url: `machines/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Machines', 'Incidents', 'IncidentMetrics'],
    }),
    getIncidentMetrics: builder.query<IncidentMetrics, void>({
      query: () => 'incidents/metrics',
      providesTags: ['IncidentMetrics'],
    }),
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
    getIncidentEvents: builder.query<IncidentEvent[], string>({
      query: (id) => `incidents/${id}/events`,
      providesTags: (_result, _error, id) => [
        { type: 'IncidentEvents', id },
      ],
    }),
    createIncident: builder.mutation<Incident, CreateIncidentRequest>({
      query: (body) => ({
        url: 'incidents',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Incidents', 'IncidentEvents', 'IncidentMetrics'],
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
        { type: 'IncidentEvents', id },
        { type: 'Incidents', id: 'LIST' },
        'IncidentMetrics',
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
        { type: 'IncidentEvents', id: incidentId },
        { type: 'Incidents', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useAddIncidentCommentMutation,
  useCreateIncidentMutation,
  useCreateMachineMutation,
  useCreateUserMutation,
  useGetIncidentEventsQuery,
  useGetIncidentMetricsQuery,
  useGetIncidentQuery,
  useGetIncidentsQuery,
  useGetMachinesQuery,
  useGetMeQuery,
  useGetUsersQuery,
  useLoginMutation,
  useLogoutMutation,
  useUpdateIncidentStatusMutation,
  useUpdateMachineMutation,
} = incidentsApi;
