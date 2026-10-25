export const TIMING_KEY = "marcus:evaluation-time:v1";
export const routes = [
  "/",
  "/learn",
  "/play",
  "/review",
  "/board",
  "/evaluation",
] as const;
export type TimedRoute = (typeof routes)[number];
export type TimingSegment = {
  id: string;
  startedAt: number;
  endedAt: number;
  activeMs: number;
  byRoute: Partial<Record<TimedRoute, number>>;
};
export type TimingData = { version: 1; segments: TimingSegment[] };
export const freshTiming = (): TimingData => ({ version: 1, segments: [] });
export function measuredTick(
  segment: TimingSegment,
  previousAt: number,
  at: number,
  previousRoute: string,
  route: string,
): TimingSegment {
  const delta = at - previousAt;
  if (
    !Number.isFinite(at) ||
    delta <= 0 ||
    at < segment.endedAt ||
    at < segment.startedAt ||
    delta > 10_000 ||
    route !== previousRoute ||
    !routes.includes(route as TimedRoute)
  )
    return segment;
  const duration = Math.min(delta, 4 * 60 * 60 * 1000 - segment.activeMs);
  if (duration <= 0) return segment;
  return {
    ...segment,
    endedAt: at,
    activeMs: segment.activeMs + duration,
    byRoute: {
      ...segment.byRoute,
      [route]: (segment.byRoute[route as TimedRoute] ?? 0) + duration,
    },
  };
}
export function decodeTiming(raw: string | null): TimingData | null {
  if (!raw || raw.length > 200_000) return null;
  try {
    const value = JSON.parse(raw) as TimingData;
    if (
      value.version !== 1 ||
      !Array.isArray(value.segments) ||
      value.segments.length > 200
    )
      return null;
    const ids = new Set<string>();
    for (const segment of value.segments) {
      if (
        typeof segment.id !== "string" ||
        ids.has(segment.id) ||
        !Number.isFinite(segment.startedAt) ||
        segment.startedAt < 0 ||
        !Number.isFinite(segment.endedAt) ||
        segment.endedAt < segment.startedAt ||
        !Number.isFinite(segment.activeMs) ||
        segment.activeMs < 0 ||
        segment.activeMs > 4 * 60 * 60 * 1000 ||
        !segment.byRoute ||
        typeof segment.byRoute !== "object"
      )
        return null;
      ids.add(segment.id);
      let sum = 0;
      for (const [route, ms] of Object.entries(segment.byRoute)) {
        if (
          !routes.includes(route as TimedRoute) ||
          typeof ms !== "number" ||
          !Number.isFinite(ms) ||
          ms < 0
        )
          return null;
        sum += ms;
      }
      if (
        sum !== segment.activeMs ||
        segment.activeMs > segment.endedAt - segment.startedAt
      )
        return null;
    }
    return value;
  } catch {
    return null;
  }
}
