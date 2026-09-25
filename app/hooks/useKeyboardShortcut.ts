import { useEffect } from "react";

type KeyCombo = {
	key: string;
	ctrl?: boolean;
	meta?: boolean;
	shift?: boolean;
	alt?: boolean;
};

type UseKeyboardShortcutOptions = {
	combo: KeyCombo;
	callback: (event: KeyboardEvent) => void;
	enabled?: boolean;
	preventDefault?: boolean;
};

/**
 * Registers a global keyboard shortcut listener.
 */
export function useKeyboardShortcut({
	combo,
	callback,
	enabled = true,
	preventDefault = true,
}: UseKeyboardShortcutOptions): void {
	useEffect(() => {
		if (!enabled) return;

		function handleKeyDown(event: KeyboardEvent) {
			const keyMatches = event.key.toLowerCase() === combo.key.toLowerCase();
			const ctrlMatches = combo.ctrl === undefined || event.ctrlKey === combo.ctrl;
			const metaMatches = combo.meta === undefined || event.metaKey === combo.meta;
			const shiftMatches = combo.shift === undefined || event.shiftKey === combo.shift;
			const altMatches = combo.alt === undefined || event.altKey === combo.alt;

			if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
				if (preventDefault) {
					event.preventDefault();
				}
				callback(event);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [combo, callback, enabled, preventDefault]);
}

/**
 * Registers a simple Escape key listener.
 */
export function useEscapeKey(callback: () => void, enabled = true): void {
	useKeyboardShortcut({
		combo: { key: "Escape" },
		callback,
		enabled,
		preventDefault: false,
	});
}

