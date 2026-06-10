type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  tag?: string;
  message: string;
  args: unknown[];
  timestamp: number;
}

const MAX_ENTRIES = 500;
const buffer: LogEntry[] = [];
const subscribers = new Set<(entry: LogEntry) => void>();

function emit(level: LogLevel, tag: string | undefined, message: string, args: unknown[]): void {
  const entry: LogEntry = { level, tag, message, args, timestamp: Date.now() };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.shift();

  if (__DEV__) {
    const fn =
      level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(tag ? `[${tag}]` : "", message, ...args);
  }
  for (const sub of subscribers) sub(entry);
}

interface TaggedLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

function makeTagged(tag: string | undefined): TaggedLogger {
  return {
    debug: (message, ...args) => emit("debug", tag, message, args),
    info: (message, ...args) => emit("info", tag, message, args),
    warn: (message, ...args) => emit("warn", tag, message, args),
    error: (message, ...args) => emit("error", tag, message, args),
  };
}

const root = makeTagged(undefined);

/**
 * App-wide logger. Replaces scattered `console.log/warn/error` calls so the
 * Backend cockpit can render a rolling log view via `logger.entries()` /
 * `logger.subscribe()`.
 *
 * Use `logger.tagged('chat')` to label a subsystem.
 */
export const logger = {
  ...root,
  tagged: (tag: string): TaggedLogger => makeTagged(tag),
  entries: (): readonly LogEntry[] => buffer,
  subscribe: (fn: (entry: LogEntry) => void): (() => void) => {
    subscribers.add(fn);
    return () => {
      subscribers.delete(fn);
    };
  },
  clear: (): void => {
    buffer.length = 0;
  },
};
