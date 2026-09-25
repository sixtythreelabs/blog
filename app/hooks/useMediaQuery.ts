import { useEffect, useState } from "react";

/**
 * Returns true if the given media query matches.
 * Listens for changes and updates the state accordingly.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const mediaQueryList = window.matchMedia(query);
		setMatches(mediaQueryList.matches);

		const handleChange = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		mediaQueryList.addEventListener("change", handleChange);
		return () => mediaQueryList.removeEventListener("change", handleChange);
	}, [query]);

	return matches;
}

