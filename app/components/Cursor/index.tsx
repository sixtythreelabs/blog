"use client";

import { useEffect, useRef, useState } from "react";
import { useTouchDevice } from "../../hooks/useTouchDevice";
import { useCursorAnimation, useElementHandlers, useScrollMonitor } from "./hooks";

export default function Cursor() {
	const isTouchDevice = useTouchDevice();
	const cursorRef = useRef<HTMLDivElement>(null);

	// Shared Refs
	const isCursorLockedRef = useRef(false);
	const isScrollingRef = useRef(false);
	const transitionActiveRef = useRef(false);
	const isScrubbingRef = useRef(false);

	// Visual State
	const [isTransitionActive, setIsTransitionActive] = useState(false);

	// Hooks
	const enabled = !isTouchDevice;

	const { isVisible, lastPointerRef } = useCursorAnimation({
		cursorRef,
		isCursorLockedRef,
		transitionActiveRef,
		enabled,
	});

	const { unlockAndReset } = useElementHandlers({
		cursorRef,
		isCursorLockedRef,
		transitionActiveRef,
		isScrollingRef,
		isScrubbingRef,
		enabled,
	});

	useScrollMonitor({
		unlockAndReset,
		isScrollingRef,
		transitionActiveRef,
		isScrubbingRef,
		lastPointerRef,
		enabled,
	});

	// Force-hide the native cursor while the custom cursor is active
	useEffect(() => {
		if (!enabled) return;

		document.documentElement.classList.add("cursor-hidden");
		return () => {
			document.documentElement.classList.remove("cursor-hidden");
		};
	}, [enabled]);

	// Handle visual transition state
	useEffect(() => {
		const handleStart = () => setIsTransitionActive(true);
		const handleEnd = () => setIsTransitionActive(false);

		window.addEventListener("app:transition-start", handleStart);
		window.addEventListener("app:transition-end", handleEnd);
		return () => {
			window.removeEventListener("app:transition-start", handleStart);
			window.removeEventListener("app:transition-end", handleEnd);
		};
	}, []);

	// Don't render cursor on touch devices
	if (isTouchDevice) {
		return null;
	}

	return <div ref={cursorRef} className="cursor" style={{ opacity: isVisible && !isTransitionActive ? 1 : 0 }} />;
}
