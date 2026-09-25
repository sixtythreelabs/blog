"use client";

import { useLayoutEffect, RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
	gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

type UseHomeScrollOptions = {
	mainRef: RefObject<HTMLDivElement | null>;
	containerRef: RefObject<HTMLDivElement | null>;
	section1Ref: RefObject<HTMLElement | null>;
	section2Ref: RefObject<HTMLElement | null>;
	leftDigitRef: RefObject<HTMLSpanElement | null>;
	rightDigitRef: RefObject<HTMLSpanElement | null>;
	setMorphEnabled: (enabled: boolean) => void;
	setMorphProgress: (progress: number) => void;
};

/**
 * A hook that manages the GSAP ScrollTrigger and ScrollSmoother logic for the home page.
 * Handles the pinned scroll animation between landing and blog sections.
 */
export function useHomeScroll({ mainRef, containerRef, section1Ref, section2Ref, leftDigitRef, rightDigitRef, setMorphEnabled, setMorphProgress }: UseHomeScrollOptions): void {
	// Disable browser scroll restoration and reset scroll position on mount
	// This ensures the animation always starts from a clean state on page refresh
	useLayoutEffect(() => {
		if (typeof window === "undefined") return;

		// Disable browser's automatic scroll restoration
		if ("scrollRestoration" in history) {
			history.scrollRestoration = "manual";
		}

		// Force scroll to top
		window.scrollTo(0, 0);

		return () => {
			// Restore default scroll restoration behavior on unmount
			if ("scrollRestoration" in history) {
				history.scrollRestoration = "auto";
			}
		};
	}, []);

	useLayoutEffect(() => {
		// Reset state on mount
		setMorphEnabled(false);
		setMorphProgress(0);

		if (!containerRef.current || !section1Ref.current || !section2Ref.current) return;

		const ctx = gsap.context(() => {
			const leftDigit = leftDigitRef.current;
			const rightDigit = rightDigitRef.current;
			const digits: HTMLElement[] = [leftDigit, rightDigit].filter((el): el is HTMLElement => el !== null);

			const smoother = ScrollSmoother.create({
				smooth: 2,
				effects: true,
				normalizeScroll: { ignore: ".mobile-nav-portal" },
			});

			// Pre-initialize on first touchstart to prevent glitch
			// The glitch happens because normalizeScroll initializes mid-scroll
			// We pause very briefly then unpause in the same frame
			let initialized = false;
			const handleFirstTouch = () => {
				if (initialized) return;
				initialized = true;

				// Briefly pause and immediately unpause to let normalizeScroll initialize
				// without affecting the current touch gesture
				smoother.paused(true);
				smoother.paused(false);

				window.removeEventListener("touchstart", handleFirstTouch, true);
			};
			window.addEventListener("touchstart", handleFirstTouch, { capture: true, passive: true });

			// Initial setup
			gsap.set(section2Ref.current, { yPercent: 100, zIndex: 10 });
			gsap.set(section1Ref.current, { zIndex: 1 });

			// Only set force3D if we have digits
			if (digits.length > 0) {
				gsap.set(digits, { force3D: false });
			}

			const digitStartScale = 4;
			if (leftDigit) gsap.set(leftDigit, { scale: digitStartScale, transformOrigin: "left top" });
			if (rightDigit) gsap.set(rightDigit, { scale: digitStartScale, transformOrigin: "right top" });

			// Main timeline with scroll trigger
			const isTouch =
				"ontouchstart" in window ||
				navigator.maxTouchPoints > 0 ||
				window.matchMedia("(pointer: coarse)").matches ||
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: containerRef.current,
					start: "top top",
					end: "+=100%",
					scrub: 1,
					pin: true,
					anticipatePin: 1,
					snap: isTouch
						? undefined
						: {
								snapTo: [0, 1],
								duration: { min: 0.2, max: 0.4 },
								delay: 0,
								ease: "power2.inOut",
						  },
					onEnter: () => {
						setMorphEnabled(true);
					},
					onLeave: () => {
						smoother.paused(true);
						setTimeout(() => smoother.paused(false), 200);
						setMorphEnabled(false);
					},
					onEnterBack: () => {
						smoother.paused(false);
						setMorphEnabled(true);
					},
					onLeaveBack: () => {
						setMorphEnabled(false);
					},
				},
			});

			// Update morph progress on timeline update
			tl.eventCallback("onUpdate", () => {
				const progress = tl.progress();
				setMorphProgress(progress);
			});

			// Animate sections and digits
			tl.to(section2Ref.current, { yPercent: 0, ease: "power2.inOut" }).to(section1Ref.current, { scale: 0.8, ease: "power2.inOut" }, 0).to(digits, { scale: 1, ease: "power2.inOut" }, 0);
		}, mainRef);

		return () => {
			ctx.revert();
			setMorphEnabled(false);
			setMorphProgress(0);
		};
	}, [mainRef, containerRef, section1Ref, section2Ref, leftDigitRef, rightDigitRef, setMorphEnabled, setMorphProgress]);
}
