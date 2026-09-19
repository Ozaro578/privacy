/** Aktuelle Zeit für Server Components und Server Actions (pro Request ausgewertet). In Client-Komponenten stattdessen Effekte oder Event-Handler verwenden. */
export const nowMs = (): number => Date.now();
export const nowIso = (): string => new Date().toISOString();
