"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useLayoutContext } from "../context/LayoutContext";

type MorphStateReturn = {
	morphEnabled: boolean;
	isMorphActive: boolean;
	isWebKit: boolean;
	isSmallScreen: boolean;
	digitFontScale: number;
};

/**
 * A hook that manages the morph animation state.
 * Handles WebKit detection, screen size checks, and context subscription.
 * 
 * NOTE: This hook no longer tracks morphProgress to avoid re-renders on every scroll frame.
 * Components that need progress updates should subscribe to context directly and use
 * imperative updates via refs.
 */
export function useMorphState(): MorphStateReturn {
	const pathname = usePathname();
	const isHomePage = pathname === "/";
	const isBlogPost = pathname.startsWith("/blog/");

	const { subscribe, getSnapshot } = useLayoutContext();

	const [morphEnabled, setMorphEnabled] = useState(false);
	const [isWebKit, setIsWebKit] = useState(false);
	const [isSmallScreen, setIsSmallScreen] = useState(false);
	const [digitFontScale, setDigitFontScaleState] = useState(1);

	// Mirror the digit font scale reactively (set by the home hook, applied pre-paint)
	useLayoutEffect(() => {
		return subscribe((state) => setDigitFontScaleState(state.digitFontScale));
	}, [subscribe]);

	// Detect Safari and all iOS browsers (WebKit engine)
	useEffect(() => {
		if (typeof navigator !== "undefined") {
			const ua = navigator.userAgent || "";
			const nav = navigator as Navigator & { maxTouchPoints?: number };
			const isIOS = /iP(ad|hone|od)/i.test(ua);
			const isMacTouch = /Macintosh/i.test(ua) && (nav.maxTouchPoints ?? 0) > 1;
			const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|Edg|OPR/i.test(ua);
			setIsWebKit(isIOS || isMacTouch || isSafari);
		}
	}, []);

	// Gate morphing on small screens using a media query (Tailwind md breakpoint ~768px)
	useEffect(() => {
		if (typeof window === "undefined") return;
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		const handleChange = () => setIsSmallScreen(mediaQuery.matches);
		handleChange();
		try {
			mediaQuery.addEventListener("change", handleChange);
			return () => mediaQuery.removeEventListener("change", handleChange);
		} catch {
			// Safari < 14 fallback
			mediaQuery.addListener(handleChange);
			return () => mediaQuery.removeListener(handleChange);
		}
	}, []);

	// Subscribe to morph enabled state from context (not progress)
	useEffect(() => {
		if (!isHomePage && !isBlogPost) {
			setMorphEnabled(false);
			return;
		}

		const snapshot = getSnapshot();

		if (snapshot.enabled) {
			setMorphEnabled(true);
		}

		const unsubscribe = subscribe((state) => {
			setMorphEnabled(state.enabled);
			// NOTE: We no longer track state.progress here to avoid re-renders
		});

		return () => {
			unsubscribe();
		};
	}, [isHomePage, isBlogPost, subscribe, getSnapshot]);

	// Morphing runs on all pages that opt in, on every screen size and engine.
	// isSmallScreen is still exposed for the reduced blur strength on small screens.
	const shouldMorph = (isHomePage || isBlogPost) && morphEnabled;
	// isMorphActive is now based on morphEnabled only - progress tracking moved to NavDigit
	const isMorphActive = shouldMorph;

	return {
		morphEnabled,
		isMorphActive,
		isWebKit,
		isSmallScreen,
		digitFontScale,
	};
}
