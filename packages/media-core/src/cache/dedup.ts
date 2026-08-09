/**
 * Request Deduplicator for In-Flight Network Requests
 * Collapses concurrent identical requests into a single promise execution.
 */

export class RequestDeduplicator {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  clear(): void {
    this.inFlight.clear();
  }

  get pendingCount(): number {
    return this.inFlight.size;
  }
}
