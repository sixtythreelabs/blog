"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "../utils/gsap";
import { useLayoutContext } from "../context/LayoutContext";
import { useMediaQuery } from "./useMediaQuery";

/**
 * Fixed scale for the navbar digits - the large hero text size.
 * The digits stay at this scale permanently; morphs happen in place
 * (no scale animation).
 */
const DIGIT_START_SCALE = 4;
/** Same, but for small screens: small enough that an expanded word never
 * overlaps the opposite digit, large enough to keep the hero look */
const DIGIT_START_SCALE_SMALL = 3;
/** How long a single word <-> digit morph takes (seconds) */
const MORPH_DURATION = 1.2;
/** Random idle range (seconds) between morphs, per digit */
const IDLE_MIN = 2;
const IDLE_MAX = 6;
/** Pause after the flicker finishes before the synced intro morph starts */
const INTRO_DELAY = 0.3;
/** Breakpoint under which only one digit may be in word form at a time */
const SMALL_SCREEN_QUERY = "(max-width: 768px)";

type DigitSide = "left" | "right";

/**
 * Drives the home page navbar morph animation.
 *
 * Once the flicker phase completes, a synchronized intro morph plays
 * (word -> digit on both digits), then the digits keep morphing at random
 * intervals for as long as the user is on the page:
 * - wide screens: both digits morph independently
 * - small screens: a sequencer guarantees only one digit is ever in word
 *   form at a time (there is not enough room for both)
 */
export function useHomeMorph(): void {
	const { setMorphEnabled, setDigitProgress, setDigitFontScale, subscribe, getSnapshot } = useLayoutContext();
	const isSmallScreen = useMediaQuery(SMALL_SCREEN_QUERY);

	const [introDone, setIntroDone] = useState(false);
	const introRef = useRef<gsap.core.Timeline | null>(null);
	const loopsRef = useRef<gsap.core.Animation[]>([]);

	// Disable browser scroll restoration and reset scroll position on mount
	// This ensures the page always starts from a clean state on refresh
	useLayoutEffect(() => {
		if (typeof window === "undefined") return;

		if ("scrollRestoration" in history) {
			history.scrollRestoration = "manual";
		}

		window.scrollTo(0, 0);

		return () => {
			if ("scrollRestoration" in history) {
				history.scrollRestoration = "auto";
			}
		};
	}, []);

	// The giant digit size is baked into font-size (via context) instead of a
	// transform scale, so the morph's SVG filters rasterize at native
	// resolution - fixes the pixelated rendering on WebKit. Reset on unmount
	// so other pages render at size 1.
	useLayoutEffect(() => {
		setDigitFontScale(isSmallScreen ? DIGIT_START_SCALE_SMALL : DIGIT_START_SCALE);
		return () => setDigitFontScale(1);
	}, [isSmallScreen, setDigitFontScale]);

	// Setup + intro: runs once per mount
	useLayoutEffect(() => {
		const playIntro = () => {
			if (introRef.current) return;

			setMorphEnabled(true);

			// Synced intro: both digits morph word -> digit together
			const proxy = { p: 0 };
			const tl = gsap.timeline({
				delay: INTRO_DELAY,
				onComplete: () => {
					setDigitProgress("left", 1);
					setDigitProgress("right", 1);
					setIntroDone(true);
				},
			});
			tl.to(proxy, { p: 1, duration: MORPH_DURATION, ease: "power2.inOut" }, 0);
			tl.eventCallback("onUpdate", () => {
				setDigitProgress("left", proxy.p);
				setDigitProgress("right", proxy.p);
			});
			introRef.current = tl;
		};

		// On a fresh load the flicker is still running - wait for its completion
		// signal. On revisits it has already fired, so start immediately.
		if (getSnapshot().flickerComplete) playIntro();

		const unsubscribe = subscribe((state) => {
			if (state.flickerComplete) playIntro();
		});

		return () => {
			unsubscribe();
			introRef.current?.kill();
			introRef.current = null;
			for (const animation of loopsRef.current) animation.kill();
			loopsRef.current = [];
			setMorphEnabled(false);
			setDigitProgress("left", 0);
			setDigitProgress("right", 0);
		};
	}, [setMorphEnabled, setDigitProgress, subscribe, getSnapshot]);

	// Loops: start once the intro is done, restart when the screen size
	// category changes (e.g. resizing across the breakpoint). The intro
	// itself is not replayed on breakpoint crossings.
	useLayoutEffect(() => {
		if (!introDone) return;

		// Re-assert in case another page's unmount cleanup disabled the morph
		// between the intro and this point
		setMorphEnabled(true);

		const leftProgress = getSnapshot().leftProgress;
		const rightProgress = getSnapshot().rightProgress;
		let leftIsDigit = leftProgress >= 0.5;
		let rightIsDigit = rightProgress >= 0.5;

		// Small screens can't fit two words - enforce the invariant when
		// entering sequenced mode by snapping the word that is closer to its
		// digit form back to a digit
		if (isSmallScreen && !leftIsDigit && !rightIsDigit) {
			if (leftProgress >= rightProgress) {
				leftIsDigit = true;
			} else {
				rightIsDigit = true;
			}
		}

		// Snap both sides to their rest values so the running proxies and the
		// rendered morph state start in sync
		setDigitProgress("left", leftIsDigit ? 1 : 0);
		setDigitProgress("right", rightIsDigit ? 1 : 0);

		// Independent random loop for one digit (wide screens)
		const startLoop = (side: DigitSide, showDigit: boolean) => {
			const proxy = { p: showDigit ? 1 : 0 };

			const morph = () => {
				showDigit = !showDigit;
				const tween = gsap.to(proxy, {
					p: showDigit ? 1 : 0,
					duration: MORPH_DURATION,
					ease: "power2.inOut",
					delay: gsap.utils.random(IDLE_MIN, IDLE_MAX),
					onUpdate: () => setDigitProgress(side, proxy.p),
					onComplete: morph,
				});
				loopsRef.current.push(tween);
			};

			morph();
		};

		// Single sequencer for small screens: alternates a randomly chosen
		// side between word and digit, so only one word is ever on screen.
		// The side never repeats twice in a row, so both digits keep showing
		// up even though the timing stays random.
		const startSequencer = (wordSide: DigitSide | null) => {
			let previousSide: DigitSide | null = null;

			const step = () => {
				let side: DigitSide;
				let toDigit: boolean;

				if (wordSide) {
					// The word must leave before a new one may appear
					side = wordSide;
					toDigit = true;
					wordSide = null;
				} else {
					side = previousSide === "left" ? "right" : previousSide === "right" ? "left" : Math.random() < 0.5 ? "left" : "right";
					toDigit = false;
					wordSide = side;
				}

				previousSide = side;

				const proxy = { p: toDigit ? 0 : 1 };
				const tween = gsap.to(proxy, {
					p: toDigit ? 1 : 0,
					duration: MORPH_DURATION,
					ease: "power2.inOut",
					delay: gsap.utils.random(IDLE_MIN, IDLE_MAX),
					onUpdate: () => setDigitProgress(side, proxy.p),
					onComplete: step,
				});
				loopsRef.current.push(tween);
			};

			step();
		};

		if (isSmallScreen) {
			startSequencer(!leftIsDigit ? "left" : !rightIsDigit ? "right" : null);
		} else {
			startLoop("left", leftIsDigit);
			startLoop("right", rightIsDigit);
		}

		return () => {
			for (const animation of loopsRef.current) animation.kill();
			loopsRef.current = [];
		};
	}, [introDone, isSmallScreen, setMorphEnabled, setDigitProgress, getSnapshot]);
}
