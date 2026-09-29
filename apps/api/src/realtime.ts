import type { ServerResponse } from 'node:http';
import type { RealtimeEvent } from '@eleicoes/election-core';

/** Fan-out of worker events to Server-Sent Events clients, grouped by election round. */
export class RealtimeHub {
  private clients = new Map<string, Set<ServerResponse>>();
  private heartbeat: NodeJS.Timeout;

  constructor(private readonly maxClients = 10_000) {
    // Comments keep proxies from closing idle connections.
    this.heartbeat = setInterval(() => this.writeAll(': ping\n\n'), 25_000);
    this.heartbeat.unref();
  }

  get size() {
    let n = 0;
    for (const set of this.clients.values()) n += set.size;
    return n;
  }

  add(round: string, res: ServerResponse): boolean {
    if (this.size >= this.maxClients) return false;
    let set = this.clients.get(round);
    if (!set) {
      set = new Set();
      this.clients.set(round, set);
    }
    set.add(res);
    res.on('close', () => set.delete(res));
    return true;
  }

  broadcast(event: RealtimeEvent) {
    const set = this.clients.get(event.electionId);
    if (!set) return;
    const frame = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const res of set) res.write(frame);
  }

  close() {
    clearInterval(this.heartbeat);
    for (const set of this.clients.values()) for (const res of set) res.end();
    this.clients.clear();
  }

  private writeAll(frame: string) {
    for (const set of this.clients.values()) for (const res of set) res.write(frame);
  }
}
