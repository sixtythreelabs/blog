import { useEffect, type RefObject } from "react";

/**
 * Calls a handler when a click or touch occurs outside the referenced element.
 */
export function useClickOutside<T extends HTMLElement>(
	ref: RefObject<T | null>,
	handler: () => void,
	enabled = true
): void {
	useEffect(() => {
		if (!enabled) return;

		function handleEvent(event: MouseEvent | TouchEvent) {
			if (!ref.current) return;
			if (!ref.current.contains(event.target as Node)) {
				handler();
			}
		}

		document.addEventListener("mousedown", handleEvent);
		document.addEventListener("touchstart", handleEvent);

		return () => {
			document.removeEventListener("mousedown", handleEvent);
			document.removeEventListener("touchstart", handleEvent);
		};
	}, [ref, handler, enabled]);
}

