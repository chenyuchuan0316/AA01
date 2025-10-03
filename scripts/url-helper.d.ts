export declare function assertHttpBase(baseRaw: string | null | undefined): string;
export declare function normalizePath(e2ePathRaw: string | null | undefined): string;
export declare function buildTargetURL(
  baseRaw: string | null | undefined,
  e2ePathRaw: string | null | undefined
): { href: string; base: string; path: string };
export declare function safeWriteJson(filePath: string, data: unknown): void;
