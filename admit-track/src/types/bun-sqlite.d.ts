declare module "bun:sqlite" {
  export class Database {
    constructor(path?: string);
    exec(sql: string): void;
    prepare<T = unknown>(sql: string): { get(...params: unknown[]): T; run(...params: unknown[]): RunResult; all(...params: unknown[]): T[] };
    query<T>(sql: string): { all(...params: unknown[]): T[]; run(...params: unknown[]): RunResult; get(...params: unknown[]): T | undefined };
  }
  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }
}