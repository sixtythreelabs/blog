import { useState, useEffect, useRef } from "react";

/**
 * Hook to render a ReactNode (containing an SVG) into a hidden container,
 * serialize it to an SVG string, and return a Blob URL that can be used in an <img> tag.
 *
 * @param content The ReactNode content to render (should contain an <svg>).
 * @param dependencies Optional array of dependencies to trigger re-renders.
 * @returns An object containing the Blob URL and a ref to attach to the hidden container.
 */
export function useSvgToImage<T extends HTMLElement>(content: React.ReactNode, dependencies: any[] = []) {
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const hiddenRef = useRef<T>(null);
	const lastRenderRef = useRef<{ html: string }>({ html: "" });
	const urlRef = useRef<string | null>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (!hiddenRef.current) return;

			const currentHtml = hiddenRef.current.innerHTML;

			// Optimization: If the HTML content hasn't changed, skip processing.
			if (currentHtml === lastRenderRef.current.html) {
				return;
			}

			const svgElement = hiddenRef.current.querySelector("svg");
			if (!svgElement) return;

			// Update the cache
			lastRenderRef.current = { html: currentHtml };

			const svgString = new XMLSerializer().serializeToString(svgElement);
			const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
			const url = URL.createObjectURL(blob);

			// Revoke the previous URL before swapping in the new one
			if (urlRef.current) {
				URL.revokeObjectURL(urlRef.current);
			}
			urlRef.current = url;

			setImageUrl(url);
		}, 10);

		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [content, ...dependencies]);

	// Revoke the final URL on unmount only (re-runs swap URLs inline above)
	useEffect(() => {
		return () => {
			if (urlRef.current) {
				URL.revokeObjectURL(urlRef.current);
				urlRef.current = null;
			}
		};
	}, []);

	return { imageUrl, hiddenRef };
}
