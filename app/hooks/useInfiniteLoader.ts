import { useEffect, useRef, useState, useCallback } from "react";

type UseInfiniteLoaderOptions = {
	totalItems: number;
	batchSize: number;
	loadDelayMs?: number;
	rootMargin?: string;
};

export function useInfiniteLoader({ totalItems, batchSize, loadDelayMs = 1000, rootMargin = "400px 0px" }: UseInfiniteLoaderOptions) {
	const [visibleCount, setVisibleCount] = useState(Math.min(batchSize, totalItems));
	const [isLoading, setIsLoading] = useState(false);
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const loadTimeoutRef = useRef<number | null>(null);
	const isLoadingRef = useRef(false);

	const hasMore = visibleCount < totalItems;

	const reset = useCallback(() => {
		setVisibleCount(Math.min(batchSize, totalItems));
		setIsLoading(false);
		isLoadingRef.current = false;
		if (loadTimeoutRef.current !== null) {
			window.clearTimeout(loadTimeoutRef.current);
			loadTimeoutRef.current = null;
		}
	}, [batchSize, totalItems]);

	useEffect(() => {
		reset();
	}, [reset]);

	useEffect(() => {
		const target = sentinelRef.current;
		if (!target || !hasMore) return;
		let cancelled = false;

		const clearDelay = () => {
			if (loadTimeoutRef.current !== null) {
				window.clearTimeout(loadTimeoutRef.current);
				loadTimeoutRef.current = null;
			}
		};

		const loadNextBatch = () => {
			if (isLoadingRef.current) return;
			setIsLoading(true);
			isLoadingRef.current = true;

			const delayPromise = new Promise<void>((resolve) => {
				loadTimeoutRef.current = window.setTimeout(() => {
					loadTimeoutRef.current = null;
					resolve();
				}, loadDelayMs);
			});

			// Placeholder for background fetch; runs in parallel with the delay so UX delay never stacks on network time.
			const dataReadyPromise = Promise.resolve();

			Promise.all([delayPromise, dataReadyPromise]).then(() => {
				if (cancelled) return;
				setVisibleCount((prev) => Math.min(prev + batchSize, totalItems));
				setIsLoading(false);
				isLoadingRef.current = false;
			});
		};

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) loadNextBatch();
				}
			},
			{ rootMargin }
		);

		observer.observe(target);
		return () => {
			cancelled = true;
			observer.disconnect();
			clearDelay();
		};
	}, [totalItems, hasMore, batchSize, loadDelayMs, rootMargin]);

	useEffect(() => {
		if (!hasMore) {
			setIsLoading(false);
			isLoadingRef.current = false;
		}
	}, [hasMore]);

	return { visibleCount, isLoading, hasMore, sentinelRef, reset };
}

