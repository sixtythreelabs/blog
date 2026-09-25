"use client";

import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";

type UseLongPressOptions = {
	onLongPress: () => void;
	/** Hold duration before the long press fires */
	delay?: number;
	/** Movement (px) that cancels the press, so scrolling doesn't trigger it */
	moveThreshold?: number;
};

/**
 * Long-press detection for touch and mouse. Returns handlers to spread on the
 * target element. Also suppresses the click that follows a long press and the
 * native context menu on touch devices.
 */
export function useLongPress({ onLongPress, delay = 500, moveThreshold = 10 }: UseLongPressOptions) {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const startPointRef = useRef<{ x: number; y: number } | null>(null);
	const didLongPressRef = useRef(false);
	const lastPointerTypeRef = useRef("mouse");
	const onLongPressRef = useRef(onLongPress);

	useEffect(() => {
		onLongPressRef.current = onLongPress;
	}, [onLongPress]);

	const clearTimer = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	useEffect(() => clearTimer, [clearTimer]);

	const onPointerDown = useCallback(
		(event: ReactPointerEvent) => {
			if (event.pointerType === "mouse" && event.button !== 0) return;
			lastPointerTypeRef.current = event.pointerType;
			didLongPressRef.current = false;
			startPointRef.current = { x: event.clientX, y: event.clientY };
			clearTimer();
			timerRef.current = setTimeout(() => {
				timerRef.current = null;
				didLongPressRef.current = true;
				onLongPressRef.current();
			}, delay);
		},
		[clearTimer, delay]
	);

	const onPointerMove = useCallback(
		(event: ReactPointerEvent) => {
			const start = startPointRef.current;
			if (!start || !timerRef.current) return;
			if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > moveThreshold) {
				clearTimer();
			}
		},
		[clearTimer, moveThreshold]
	);

	const onPointerUp = useCallback(() => {
		startPointRef.current = null;
		clearTimer();
	}, [clearTimer]);

	const onPointerCancel = useCallback(() => {
		startPointRef.current = null;
		clearTimer();
	}, [clearTimer]);

	const onPointerLeave = useCallback(() => {
		startPointRef.current = null;
		clearTimer();
	}, [clearTimer]);

	// Runs in the capture phase so the child button's click never fires after a long press.
	const onClickCapture = useCallback((event: ReactMouseEvent) => {
		if (!didLongPressRef.current) return;
		didLongPressRef.current = false;
		event.preventDefault();
		event.stopPropagation();
	}, []);

	const onContextMenu = useCallback((event: ReactMouseEvent) => {
		// Long press on touch shows a native callout/context menu that would
		// interrupt the gesture; right-click with a mouse is left untouched.
		if (lastPointerTypeRef.current !== "mouse") {
			event.preventDefault();
		}
	}, []);

	return {
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
		onPointerLeave,
		onClickCapture,
		onContextMenu,
	};
}
