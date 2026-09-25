import { useEffect, useRef, useState, useCallback } from "react";

export const INTERACTIVE_SELECTOR = "a, button, [role='button'], [data-morph]";
export const TEXT_SELECTOR = "p, h1, h2, h3, h4, h5, h6, span";
export const DEFAULT_CURSOR_SIZE = "20px";

interface CursorAnimationProps {
	cursorRef: React.RefObject<HTMLDivElement | null>;
	isCursorLockedRef: React.RefObject<boolean>;
	transitionActiveRef: React.RefObject<boolean>;
	enabled: boolean;
}

export function useCursorAnimation({ cursorRef, isCursorLockedRef, transitionActiveRef, enabled }: CursorAnimationProps) {
	const [isVisible, setIsVisible] = useState(false);
	const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

	useEffect(() => {
		if (!enabled) return;
		const cursor = cursorRef.current;
		if (!cursor) return;

		const handleMouseDown = () => {
			if (transitionActiveRef.current) return;
			if (!isCursorLockedRef.current) {
				cursor.style.setProperty("--cursor-scale", "0.9");
			}
		};

		const handleMouseUp = () => {
			if (transitionActiveRef.current) return;
			if (!isCursorLockedRef.current) {
				cursor.style.setProperty("--cursor-scale", "1");
			}
		};

		const handleMouseMove = (e: MouseEvent) => {
			// Make cursor visible on first mouse movement
			if (!isVisible) {
				setIsVisible(true);
			}

			lastPointerRef.current = { x: e.clientX, y: e.clientY };

			if (!isCursorLockedRef.current) {
				cursor.style.setProperty("--cursor-top", `${e.clientY}px`);
				cursor.style.setProperty("--cursor-left", `${e.clientX}px`);
			}
		};

		document.addEventListener("mousedown", handleMouseDown);
		document.addEventListener("mouseup", handleMouseUp);
		document.addEventListener("mousemove", handleMouseMove);

		return () => {
			document.removeEventListener("mousedown", handleMouseDown);
			document.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("mousemove", handleMouseMove);
		};
	}, [cursorRef, isVisible, isCursorLockedRef, transitionActiveRef, enabled]);

	return { isVisible, lastPointerRef };
}

interface ElementHandlersProps {
	cursorRef: React.RefObject<HTMLDivElement | null>;
	isCursorLockedRef: React.RefObject<boolean>;
	transitionActiveRef: React.RefObject<boolean>;
	isScrollingRef: React.RefObject<boolean>;
	isScrubbingRef: React.RefObject<boolean>;
	enabled: boolean;
}

export function useElementHandlers({ cursorRef, isCursorLockedRef, transitionActiveRef, isScrollingRef, isScrubbingRef, enabled }: ElementHandlersProps) {
	const currentHostRef = useRef<HTMLElement | null>(null);

	const unlockAndReset = useCallback(() => {
		const cursor = cursorRef.current;
		if (!cursor) return;

		isCursorLockedRef.current = false;
		cursor.classList.remove("is-locked");
		cursor.style.setProperty("--cursor-width", DEFAULT_CURSOR_SIZE);
		cursor.style.setProperty("--cursor-height", DEFAULT_CURSOR_SIZE);
		cursor.style.setProperty("--cursor-translate-x", "0");
		cursor.style.setProperty("--cursor-translate-y", "0");
		if (currentHostRef.current) {
			currentHostRef.current.style.setProperty("--element-translate-x", "0");
			currentHostRef.current.style.setProperty("--element-translate-y", "0");
			currentHostRef.current = null;
		}
	}, [cursorRef, isCursorLockedRef]);

	useEffect(() => {
		if (!enabled) return;
		const cursor = cursorRef.current;
		if (!cursor) return;

		const setupInteractiveElement = (element: HTMLElement) => {
			// Skip elements that opt-out of morph effect
			if (element.closest("[data-no-morph]")) return () => {};

			let rect: DOMRect | null = null;
			const host = element; // lock to the interactive element

			const handleMouseEnter = () => {
				// Prevent morphing while a scroll interaction is in progress
				if (transitionActiveRef.current || isScrollingRef.current) return;
				isCursorLockedRef.current = true;
				rect = host.getBoundingClientRect();
				currentHostRef.current = host;

				// Check for override attributes
				const overrideWidth = host.dataset.morphWidth;
				const overrideHeight = host.dataset.morphHeight;
				const morphAlign = host.dataset.morphAlign;

				// Calculate cursor width and position
				const cursorWidth = overrideWidth ? parseFloat(overrideWidth) : rect.width;
				let cursorLeft = rect.left + rect.width / 2;

				// Adjust position based on alignment
				if (morphAlign === "right" && overrideWidth) {
					cursorLeft = rect.right - cursorWidth / 2;
				} else if (morphAlign === "left" && overrideWidth) {
					cursorLeft = rect.left + cursorWidth / 2;
				}

				cursor.classList.add("is-locked");
				cursor.style.setProperty("--cursor-top", `${rect.top + rect.height / 2}px`);
				cursor.style.setProperty("--cursor-left", `${cursorLeft}px`);
				cursor.style.setProperty("--cursor-width", overrideWidth ?? `${rect.width}px`);
				cursor.style.setProperty("--cursor-height", overrideHeight ?? `${rect.height}px`);
			};

			const handleMouseMove = (e: MouseEvent) => {
				// Only apply morph movement while locked, not scrolling, and not during transitions
				if (!rect || !isCursorLockedRef.current || isScrollingRef.current || transitionActiveRef.current) return;

				const halfHeight = rect.height / 2;
				const topOffset = (e.clientY - rect.top - halfHeight) / halfHeight;
				const halfWidth = rect.width / 2;
				const leftOffset = (e.clientX - rect.left - halfWidth) / halfWidth;

				cursor.style.setProperty("--cursor-translate-x", `${leftOffset * 3}px`);
				cursor.style.setProperty("--cursor-translate-y", `${topOffset * 3}px`);
				host.style.setProperty("--element-translate-x", `${leftOffset * 6}px`);
				host.style.setProperty("--element-translate-y", `${topOffset * 4}px`);
			};

			const handleMouseLeave = () => {
				// Skip reset while scrubbing - cursor should maintain morph state during drag
				if (isScrubbingRef.current) return;

				isCursorLockedRef.current = false;
				rect = null;
				if (currentHostRef.current === host) {
					currentHostRef.current = null;
				}
				cursor.style.setProperty("--cursor-width", DEFAULT_CURSOR_SIZE);
				cursor.style.setProperty("--cursor-height", DEFAULT_CURSOR_SIZE);
				cursor.style.setProperty("--cursor-translate-x", "0");
				cursor.style.setProperty("--cursor-translate-y", "0");
				host.style.setProperty("--element-translate-x", "0");
				host.style.setProperty("--element-translate-y", "0");

				setTimeout(() => {
					if (!isCursorLockedRef.current) {
						cursor.classList.remove("is-locked");
					}
				}, 100);
			};

			element.addEventListener("mouseenter", handleMouseEnter, { passive: true });
			element.addEventListener("mousemove", handleMouseMove, { passive: true });
			element.addEventListener("mouseleave", handleMouseLeave, { passive: true });

			return () => {
				element.removeEventListener("mouseenter", handleMouseEnter);
				element.removeEventListener("mousemove", handleMouseMove);
				element.removeEventListener("mouseleave", handleMouseLeave);
			};
		};

		const setupTextElement = (element: HTMLElement) => {
			const handleMouseOver = () => {
				if (element.closest("[data-no-morph]")) return;
				if (!isCursorLockedRef.current && !isScrollingRef.current && !transitionActiveRef.current) {
					cursor.style.setProperty("--cursor-width", "2px");
					cursor.style.setProperty("--cursor-height", "1.2em");
				}
			};

			const handleMouseOut = () => {
				if (!isCursorLockedRef.current) {
					cursor.style.setProperty("--cursor-width", DEFAULT_CURSOR_SIZE);
					cursor.style.setProperty("--cursor-height", DEFAULT_CURSOR_SIZE);
				}
			};

			element.addEventListener("mouseover", handleMouseOver, { passive: true });
			element.addEventListener("mouseout", handleMouseOut, { passive: true });

			return () => {
				element.removeEventListener("mouseover", handleMouseOver);
				element.removeEventListener("mouseout", handleMouseOut);
			};
		};

		const interactiveCleanupMap = new Map<HTMLElement, () => void>();
		const textCleanupMap = new Map<HTMLElement, () => void>();

		const registerInteractiveElement = (element: Element) => {
			if (!(element instanceof HTMLElement)) return;
			if (interactiveCleanupMap.has(element)) return;
			const cleanup = setupInteractiveElement(element);
			interactiveCleanupMap.set(element, cleanup);
		};

		const unregisterInteractiveElement = (element: Element) => {
			if (!(element instanceof HTMLElement)) return;
			if (element === currentHostRef.current) {
				unlockAndReset();
			}
			const cleanup = interactiveCleanupMap.get(element);
			if (cleanup) {
				cleanup();
				interactiveCleanupMap.delete(element);
			}
		};

		const registerTextElement = (element: Element) => {
			if (!(element instanceof HTMLElement)) return;
			if (element.closest(INTERACTIVE_SELECTOR)) return;
			if (textCleanupMap.has(element)) return;
			const cleanup = setupTextElement(element);
			textCleanupMap.set(element, cleanup);
		};

		const unregisterTextElement = (element: Element) => {
			if (!(element instanceof HTMLElement)) return;
			const cleanup = textCleanupMap.get(element);
			if (cleanup) {
				cleanup();
				textCleanupMap.delete(element);
			}
		};

		const registerExistingElements = () => {
			document.querySelectorAll(INTERACTIVE_SELECTOR).forEach(registerInteractiveElement);
			document.querySelectorAll(TEXT_SELECTOR).forEach(registerTextElement);
		};

		registerExistingElements();

		const mutationObserver =
			typeof MutationObserver !== "undefined"
				? new MutationObserver((mutations) => {
						mutations.forEach((mutation) => {
							mutation.addedNodes.forEach((node) => {
								if (!(node instanceof HTMLElement)) return;
								if (node.matches(INTERACTIVE_SELECTOR)) {
									registerInteractiveElement(node);
								}
								node.querySelectorAll(INTERACTIVE_SELECTOR).forEach(registerInteractiveElement);
								if (node.matches(TEXT_SELECTOR)) {
									registerTextElement(node);
								}
								node.querySelectorAll(TEXT_SELECTOR).forEach(registerTextElement);
							});

							mutation.removedNodes.forEach((node) => {
								if (!(node instanceof HTMLElement)) return;
								if (node.matches(INTERACTIVE_SELECTOR)) {
									unregisterInteractiveElement(node);
								}
								node.querySelectorAll(INTERACTIVE_SELECTOR).forEach(unregisterInteractiveElement);
								if (node.matches(TEXT_SELECTOR)) {
									unregisterTextElement(node);
								}
								node.querySelectorAll(TEXT_SELECTOR).forEach(unregisterTextElement);
							});
						});
				  })
				: null;

		if (mutationObserver && document.body) {
			mutationObserver.observe(document.body, { childList: true, subtree: true });
		}

		return () => {
			mutationObserver?.disconnect();
			interactiveCleanupMap.forEach((cleanup) => cleanup());
			textCleanupMap.forEach((cleanup) => cleanup());
		};
	}, [cursorRef, isCursorLockedRef, transitionActiveRef, isScrollingRef, isScrubbingRef, enabled]);

	return { unlockAndReset };
}

interface ScrollMonitorProps {
	unlockAndReset: () => void;
	isScrollingRef: React.RefObject<boolean>;
	transitionActiveRef: React.RefObject<boolean>;
	isScrubbingRef: React.RefObject<boolean>;
	lastPointerRef: React.RefObject<{ x: number; y: number } | null>;
	enabled: boolean;
}

export function useScrollMonitor({ unlockAndReset, isScrollingRef, transitionActiveRef, isScrubbingRef, lastPointerRef, enabled }: ScrollMonitorProps) {
	useEffect(() => {
		if (!enabled) return;
		let scrollTimeoutId: number | null = null;
		const SCROLL_IDLE_DELAY_MS = 100;
		let rafId: number | null = null;

		const reapplyHoverStateUnderPointer = () => {
			if (isScrollingRef.current || transitionActiveRef.current || isScrubbingRef.current || !lastPointerRef.current) return;
			const { x, y } = lastPointerRef.current;
			const el = document.elementFromPoint(x, y);
			if (!el) return;
			const interactiveHost = el.closest(INTERACTIVE_SELECTOR) as HTMLElement | null;
			if (interactiveHost) {
				interactiveHost.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false, cancelable: true }));
				return;
			}
			const textTarget = el.closest(TEXT_SELECTOR) as HTMLElement | null;
			if (textTarget && !textTarget.closest(INTERACTIVE_SELECTOR)) {
				textTarget.dispatchEvent(new MouseEvent("mouseover", { bubbles: false, cancelable: true }));
			}
		};

		const handleScroll = () => {
			// Skip scroll handling while scrubbing (scrubbing controls its own cursor state)
			if (isScrubbingRef.current) return;

			// Mark as scrolling and reset any morph state
			if (!isScrollingRef.current) {
				isScrollingRef.current = true;
				// Unlock and reset cursor visuals
				unlockAndReset();
			}

			if (scrollTimeoutId) {
				window.clearTimeout(scrollTimeoutId);
			}
			scrollTimeoutId = window.setTimeout(() => {
				isScrollingRef.current = false;
				reapplyHoverStateUnderPointer();
			}, SCROLL_IDLE_DELAY_MS);
		};

		// Detect smooth scrolling momentum via rAF
		const smoothContent = document.getElementById("smooth-content");
		let lastWindowY = window.scrollY;
		let lastContentTop = smoothContent ? smoothContent.getBoundingClientRect().top : 0;
		let lastMovementAtMs = performance.now();

		const MOMENTUM_IDLE_MS = 220;
		const MOVE_EPSILON = 0.2;

		const sampleMotion = (now: number) => {
			// Skip motion sampling while scrubbing
			if (isScrubbingRef.current) {
				rafId = window.requestAnimationFrame(sampleMotion);
				return;
			}

			const currentWindowY = window.scrollY;
			const currentContentTop = smoothContent ? smoothContent.getBoundingClientRect().top : 0;
			const windowMoved = Math.abs(currentWindowY - lastWindowY) > MOVE_EPSILON;
			const contentMoved = Math.abs(currentContentTop - lastContentTop) > MOVE_EPSILON;

			if (windowMoved || contentMoved) {
				if (!isScrollingRef.current) {
					isScrollingRef.current = true;
					unlockAndReset();
				}
				lastMovementAtMs = now;
			}

			lastWindowY = currentWindowY;
			lastContentTop = currentContentTop;

			// If no movement for a while, consider scrolling finished
			if (isScrollingRef.current && now - lastMovementAtMs > MOMENTUM_IDLE_MS) {
				isScrollingRef.current = false;
				reapplyHoverStateUnderPointer();
			}

			rafId = window.requestAnimationFrame(sampleMotion);
		};

		rafId = window.requestAnimationFrame(sampleMotion);
		window.addEventListener("scroll", handleScroll, { passive: true, capture: true });

		// Transition listeners could also live here or in parent
		const handleTransitionStart = () => {
			transitionActiveRef.current = true;
			unlockAndReset();
		};

		const handleTransitionEnd = () => {
			transitionActiveRef.current = false;
			reapplyHoverStateUnderPointer();
		};

		// Scrub listeners - prevent cursor reset while scrubbing scroll wheel
		const handleScrubStart = () => {
			isScrubbingRef.current = true;
		};

		const handleScrubEnd = () => {
			isScrubbingRef.current = false;
		};

		window.addEventListener("app:transition-start", handleTransitionStart);
		window.addEventListener("app:transition-end", handleTransitionEnd);
		window.addEventListener("app:scrub-start", handleScrubStart);
		window.addEventListener("app:scrub-end", handleScrubEnd);

		return () => {
			window.removeEventListener("scroll", handleScroll, { capture: true } as AddEventListenerOptions);
			window.removeEventListener("app:transition-start", handleTransitionStart);
			window.removeEventListener("app:transition-end", handleTransitionEnd);
			window.removeEventListener("app:scrub-start", handleScrubStart);
			window.removeEventListener("app:scrub-end", handleScrubEnd);
			if (rafId) {
				window.cancelAnimationFrame(rafId);
			}
			if (scrollTimeoutId) {
				window.clearTimeout(scrollTimeoutId);
			}
		};
	}, [unlockAndReset, isScrollingRef, transitionActiveRef, isScrubbingRef, lastPointerRef, enabled]);
}
