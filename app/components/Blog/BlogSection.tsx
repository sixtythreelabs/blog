"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import CategoriesNav from "./CategoriesNav";
import Articles from "./Articles";
import type { ArticleItem, CategoryOption } from "../../types/posts";
import { useIntersectionObserver, useMediaQuery } from "../../hooks";
import { setMetaThemeColor } from "../../utils/theme";

type BlogSectionProps = {
	categories: CategoryOption[];
	limit?: number;
	showViewAllButton?: boolean;
	header?: React.ReactNode;
	items?: ArticleItem[];
	onLayoutChange?: () => void;
	showSearch?: boolean;
	/** When true, skips desktop theme inversion for overscroll background */
	useThemeColorOnly?: boolean;
	/** When true, the mobile menu will not collapse on scroll */
	disableCollapse?: boolean;
	/** When true, shows minimal UI: hides category/view toggles, shows "All Posts" label */
	minimalMode?: boolean;
};

const BlogSection = forwardRef<HTMLElement, BlogSectionProps>(
	({ categories, limit = 6, showViewAllButton = true, header, items = [], onLayoutChange, showSearch = true, useThemeColorOnly = false, disableCollapse = false, minimalMode = false }, ref) => {
		const [activeCategory, setActiveCategory] = useState("all");
		const [viewMode, setViewMode] = useState<"grid" | "list" | "timeline">("grid");
		const [searchQuery, setSearchQuery] = useState("");
		const sectionRef = useRef<HTMLElement | null>(null);
		const isSmallScreen = useMediaQuery("(max-width: 1023px)");

		useEffect(() => {
			if (isSmallScreen) {
				setViewMode("list");
			} else {
				setViewMode("grid");
			}
		}, [isSmallScreen]);

		// Merge forwarded ref with local ref
		const assignRefs = useCallback(
			(el: HTMLElement | null) => {
				sectionRef.current = el;
				if (typeof ref === "function") {
					ref(el);
				} else if (ref && typeof ref === "object") {
					(ref as React.MutableRefObject<HTMLElement | null>).current = el;
				}
			},
			[ref]
		);

		// Use custom hook for intersection observation
		const isInView = useIntersectionObserver(sectionRef, {
			threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
			minRatio: 0.1,
		});

		useEffect(() => {
			onLayoutChange?.();
		}, [viewMode, onLayoutChange]);

		useEffect(() => {
			const el = sectionRef.current;
			if (!el) return;

			const themeOptions = useThemeColorOnly ? { useThemeColorOnly: true } : undefined;

			const observer = new IntersectionObserver(
				([entry]) => {
					// BlogSection is Light theme (#fafafa), so pass false for isDarkMode
					if (entry.isIntersecting) {
						setMetaThemeColor("#fafafa", false, themeOptions);
					} else {
						// When leaving, assume we're going back to dark (#050508)
						setMetaThemeColor("#050508", true, themeOptions);
					}
				},
				{
					// Trigger only when the element is fully covering the viewport (top 0%)
					// rootMargin at -100% effectively means the element must be fully within/above the viewport
					// But since we want it when it *reaches* the top, we can check when it intersects a thin line at the very top.
					// "0px 0px -99.9% 0px" creates a 0.1% height strip at the top of the viewport.
					// When the section enters this strip, it means it has scrolled all the way up.
					rootMargin: "0px 0px -100% 0px",
				}
			);

			observer.observe(el);

			return () => {
				observer.disconnect();
				// Revert to dark theme on unmount
				setMetaThemeColor("#050508", true, themeOptions);
			};
		}, [useThemeColorOnly]);

		const effectiveSearchQuery = showSearch ? searchQuery : "";

		return (
			<section ref={assignRefs} className="relative w-full min-h-screen p-8 sm:p-20 bg-foreground text-background">
				<div
					className="flex flex-col items-stretch justify-start max-w-[1080px] mx-auto pt-[51px] pb-[85px] lg:pt-[30px] lg:pb-[58px]
    px-0 sm:py-4 md:py-8 lg:py-[20px] xl:py-[30px]
    gap-0"
				>
					{header && viewMode !== "timeline" ? (
						<div className="mb-10 flex justify-center">
							<div className="relative flex w-full max-w-[1080px] min-w-[368px] mt-px ml-px flex-col">{header}</div>
						</div>
					) : null}
					<CategoriesNav
						categories={categories}
						activeCategory={activeCategory}
						onCategoryChange={setActiveCategory}
						showFloating={isInView}
						viewMode={viewMode}
						onViewModeChange={setViewMode}
						searchQuery={effectiveSearchQuery}
						onSearchChange={setSearchQuery}
						showSearch={showSearch}
						disableCollapse={disableCollapse}
						minimalMode={minimalMode}
					/>
					<Articles activeCategory={activeCategory} limit={limit} showViewAllButton={showViewAllButton} items={items} viewMode={viewMode} searchQuery={effectiveSearchQuery} />
				</div>
			</section>
		);
	}
);

BlogSection.displayName = "BlogSection";
export default BlogSection;
