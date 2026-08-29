declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    query<T = any>(text: string, params?: any[]): Promise<{
      rows: T[];
      rowCount: number;
    }>;
  }
  export interface QueryResultRow {
    [column: string]: any;
  }
}
