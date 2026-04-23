export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type UserRole = 'OPERATOR' | 'TECHNICIAN' | 'SUPERVISOR' | 'ADMIN';

export type UserSummary = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
};

export type Machine = {
  id: string;
  code: string;
  name: string;
  area: string;
  line?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    incidents: number;
  };
};

export type IncidentEventType =
  | 'CREATED'
  | 'UPDATED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'COMMENTED'
  | 'REOPENED';

export type IncidentComment = {
  id: string;
  incidentId: string;
  author?: string | null;
  user?: UserSummary | null;
  message: string;
  createdAt: string;
};

export type Incident = {
  id: string;
  title: string;
  description?: string | null;
  machineId: string;
  machine?: Machine;
  status: IncidentStatus;
  priority: IncidentPriority;
  occurredAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  downtimeMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
  comments: IncidentComment[];
  createdByUser?: UserSummary | null;
  assignedToUser?: UserSummary | null;
  acknowledgedByUser?: UserSummary | null;
  resolvedByUser?: UserSummary | null;
};

export type IncidentEvent = {
  id: string;
  incidentId: string;
  actorUserId?: string | null;
  actorUser?: UserSummary | null;
  type: IncidentEventType;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
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
  area: string;
  line: string;
  assignedToUserId: string;
  activeOnly: boolean;
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
  assignedToUserId?: string;
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

export type IncidentMetrics = {
  open: number;
  inProgress: number;
  critical: number;
  unresolvedByArea: Record<string, number>;
  averageDowntimeMinutes: number;
};

export type PaginatedMachinesResponse = {
  data: Machine[];
  meta: PaginationMeta;
};

export type AuthResponse = {
  user: UserSummary;
};

export type CreateMachineRequest = {
  code: string;
  name: string;
  area: string;
  line?: string;
  description?: string;
  isActive?: boolean;
};

export type CreateUserRequest = {
  email: string;
  name: string;
  role: UserRole;
  password: string;
  isActive?: boolean;
};
