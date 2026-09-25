"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { usePageTransition } from "../PageTransitionProvider";
import { hasPreloaderRun } from "../../utils/preloader";
import { usePlatform } from "../../hooks/usePlatform";
import { useEscapeKey, useKeyboardShortcut } from "../../hooks/useKeyboardShortcut";
import { DesktopCategories, MobileMenu } from "./Nav";
import { type CategoryOption } from "../../types/posts";

type BlogNavigationProps = {
	categories: CategoryOption[];
	activeCategory: string;
	onCategoryChange: (category: string) => void;
	showFloating?: boolean;
	viewMode: "grid" | "list" | "timeline";
	onViewModeChange: (mode: "grid" | "list" | "timeline") => void;
	searchQuery: string;
	onSearchChange: (value: string) => void;
	showSearch?: boolean;
	/** When true, the mobile menu will not collapse on scroll */
	disableCollapse?: boolean;
	/** When true, shows minimal UI: hides category/view toggles, shows "All Posts" label */
	minimalMode?: boolean;
};

export default function BlogNavigation({
	categories,
	activeCategory,
	onCategoryChange,
	showFloating = true,
	viewMode,
	onViewModeChange,
	searchQuery,
	onSearchChange,
	showSearch = true,
	disableCollapse = false,
	minimalMode = false,
}: BlogNavigationProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [isPreloaderDone, setIsPreloaderDone] = useState<boolean>(() => hasPreloaderRun());

	const pathname = usePathname();
	const showHomeButton = pathname !== "/";
	const { isTransitioning } = usePageTransition();
	const { isMac, shortcutLabel } = usePlatform();

	const searchInputRef = useRef<HTMLInputElement | null>(null);
	const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

	// Close mobile panels on Escape
	const closeMobilePanels = useCallback(() => {
		setIsMobileMenuOpen(false);
		setIsMobileSearchOpen(false);
	}, []);

	useEscapeKey(closeMobilePanels, isMobileMenuOpen || isMobileSearchOpen);

	// Global search focus shortcut (Cmd+K / Ctrl+K)
	const handleSearchShortcut = useCallback(() => {
		if (searchInputRef.current) {
			searchInputRef.current.focus();
			searchInputRef.current.select();
			return;
		}
		// If desktop search isn't mounted (e.g., mobile), open the mobile search drawer then focus
		setIsMobileSearchOpen(true);
		setIsMobileMenuOpen(false);
		requestAnimationFrame(() => {
			mobileSearchInputRef.current?.focus();
			mobileSearchInputRef.current?.select();
		});
	}, []);

	useKeyboardShortcut({
		combo: isMac ? { key: "k", meta: true, ctrl: false } : { key: "k", ctrl: true },
		callback: handleSearchShortcut,
		enabled: showSearch,
	});

	// Set mounted state
	useEffect(() => {
		setMounted(true);
	}, []);

	// Listen for preloader completion
	useEffect(() => {
		if (isPreloaderDone) return;
		const handlePreloaderComplete = () => setIsPreloaderDone(true);
		window.addEventListener("app:preloader-complete", handlePreloaderComplete, { once: true });
		window.addEventListener("app:preloader-start-exit", handlePreloaderComplete, { once: true });
		return () => {
			window.removeEventListener("app:preloader-complete", handlePreloaderComplete);
			window.removeEventListener("app:preloader-start-exit", handlePreloaderComplete);
		};
	}, [isPreloaderDone]);

	// Auto-focus mobile search input when panel opens
	useEffect(() => {
		if (!showSearch || !isMobileSearchOpen) return;
		requestAnimationFrame(() => {
			mobileSearchInputRef.current?.focus();
			mobileSearchInputRef.current?.select();
		});
	}, [isMobileSearchOpen, showSearch]);

	// If floating UI gets disabled, close any open panels
	useEffect(() => {
		if (!showFloating) {
			closeMobilePanels();
		}
	}, [showFloating, closeMobilePanels]);

	// Close mobile panels during page transitions
	useEffect(() => {
		if (isTransitioning) {
			closeMobilePanels();
		}
	}, [isTransitioning, closeMobilePanels]);

	const shouldShowMobileMenu = mounted && showFloating && !isTransitioning && isPreloaderDone;

	return (
		<>
			<nav className="hidden md:flex justify-between items-center w-full max-w-[1080px] mx-auto pb-8 relative">
				<DesktopCategories
					categories={categories}
					activeCategory={activeCategory}
					onCategoryChange={onCategoryChange}
					viewMode={viewMode}
					onViewModeChange={onViewModeChange}
					searchQuery={searchQuery}
					onSearchChange={onSearchChange}
					showSearch={showSearch}
					shortcutLabel={shortcutLabel}
					searchInputRef={searchInputRef}
					minimalMode={minimalMode}
				/>
			</nav>

			{shouldShowMobileMenu && (
				<MobileMenu
					ref={mobileSearchInputRef}
					categories={categories}
					activeCategory={activeCategory}
					onCategoryChange={onCategoryChange}
					viewMode={viewMode}
					onViewModeChange={onViewModeChange}
					searchQuery={searchQuery}
					onSearchChange={onSearchChange}
					showSearch={showSearch}
					showHomeButton={showHomeButton}
					isMobileMenuOpen={isMobileMenuOpen}
					setIsMobileMenuOpen={setIsMobileMenuOpen}
					isMobileSearchOpen={isMobileSearchOpen}
					setIsMobileSearchOpen={setIsMobileSearchOpen}
					disableCollapse={disableCollapse}
					minimalMode={minimalMode}
				/>
			)}
		</>
	);
}
