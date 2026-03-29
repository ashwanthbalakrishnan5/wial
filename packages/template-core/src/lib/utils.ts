/** Extract up to 2 initials from a full name. */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

/** Certification level color mapping. */
export function getCertColor(level: string): {
  bg: string;
  text: string;
  css: string;
} {
  switch (level) {
    case "CALC":
      return { bg: "rgba(59,130,246,0.15)", text: "#2563eb", css: "cert-calc" };
    case "SALC":
      return { bg: "rgba(22,163,74,0.15)", text: "#15803d", css: "cert-salc" };
    case "MALC":
      return { bg: "rgba(217,119,6,0.15)", text: "#b45309", css: "cert-malc" };
    case "PALC":
      return { bg: "rgba(124,58,237,0.15)", text: "#6d28d9", css: "cert-palc" };
    default:
      return { bg: "rgba(107,101,96,0.15)", text: "#6b6560", css: "" };
  }
}

/** Full human-readable certification label. */
export function getCertLabel(level: string): string {
  switch (level) {
    case "CALC": return "Certified Action Learning Coach";
    case "SALC": return "Senior Action Learning Coach";
    case "MALC": return "Master Action Learning Coach";
    case "PALC": return "Principal Action Learning Coach";
    default: return level;
  }
}

/** Parse hex color to RGB components. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

/** Convert RGB components back to hex string. */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

/** Derive a dark variant of a color (mix toward black). */
export function derivePrimaryDark(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * 0.2, g * 0.2, b * 0.2);
}

/** Derive an rgba light tint string for section backgrounds. */
export function derivePrimaryLight(hex: string, opacity = 0.05): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${opacity})`;
}

/** Derive an rgba light tint of the accent for tag backgrounds. */
export function deriveAccentLight(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},0.15)`;
}

/** Generate a URL-safe slug from coach name and id for uniqueness. */
export function generateCoachSlug(id: string, fullName: string): string {
  const nameSlug = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const idPrefix = id.substring(0, 8);
  return `${nameSlug}-${idPrefix}`;
}
