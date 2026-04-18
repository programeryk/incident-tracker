export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentComment = {
  id: string;
  incidentId: string;
  author?: string | null;
  message: string;
  createdAt: string;
};

export type Incident = {
  id: string;
  title: string;
  description?: string | null;
  machineId: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  occurredAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  downtimeMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
  comments: IncidentComment[];
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  itemCount: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedIncidentsResponse = {
  data: Incident[];
  meta: PaginationMeta;
};

export type IncidentFilters = {
  machineId: string;
  status: IncidentStatus | '';
  priority: IncidentPriority | '';
  fromDate: string;
  toDate: string;
  page: number;
  pageSize: number;
};

export type CreateIncidentRequest = {
  title: string;
  machineId: string;
  priority: IncidentPriority;
  description?: string;
  status?: IncidentStatus;
  occurredAt?: string;
};

export type UpdateIncidentStatusRequest = {
  id: string;
  status: IncidentStatus;
};

export type AddIncidentCommentRequest = {
  incidentId: string;
  message: string;
  author?: string;
};
