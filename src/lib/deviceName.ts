const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/Android/, "Android"],
  [/iPhone|iPad|iPod/, "iOS"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

const match = (userAgent: string, table: [RegExp, string][]) =>
  table.find(([pattern]) => pattern.test(userAgent))?.[1];

/**
 * A human label like "Firefox on Linux" for the sessions list. Order matters in
 * both tables: Edge and Opera also claim to be Chrome, and Chrome claims Safari.
 */
export const describeDevice = (userAgent?: string | null): string | null => {
  if (!userAgent) {
    return null;
  }

  const browser = match(userAgent, BROWSERS);
  const system = match(userAgent, SYSTEMS);

  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system ?? null;
};
