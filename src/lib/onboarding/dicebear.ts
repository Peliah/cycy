export const DICEBEAR_VERSION = "10.x";

export const DICEBEAR_STYLES = [
	{ id: "lorelei", label: "Lorelei" },
	{ id: "notionists", label: "Notionists" },
	{ id: "avataaars", label: "Avataaars" },
	{ id: "bottts", label: "Bottts" },
	{ id: "shapes", label: "Shapes" },
] as const;

export type DicebearStyleId = (typeof DICEBEAR_STYLES)[number]["id"];

export function dicebearUrl(style: string, seed: string) {
	const params = new URLSearchParams({ seed });
	// PNG plays nicer with next/image in the app shell than SVG.
	return `https://api.dicebear.com/${DICEBEAR_VERSION}/${style}/png?${params.toString()}`;
}

export function randomDicebearSeeds(count: number, base?: string) {
	const prefix = base?.trim() || "cycy";
	return Array.from({ length: count }, (_, i) => {
		const salt = Math.random().toString(36).slice(2, 8);
		return `${prefix}-${salt}-${i}`;
	});
}
