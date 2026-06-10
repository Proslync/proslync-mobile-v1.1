/**
 * Typed registry for demo datasets. Routes and providers register their
 * mock data here instead of importing inline; the Backend cockpit lists
 * every entry and lets you swap variants at runtime.
 *
 * Usage:
 *   register({ id: 'events', description: 'Demo events feed', load: () => MOCK_EVENTS });
 *   const events = get<Event[]>('events');
 */
export interface Dataset<T = unknown> {
  id: string;
  description: string;
  load: () => T;
}

const registry = new Map<string, Dataset>();

export function register<T>(dataset: Dataset<T>): void {
  // Overwrite silently — Fast Refresh re-evaluates dataset modules, which
  // re-triggers registration of the same id. Throwing here breaks HMR.
  registry.set(dataset.id, dataset as Dataset);
}

export function get<T>(id: string): T | undefined {
  return registry.get(id)?.load() as T | undefined;
}

export function has(id: string): boolean {
  return registry.has(id);
}

export function list(): Array<{ id: string; description: string }> {
  return Array.from(registry.values()).map(({ id, description }) => ({ id, description }));
}

export function unregister(id: string): boolean {
  return registry.delete(id);
}
