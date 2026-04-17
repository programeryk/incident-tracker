import { configureStore } from '@reduxjs/toolkit';
import { incidentsApi } from '@/features/incidents/api';
import incidentsReducer from '@/features/incidents/incidentsSlice';

export const store = configureStore({
  reducer: {
    incidents: incidentsReducer,
    [incidentsApi.reducerPath]: incidentsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(incidentsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
