export const SCRATCH_NATION_FLAGS = [
  { name: "England", key: "gb-eng", src: "/flags/gb-eng.svg" },
  { name: "Argentina", key: "ar", src: "/flags/ar.svg" },
  { name: "Spain", key: "es", src: "/flags/es.svg" },
  { name: "France", key: "fr", src: "/flags/fr.svg" },
  { name: "Brazil", key: "br", src: "/flags/br.svg" },
  { name: "Germany", key: "de", src: "/flags/de.svg" },
  { name: "Portugal", key: "pt", src: "/flags/pt.svg" },
  { name: "Japan", key: "jp", src: "/flags/jp.svg" },
  { name: "Croatia", key: "hr", src: "/flags/hr.svg" },
] as const;

export function normalizeScratchName(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function getNationFlag(nameOrKey: string) {
  const normalized = normalizeScratchName(nameOrKey);
  return (
    SCRATCH_NATION_FLAGS.find(
      (flag) =>
        normalizeScratchName(flag.name) === normalized ||
        normalizeScratchName(flag.key) === normalized
    ) || null
  );
}
