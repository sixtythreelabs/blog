import { useCallback, useEffect, useState, type RefObject } from "react";
import {
	OUTLINE_SIDE_WIDTH,
	OUTLINE_MIN_WIDTH,
	OUTLINE_SIDE_GAP,
	OUTLINE_ARTICLE_GAP,
	OUTLINE_MIN_VIEWPORT_WIDTH,
	STICKY_TOP_OFFSET,
	slugifyHeading,
	type OutlineItem,
	type OutlinePosition,
} from "../components/Blog/Post/constants";

type UseArticleOutlineOptions = {
	articleRef: RefObject<HTMLElement | null>;
	mounted: boolean;
	isMobileBarActive: boolean;
	isPreloaderDone: boolean;
	isTransitioning: boolean;
	postHref: string;
};

type UseArticleOutlineReturn = {
	outlineItems: OutlineItem[];
	outlineMode: "side";
	outlineWidth: number;
	outlinePosition: OutlinePosition;
	activeHeadingId: string | null;
	isOutlineOpen: boolean;
	handleCloseOutline: () => void;
	handleNavigateFromOutline: () => void;
};

export function useArticleOutline({ articleRef, mounted, isPreloaderDone, isTransitioning, postHref }: UseArticleOutlineOptions): UseArticleOutlineReturn {
	const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
	const [outlineWidth, setOutlineWidth] = useState<number>(OUTLINE_SIDE_WIDTH);
	const [outlinePosition, setOutlinePosition] = useState<OutlinePosition>({ top: 120, left: OUTLINE_SIDE_GAP });
	const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
	const [isOutlineOpen, setIsOutlineOpen] = useState(false);

	// Parse headings from article
	useEffect(() => {
		if (!mounted) return;
		const articleEl = articleRef.current;
		if (!articleEl) return;

		// Only headings inside the article body content (not the post title or footer)
		const contentEl = articleEl.querySelector<HTMLElement>("[data-article-content]") ?? articleEl;
		const headingNodes = Array.from(contentEl.querySelectorAll<HTMLElement>("h1, h2"));
		if (!headingNodes.length) {
			setOutlineItems([]);
			return;
		}

		const occurrences = new Map<string, number>();
		const parsed: OutlineItem[] = headingNodes.map((node) => {
			const level = node.tagName === "H1" ? 1 : 2;
			const rawTitle = node.textContent?.trim() || "Section";
			const baseId = node.id || slugifyHeading(rawTitle) || "section";
			const currentCount = occurrences.get(baseId) || 0;
			occurrences.set(baseId, currentCount + 1);
			const uniqueId = currentCount ? `${baseId}-${currentCount}` : baseId;
			if (!node.id || node.id !== uniqueId) {
				node.id = uniqueId;
			}
			return { id: uniqueId, title: rawTitle, level };
		});
		setOutlineItems(parsed);
		setActiveHeadingId(parsed[0]?.id ?? null);
	}, [mounted, postHref, articleRef]);

	// Track active heading on scroll
	useEffect(() => {
		if (!mounted || !outlineItems.length) return;

		const handleScroll = () => {
			// Must be >= the headings' scroll-margin-top (9rem) so the clicked item
			// is the one that gets highlighted after an anchor jump
			const scrollY = window.scrollY + 160;
			let currentId: string | null = outlineItems[0]?.id ?? null;
			for (const item of outlineItems) {
				const el = document.getElementById(item.id);
				if (!el) continue;
				// Document-relative position (offsetTop is relative to the article wrapper, not the page)
				const docTop = el.getBoundingClientRect().top + window.scrollY;
				if (docTop <= scrollY) {
					currentId = item.id;
				} else {
					break;
				}
			}
			setActiveHeadingId(currentId);
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("resize", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("resize", handleScroll);
		};
	}, [mounted, outlineItems]);

	// Update outline position based on viewport - show on left side when there's space
	useEffect(() => {
		if (!mounted) return;

		const updateMode = () => {
			const articleEl = articleRef.current;
			if (!articleEl) return;
			const rect = articleEl.getBoundingClientRect();
			const articleTop = Math.round(rect.top);
			// Check available space on the LEFT side (accounting for gap to article)
			const availableLeft = rect.left - OUTLINE_SIDE_GAP - OUTLINE_ARTICLE_GAP;
			const safeAvailable = Math.max(0, Math.floor(availableLeft));
			const sideWidth = Math.min(OUTLINE_SIDE_WIDTH, Math.max(OUTLINE_MIN_WIDTH, safeAvailable));
			const canSitBesideArticle = window.innerWidth >= OUTLINE_MIN_VIEWPORT_WIDTH && safeAvailable >= OUTLINE_MIN_WIDTH;

			if (canSitBesideArticle) {
				setOutlineWidth(sideWidth);
				// Position on the left side of the article
				setOutlinePosition({ top: Math.max(STICKY_TOP_OFFSET, articleTop), left: OUTLINE_SIDE_GAP });
				setIsOutlineOpen(true);
			} else {
				// No space - hide the outline on smaller screens
				setIsOutlineOpen(false);
			}
		};

		updateMode();
		window.addEventListener("resize", updateMode);
		return () => {
			window.removeEventListener("resize", updateMode);
		};
	}, [mounted, articleRef]);

	// Close outline during transitions
	useEffect(() => {
		if (isTransitioning) {
			setIsOutlineOpen(false);
		}
	}, [isTransitioning]);

	// Close outline before preloader is done
	useEffect(() => {
		if (!isPreloaderDone) {
			setIsOutlineOpen(false);
		}
	}, [isPreloaderDone]);

	const handleCloseOutline = useCallback(() => {
		setIsOutlineOpen(false);
	}, []);

	// No-op since outline is persistent on left side (no overlay mode)
	const handleNavigateFromOutline = useCallback(() => {}, []);

	return {
		outlineItems,
		outlineMode: "side" as const,
		outlineWidth,
		outlinePosition,
		activeHeadingId,
		isOutlineOpen,
		handleCloseOutline,
		handleNavigateFromOutline,
	};
}
