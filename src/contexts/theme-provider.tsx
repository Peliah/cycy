import {
	ThemeProvider as ThemesProvider,
	type ThemeProviderProps,
} from "@wrksz/themes/next";

export async function ThemeProvider(props: ThemeProviderProps) {
	return <ThemesProvider storage="localStorage" {...props} />;
}
