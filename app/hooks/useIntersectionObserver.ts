import { useEffect, useState, type RefObject } from "react";

type UseIntersectionObserverOptions = {
	threshold?: number | number[];
	root?: Element | null;
	rootMargin?: string;
	/** Minimum intersection ratio to be considered "in view" (default: 0) */
	minRatio?: number;
};

/**
 * Observes an element and returns whether it is intersecting the viewport.
 */
export function useIntersectionObserver(
	ref: RefObject<Element | null>,
	options: UseIntersectionObserverOptions = {}
): boolean {
	const { threshold = [0, 0.1, 0.25, 0.5, 0.75, 1], root = null, rootMargin = "0px", minRatio = 0.1 } = options;
	const [isIntersecting, setIsIntersecting] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.target === el) {
						setIsIntersecting(entry.isIntersecting && entry.intersectionRatio > minRatio);
					}
				}
			},
			{ threshold, root, rootMargin }
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [ref, threshold, root, rootMargin, minRatio]);

	return isIntersecting;
}

