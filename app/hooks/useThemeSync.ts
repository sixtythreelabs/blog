import { useEffect, useRef } from "react";
import { LIGHT_THEME_COLOR, DARK_THEME_COLOR } from "../components/Blog/Post/constants";
import { setMetaThemeColor } from "../utils/theme";

type UseThemeSyncOptions = {
	isDarkMode: boolean;
	mounted: boolean;
};

export function useThemeSync({ isDarkMode, mounted }: UseThemeSyncOptions): void {
	const themeMetaRef = useRef<HTMLMetaElement | null>(null);
	const initialThemeRef = useRef<{ rootBg: string; bodyBg: string; colorScheme: string } | null>(null);

	useEffect(() => {
		if (!mounted) return;
		const root = document.documentElement;
		const body = document.body;

		if (!initialThemeRef.current) {
			initialThemeRef.current = {
				rootBg: root.style.backgroundColor,
				bodyBg: body.style.backgroundColor,
				colorScheme: root.style.colorScheme,
			};
		}

		let meta = themeMetaRef.current;
		if (!meta) {
			meta = document.querySelector('meta[name="theme-color"]');
			if (!meta) {
				meta = document.createElement("meta");
				meta.setAttribute("name", "theme-color");
				document.head.appendChild(meta);
			}
			themeMetaRef.current = meta;
		}

		const color = isDarkMode ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
		setMetaThemeColor(color, isDarkMode);

		root.style.colorScheme = isDarkMode ? "dark" : "light";
	}, [isDarkMode, mounted]);

	useEffect(() => {
		return () => {
			const initial = initialThemeRef.current;
			if (!initial) return;
			const root = document.documentElement;
			const body = document.body;
			root.style.backgroundColor = initial.rootBg;
			body.style.backgroundColor = initial.bodyBg;
			root.style.colorScheme = initial.colorScheme;
		};
	}, []);
}
