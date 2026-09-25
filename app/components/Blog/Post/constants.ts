import { Asterisk, Terminal, Waypoints } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type OutlineItem = {
	id: string;
	title: string;
	level: 1 | 2;
};

export type OutlinePosition = {
	top?: number;
	bottom?: number;
	left?: number | string;
	right?: number;
	translateX?: string;
};

export type SocialLink = {
	label: string;
	href: string;
	Icon: LucideIcon;
};

export const CONTROL_BUTTON_BASE = "items-center justify-center h-8 px-2.5 font-mono text-[0.6rem] uppercase tracking-tight border transition-colors duration-200";
export const LIGHT_THEME_COLOR = "#fafafa";
export const DARK_THEME_COLOR = "oklch(0.035 0.005 285)";
export const OUTLINE_SIDE_WIDTH = 240;
export const OUTLINE_MIN_WIDTH = 190;
export const OUTLINE_SIDE_GAP = 12;
export const OUTLINE_ARTICLE_GAP = 24;
export const OUTLINE_MIN_VIEWPORT_WIDTH = 1400;
export const STICKY_TOP_OFFSET = 113;
export const BLOG_FONT_FAMILY = "var(--font-fixel-text), var(--font-sans), serif";

export const THEME_PRESETS = {
	light: {
		main: "bg-foreground text-black",
		articleSurface: "border-light-gray/15 bg-[#ffffff]",
		gridLine: "border-light-gray/10",
		heading: "text-black",
		muted: "text-light-gray",
		intro: "text-light-gray",
		content: "text-black/80 [&>:is(h1,h2,h3,h4,h5,h6)]:text-black",
		linkButton: "border-black/80 text-white bg-black/90",
		toggleButton: "border-light-gray/20 bg-black/5 text-black",
		copyVariant: "light" as const,
		outlineBorder: "border-light-gray/15",
		outlineText: "text-black/80",
		ditherWaveColor: [0.8, 0.8, 0.8] as [number, number, number],
		ditherBlendMode: "mix-blend-difference",
		sectionBorder: "border-light-gray/40",
		sectionBg: "bg-white/50",
	},
	dark: {
		main: "bg-background text-off-white",
		articleSurface: "border-light-gray/30 bg-white/5",
		gridLine: "border-light-gray/25",
		heading: "text-off-white",
		muted: "text-off-white/65",
		intro: "text-off-white/80",
		content: "text-off-white/90 [&>:is(h1,h2,h3,h4,h5,h6)]:text-off-white",
		linkButton: "border-white text-black bg-white/90",
		toggleButton: "border-white/30 bg-white/10 text-off-white",
		copyVariant: "dark" as const,
		outlineBorder: "border-light-gray/30",
		outlineText: "text-off-white/85",
		ditherWaveColor: [0.65, 0.65, 0.65] as [number, number, number],
		ditherBlendMode: "mix-blend-screen",
		sectionBorder: "border-light-gray/40",
		sectionBg: "bg-black/50",
	},
} as const;

export type ThemePreset = (typeof THEME_PRESETS)[keyof typeof THEME_PRESETS];

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const getSocialLinks = (): SocialLink[] => {
	const links: SocialLink[] = [];

	if (process.env.NEXT_PUBLIC_X_URL) {
		links.push({ label: "Twitter", href: process.env.NEXT_PUBLIC_X_URL, Icon: Asterisk });
	}

	if (process.env.NEXT_PUBLIC_LINKEDIN_URL) {
		links.push({ label: "LinkedIn", href: process.env.NEXT_PUBLIC_LINKEDIN_URL, Icon: Waypoints });
	}

	if (process.env.NEXT_PUBLIC_GITHUB_URL) {
		links.push({ label: "GitHub", href: process.env.NEXT_PUBLIC_GITHUB_URL, Icon: Terminal });
	}

	return links;
};

export const SOCIAL_LINKS = getSocialLinks();

export const slugifyHeading = (value: string): string => {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
};
