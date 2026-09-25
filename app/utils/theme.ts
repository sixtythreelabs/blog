import { LIGHT_THEME_COLOR, DARK_THEME_COLOR } from "../components/Blog/Post/constants";

type SetMetaThemeColorOptions = {
	/** When true, always uses theme color for background (skips desktop inversion) */
	useThemeColorOnly?: boolean;
};

/**
 * Updates the browser's theme color and the document background color.
 * This handles both the <meta name="theme-color"> tag and the body/html background
 * to ensure consistent styling, especially on iOS Safari where the status bar
 * color is derived from these properties.
 *
 * @param color The color string (hex, rgb, etc.) to set
 * @param isDarkMode Whether the current theme is dark mode
 * @param options Optional configuration
 * @param options.useThemeColorOnly When true, skips desktop inversion and always uses theme color
 */
export const setMetaThemeColor = (color: string, isDarkMode: boolean, options?: SetMetaThemeColorOptions) => {
	if (typeof window === "undefined") return;

	const metaThemeColor = document.querySelector('meta[name="theme-color"]');
	if (metaThemeColor) {
		metaThemeColor.setAttribute("content", color);
	}

	const themeColor = isDarkMode ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
	const oppositeColor = isDarkMode ? LIGHT_THEME_COLOR : DARK_THEME_COLOR;

	let bgColor: string;

	if (options?.useThemeColorOnly) {
		// Skip desktop/mobile conditional - always use theme color
		bgColor = themeColor;
	} else {
		// Determine if mobile - check directly to avoid initial state lag
		const isMobile = window.matchMedia("(max-width: 768px)").matches;
		// On desktop, use opposite color for overscroll (body bg)
		// On mobile, use theme color
		bgColor = isMobile ? themeColor : oppositeColor;
	}

	// Also update body/html background to ensure iOS Safari updates the status bar area
	// We rely on CSS transitions (if defined in globals.css) for smooth fading
	document.documentElement.style.backgroundColor = bgColor;
	document.body.style.backgroundColor = bgColor;
};
