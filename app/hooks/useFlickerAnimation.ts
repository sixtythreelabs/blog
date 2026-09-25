"use client";

import { useState, useEffect, useCallback } from "react";
import { gsap } from "../utils/gsap";
import { hasPreloaderRun } from "../utils/preloader";
import { useLayoutContext } from "../context/LayoutContext";

type FlickerAnimationReturn = {
	isNavVisible: boolean;
	isFlickerPhase: boolean;
};

type FlickerOptions = {
	leftSelector?: string;
	rightSelector?: string;
};

/**
 * A hook that manages the flicker animation for navbar elements.
 * Handles preloader synchronization and GSAP timeline animations.
 */
export function useFlickerAnimation(options: FlickerOptions = {}): FlickerAnimationReturn {
	const { leftSelector = ".flicker-char-left", rightSelector = ".flicker-char-right" } = options;

	const { setFlickerComplete } = useLayoutContext();

	const [isNavVisible, setIsNavVisible] = useState(false);
	const [isFlickerPhase, setIsFlickerPhase] = useState(true);

	const flickerLetters = useCallback((lettersSelector: string) => {
		const targets = gsap.utils.toArray<HTMLElement>(lettersSelector);
		if (!targets.length) {
			return gsap.timeline().set({}, {});
		}

		const timeline = gsap.timeline({ defaults: { ease: "steps(1)" } });
		timeline.set(targets, { autoAlpha: 0 });

		const pickSubset = () => {
			const pool = targets.slice();
			gsap.utils.shuffle(pool);
			const count = Math.max(1, Math.min(pool.length - 1, Math.round(gsap.utils.random(1, pool.length - 1))));
			return pool.slice(0, count);
		};

		// First flicker phase - slower
		for (let i = 0; i < 3; i++) {
			const subset = pickSubset();
			timeline.to(subset, { autoAlpha: 1, duration: 0.055 }, `+=${gsap.utils.random(0.09, 0.14)}`);
			timeline.to(subset, { autoAlpha: 0, duration: 0.055 }, "+=0.06");
		}

		// Second flicker phase - faster
		for (let i = 0; i < 3; i++) {
			const subset = pickSubset();
			timeline.to(subset, { autoAlpha: 1, duration: 0.04 }, `+=${gsap.utils.random(0.05, 0.09)}`);
			timeline.to(subset, { autoAlpha: 0, duration: 0.04 }, "+=0.03");
		}

		// Final reveal
		timeline.to(targets, { autoAlpha: 1, duration: 0.03 }, "+=0.04");
		timeline.to(targets, { autoAlpha: 0, duration: 0.02 }, "+=0.02");
		timeline.to(targets, { autoAlpha: 1, duration: 0.02, stagger: 0.02 });

		return timeline;
	}, []);

	useEffect(() => {
		let leftTl: gsap.core.Timeline | null = null;
		let rightTl: gsap.core.Timeline | null = null;
		let rafId: number | null = null;
		let preloaderHandler: (() => void) | null = null;

		const startFlicker = () => {
			setIsNavVisible(true);
			setIsFlickerPhase(true);

			let completed = 0;
			const onSingleComplete = () => {
				completed += 1;
				if (completed >= 2) {
					setIsFlickerPhase(false);
					// Broadcast so page-level hooks (e.g. the home morph) can react
					setFlickerComplete();
				}
			};

			leftTl = flickerLetters(leftSelector);
			rightTl = flickerLetters(rightSelector);
			leftTl.eventCallback("onComplete", onSingleComplete);
			rightTl.eventCallback("onComplete", onSingleComplete);
		};

		if (hasPreloaderRun()) {
			rafId = requestAnimationFrame(startFlicker);
		} else {
			setIsNavVisible(false);
			preloaderHandler = () => {
				startFlicker();
			};
			window.addEventListener("app:preloader-complete", preloaderHandler, { once: true });
		}

		return () => {
			if (rafId != null) cancelAnimationFrame(rafId);
			leftTl?.kill();
			rightTl?.kill();
			if (preloaderHandler) {
				window.removeEventListener("app:preloader-complete", preloaderHandler);
			}
		};
	}, [leftSelector, rightSelector, flickerLetters, setFlickerComplete]);

	return {
		isNavVisible,
		isFlickerPhase,
	};
}

