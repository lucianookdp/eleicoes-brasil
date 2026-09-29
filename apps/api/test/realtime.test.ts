import { EventEmitter } from 'node:events';
import type { ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { RealtimeHub } from '../src/realtime';

function fakeClient() {
  const res = new EventEmitter() as EventEmitter & {
    frames: string[];
    write: (f: string) => boolean;
    end: () => void;
  };
  res.frames = [];
  res.write = (f: string) => {
    res.frames.push(f);
    return true;
  };
  res.end = () => {};
  return res;
}

describe('RealtimeHub', () => {
  it('batches events per round into one de-duplicated frame', () => {
    vi.useFakeTimers();
    const hub = new RealtimeHub(10, 500);
    const a = fakeClient();
    const other = fakeClient();
    hub.add('r-1', a as unknown as ServerResponse);
    hub.add('r-2', other as unknown as ServerResponse);
    const ev = (state: string, n: number) => ({
      type: 'state.updated' as const,
      electionId: 'r-1',
      timestamp: new Date(n).toISOString(),
      state,
      areaKey: state.toLowerCase(),
    });
    hub.broadcast(ev('SP', 1), 1);
    hub.broadcast(ev('SP', 2), 2); // same area: replaces the previous one
    hub.broadcast(ev('MG', 3), 3);
    expect(a.frames).toHaveLength(0);
    vi.advanceTimersByTime(500);
    expect(a.frames).toHaveLength(1);
    const data = JSON.parse(a.frames[0]!.split('data: ')[1]!);
    expect(data.version).toBe(3);
    expect(data.events.map((e: { state: string }) => e.state)).toEqual(['SP', 'MG']);
    expect(other.frames).toHaveLength(0); // other rounds are untouched
    hub.close();
    vi.useRealTimers();
  });

  it('refuses connections above the limit', () => {
    const hub = new RealtimeHub(1);
    expect(hub.add('r', fakeClient() as unknown as ServerResponse)).toBe(true);
    expect(hub.add('r', fakeClient() as unknown as ServerResponse)).toBe(false);
    hub.close();
  });
});
