import { useEffect, useState, type RefObject } from "react";

type UseOverflowMeasurementOptions = {
	navRef: RefObject<HTMLDivElement | null>;
	measureListRef: RefObject<HTMLUListElement | null>;
	allButtonRef: RefObject<HTMLButtonElement | null>;
	searchRef?: RefObject<HTMLDivElement | null>;
	totalItemCount: number;
};

/**
 * Measures available space in a nav container and calculates how many items can fit.
 * Uses ResizeObserver for accuracy with a window resize fallback.
 */
export function useOverflowMeasurement({
	navRef,
	measureListRef,
	allButtonRef,
	searchRef,
	totalItemCount,
}: UseOverflowMeasurementOptions): number {
	const [visibleCount, setVisibleCount] = useState(totalItemCount);

	useEffect(() => {
		function measureAndSet() {
			const navEl = navRef.current;
			const listEl = measureListRef.current;
			const allButtonEl = allButtonRef.current;
			if (!navEl || !listEl || !allButtonEl) return;

			const navStyles = window.getComputedStyle(navEl);
			const containerGap = parseFloat(navStyles.columnGap || navStyles.gap || "0") || 0;
			const availableForList = Math.max(0, navEl.clientWidth - allButtonEl.offsetWidth - containerGap);

			const listStyles = window.getComputedStyle(listEl);
			const itemGap = parseFloat(listStyles.columnGap || listStyles.gap || "0") || 0;
			const buttons = Array.from(listEl.querySelectorAll("li button")) as HTMLElement[];
			let totalWidth = 0;
			let count = 0;

			for (const button of buttons) {
				const additionalGap = count > 0 ? itemGap : 0;
				const nextWidth = button.offsetWidth + additionalGap;
				if (totalWidth + nextWidth <= availableForList || count === 0) {
					totalWidth += nextWidth;
					count++;
				} else {
					break;
				}
			}

			const safeCount = Math.min(totalItemCount, Math.max(1, count));
			setVisibleCount(safeCount);
		}

		// Initial measure
		measureAndSet();

		// Re-measure on resize using ResizeObserver for accuracy
		const ro = new ResizeObserver(() => {
			measureAndSet();
		});
		if (navRef.current) ro.observe(navRef.current);
		if (searchRef?.current) ro.observe(searchRef.current);
		if (measureListRef.current) ro.observe(measureListRef.current);
		if (allButtonRef.current) ro.observe(allButtonRef.current);

		// Fallback on window resize
		window.addEventListener("resize", measureAndSet);

		return () => {
			ro.disconnect();
			window.removeEventListener("resize", measureAndSet);
		};
	}, [navRef, measureListRef, allButtonRef, searchRef, totalItemCount]);

	return visibleCount;
}

