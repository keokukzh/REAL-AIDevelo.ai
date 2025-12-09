declare module 'expr-eval' {
  export class Parser {
    constructor(options?: unknown);
    parse(expression: string): { evaluate(context?: Record<string, unknown>): unknown };
  }
}

