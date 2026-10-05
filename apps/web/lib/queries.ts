'use client';

import type {
  ActivityEventDTO,
  CityDetailDTO,
  CityRowDTO,
  CompareDTO,
  OfficeStatesDTO,
  OperationsDTO,
  OverviewDTO,
  Paginated,
  ResultDTO,
  SearchHitDTO,
  SeriesDTO,
  StateDetailDTO,
  TimelineAtDTO,
  TimelineDTO,
} from '@eleicoes/election-core';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from './api';

/** Every key starts with the round slug so one realtime event can refresh a whole round. */
const base = (round: string) => `/api/elections/${round}`;

export const useOverview = (round: string, initialData?: OverviewDTO | null) =>
  useQuery({
    queryKey: [round, 'overview'],
    queryFn: () => api<OverviewDTO>(`${base(round)}/overview`),
    initialData: initialData ?? undefined,
  });

export const useStateDetail = (round: string, uf: string, initialData?: StateDetailDTO | null) =>
  useQuery({
    queryKey: [round, 'state', uf],
    queryFn: () => api<StateDetailDTO>(`${base(round)}/states/${uf}`),
    initialData: initialData ?? undefined,
  });

export const useResult = (round: string, area: string, office: string | undefined, limit?: number) =>
  useQuery({
    queryKey: [round, 'result', area, office, limit],
    queryFn: () =>
      api<ResultDTO>(
        `${base(round)}/results?area=${area}${office ? `&office=${office}` : ''}${limit ? `&limit=${limit}` : ''}`,
      ),
    enabled: !!office,
    placeholderData: keepPreviousData,
    retry: (n, err) => (err as { status?: number }).status !== 404 && n < 2,
  });

/** City list of a state, loaded 30 at a time ("Mostrar mais"). */
export const useCities = (round: string, uf: string, params: { q: string; sort: string }) =>
  useInfiniteQuery({
    queryKey: [round, 'cities', uf, params],
    queryFn: ({ pageParam }) =>
      api<Paginated<CityRowDTO>>(
        `${base(round)}/states/${uf}/cities?page=${pageParam}&sort=${params.sort}${params.q ? `&q=${encodeURIComponent(params.q)}` : ''}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });

export const useCity = (round: string, uf: string, city: string, initialData?: CityDetailDTO | null) =>
  useQuery({
    queryKey: [round, 'city', uf, city],
    queryFn: () => api<CityDetailDTO>(`${base(round)}/states/${uf}/cities/${city}`),
    initialData: initialData ?? undefined,
  });

export const useSeries = (round: string, office: string | undefined, area: string) =>
  useQuery({
    queryKey: [round, 'series', office, area],
    queryFn: () => api<SeriesDTO>(`${base(round)}/series?office=${office}&area=${area}`),
    enabled: !!office,
    placeholderData: keepPreviousData,
  });

export const useOperations = (round: string) =>
  useQuery({
    queryKey: [round, 'operations'],
    queryFn: () => api<OperationsDTO>(`${base(round)}/operations`),
    refetchInterval: 15_000,
  });

export const useEvents = (round: string, limit = 30) =>
  useQuery({
    queryKey: [round, 'events', limit],
    queryFn: () => api<ActivityEventDTO[]>(`${base(round)}/events?limit=${limit}`),
  });

export const useTimeline = (round: string) =>
  useQuery({ queryKey: [round, 'timeline'], queryFn: () => api<TimelineDTO>(`${base(round)}/timeline`) });

export const useTimelineAt = (round: string, at: string | null) =>
  useQuery({
    queryKey: ['history', round, 'at', at],
    queryFn: () => api<TimelineAtDTO>(`${base(round)}/timeline?at=${encodeURIComponent(at!)}`),
    enabled: !!at,
    placeholderData: keepPreviousData,
    staleTime: Number.POSITIVE_INFINITY,
  });

export const useOfficeStates = (round: string, office: string | undefined) =>
  useQuery({
    queryKey: [round, 'office-states', office],
    queryFn: () => api<OfficeStatesDTO>(`${base(round)}/offices/${office}/states`),
    enabled: !!office,
    placeholderData: keepPreviousData,
  });

export const useSearch = (round: string, q: string) =>
  useQuery({
    queryKey: ['search', round, q],
    queryFn: () => api<SearchHitDTO[]>(`${base(round)}/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useCompare = (round: string, states: string[], office: string | undefined) =>
  useQuery({
    queryKey: [round, 'compare', states.join(','), office],
    queryFn: () =>
      api<CompareDTO>(
        `${base(round)}/compare?states=${states.join(',')}${office ? `&office=${office}` : ''}`,
      ),
    enabled: states.length > 0,
    placeholderData: keepPreviousData,
  });
