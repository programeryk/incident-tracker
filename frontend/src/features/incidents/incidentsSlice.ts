import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IncidentFilters, IncidentPriority, IncidentStatus } from './types';

const initialState: IncidentFilters = {
  machineId: '',
  area: '',
  line: '',
  assignedToUserId: '',
  activeOnly: false,
  status: '',
  priority: '',
  fromDate: '',
  toDate: '',
  page: 1,
  pageSize: 20,
};

const incidentsSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    setMachineId(state, action: PayloadAction<string>) {
      state.machineId = action.payload;
      state.page = 1;
    },
    setArea(state, action: PayloadAction<string>) {
      state.area = action.payload;
      state.page = 1;
    },
    setLine(state, action: PayloadAction<string>) {
      state.line = action.payload;
      state.page = 1;
    },
    setAssignedToUserId(state, action: PayloadAction<string>) {
      state.assignedToUserId = action.payload;
      state.page = 1;
    },
    setActiveOnly(state, action: PayloadAction<boolean>) {
      state.activeOnly = action.payload;
      state.page = 1;
    },
    setStatus(state, action: PayloadAction<IncidentStatus | ''>) {
      state.status = action.payload;
      state.page = 1;
    },
    setPriority(state, action: PayloadAction<IncidentPriority | ''>) {
      state.priority = action.payload;
      state.page = 1;
    },
    setFromDate(state, action: PayloadAction<string>) {
      state.fromDate = action.payload;
      state.page = 1;
    },
    setToDate(state, action: PayloadAction<string>) {
      state.toDate = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
      state.page = 1;
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const {
  setMachineId,
  setArea,
  setLine,
  setAssignedToUserId,
  setActiveOnly,
  setStatus,
  setPriority,
  setFromDate,
  setToDate,
  setPage,
  setPageSize,
  resetFilters,
} = incidentsSlice.actions;

export default incidentsSlice.reducer;
