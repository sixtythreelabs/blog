"use client";

import { useState, useEffect, useCallback } from "react";

interface UseScrollDirectionOptions {
	threshold?: number;
	downThreshold?: number;
	upThreshold?: number;
	disabled?: boolean;
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
	const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");

	const threshold = options.threshold ?? 10;
	const downThreshold = options.downThreshold ?? threshold;
	const upThreshold = options.upThreshold ?? threshold;
	const disabled = options.disabled ?? false;

	useEffect(() => {
		if (disabled) return;

		let lastScrollY = window.scrollY;
		let ticking = false;

		const updateScrollDirection = () => {
			const scrollY = window.scrollY;
			const diff = scrollY - lastScrollY;
			const currentThreshold = diff > 0 ? downThreshold : upThreshold;

			if (Math.abs(diff) < currentThreshold) {
				ticking = false;
				return;
			}
			const direction = scrollY > lastScrollY ? "down" : "up";

			// Always reset to 'up' if we are at the top
			if (scrollY < 10) {
				setScrollDirection("up");
			} else {
				setScrollDirection(direction);
			}

			lastScrollY = scrollY > 0 ? scrollY : 0;
			ticking = false;
		};

		const onScroll = () => {
			if (!ticking) {
				window.requestAnimationFrame(updateScrollDirection);
				ticking = true;
			}
		};

		window.addEventListener("scroll", onScroll);

		return () => window.removeEventListener("scroll", onScroll);
	}, [downThreshold, upThreshold, disabled]);

	const setDirection = useCallback((direction: "up" | "down") => {
		setScrollDirection(direction);
	}, []);

	return { scrollDirection, setScrollDirection: setDirection };
}
