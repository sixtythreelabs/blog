"use client";

import {
	HouseIcon,
	BooksIcon,
	DotsThreeOutlineIcon,
	XIcon,
	MagnifyingGlassIcon,
	RowsIcon,
	SquaresFourIcon,
	SpeakerHighIcon,
	SpeakerSlashIcon,
	ClockCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { forwardRef, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { type CategoryOption, ENABLE_TIMELINE_VIEW } from "../../../types/posts";
import TransitionLink from "../../TransitionLink";
import { useScrollDirection, useMediaQuery } from "../../../hooks";
import { useSound } from "../../../context/SoundContext";

const ICON_SIZE = 18;

type MobileMenuProps = {
	categories: CategoryOption[];
	activeCategory: string;
	onCategoryChange: (category: string) => void;
	viewMode: "grid" | "list" | "timeline";
	onViewModeChange: (mode: "grid" | "list" | "timeline") => void;
	searchQuery: string;
	onSearchChange: (value: string) => void;
	showSearch: boolean;
	showHomeButton: boolean;
	isMobileMenuOpen: boolean;
	setIsMobileMenuOpen: (open: boolean) => void;
	isMobileSearchOpen: boolean;
	setIsMobileSearchOpen: (open: boolean) => void;
	/** When true, the menu will not collapse on scroll */
	disableCollapse?: boolean;
	/** When true, shows minimal UI: hides category/view toggles, shows "All Posts" label */
	minimalMode?: boolean;
};

const MobileMenu = forwardRef<HTMLInputElement, MobileMenuProps>(function MobileMenu(
	{
		categories,
		activeCategory,
		onCategoryChange,
		viewMode,
		onViewModeChange,
		searchQuery,
		onSearchChange,
		showSearch,
		showHomeButton,
		isMobileMenuOpen,
		setIsMobileMenuOpen,
		isMobileSearchOpen,
		setIsMobileSearchOpen,
		disableCollapse = false,
		minimalMode = false,
	},
	mobileSearchInputRef
) {
	const { scrollDirection, setScrollDirection } = useScrollDirection({ upThreshold: 100 });
	const { playSound, isMuted, toggleMute } = useSound();
	const isMobile = useMediaQuery("(max-width: 767px)");
	const isFirstRender = useRef(true);

	const isCollapsed = !disableCollapse && scrollDirection === "down";

	// Play sound when collapsed state changes (but not on initial render)
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		if (isMobile && !disableCollapse) {
			playSound("hover");
		}
	}, [isCollapsed, isMobile, disableCollapse, playSound]);

	if (!isMobile) return null;

	const isListView = viewMode === "list";
	const isGridView = viewMode === "grid";
	const isTimelineView = viewMode === "timeline";

	// Timeline is gated behind a feature flag (and minimal mode) so it can be
	// brought back by flipping ENABLE_TIMELINE_VIEW in types/posts.ts
	const allowTimeline = !minimalMode && ENABLE_TIMELINE_VIEW;

	let toggleAriaLabel = "Switch view";
	let ToggleIcon = SquaresFourIcon;
	let nextViewMode: "grid" | "list" | "timeline" = "grid";

	if (isGridView) {
		toggleAriaLabel = "Switch to list view";
		ToggleIcon = RowsIcon; // Use RowsIcon for list view on mobile instead of ListDashesIcon if that was the preference, preserving existing logic where RowsIcon was used.
		nextViewMode = "list";
	} else if (isListView) {
		// Skip timeline unless explicitly enabled
		if (allowTimeline) {
			toggleAriaLabel = "Switch to timeline view";
			ToggleIcon = ClockCounterClockwiseIcon;
			nextViewMode = "timeline";
		} else {
			toggleAriaLabel = "Switch to grid view";
			ToggleIcon = SquaresFourIcon;
			nextViewMode = "grid";
		}
	} else {
		// Timeline view
		toggleAriaLabel = "Switch to grid view";
		ToggleIcon = SquaresFourIcon;
		nextViewMode = "grid";
	}

	return createPortal(
		<div className="mobile-nav-portal">
			{/* Small screens: Floating bottom nav */}
			<div className="md:hidden fixed bottom-2 left-0 right-0 z-100 flex justify-center px-4">
				<div className="relative">
					<motion.div
						layout
						initial={false}
						transition={{
							layout: {
								type: "spring",
								stiffness: 450,
								damping: 30,
							},
						}}
						className="relative flex items-center justify-center shrink-0 border border-light-gray/50 text-off-white backdrop-blur-sm overflow-hidden bg-black/90"
					>
						{/* Anchor popped-out content to the bar while its layout animates. */}
						<AnimatePresence mode="popLayout" initial={false}>
							{isCollapsed ? (
								<motion.button
									key="collapsed"
									layout
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.15, layout: { duration: 0 } }}
									className="px-1.75"
									// Motion owns opacity/transform; global button transitions cause trailing frames.
									style={{ transition: "none" }}
									onClick={() => setScrollDirection("up")}
									onMouseEnter={() => playSound("hover")}
									aria-label="Expand menu"
								>
									<DotsThreeOutlineIcon size={ICON_SIZE} weight="fill" />
								</motion.button>
							) : (
								<motion.div
									key="expanded"
									layout
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.15, layout: { duration: 0 } }}
									className="flex items-center gap-3 px-3 py-2 font-semi-mono text-sm whitespace-nowrap"
								>
									{showHomeButton && (
										<>
											<TransitionLink href="/" className="flex items-center gap-2 no-underline" transitionLabel="Home" aria-label="Go to homepage">
												<HouseIcon size={ICON_SIZE} weight="duotone" />
											</TransitionLink>
											<div className="h-4 w-px shrink-0 bg-light-gray" />
										</>
									)}

									{showSearch ? (
										<button
											onClick={() => {
												setIsMobileSearchOpen(!isMobileSearchOpen);
												setIsMobileMenuOpen(false);
											}}
											onMouseEnter={() => playSound("hover")}
											className="flex items-center gap-2"
											data-no-morph
										>
											<MagnifyingGlassIcon size={ICON_SIZE} weight="duotone" />
										</button>
									) : (
										<TransitionLink href="/blog" className="flex items-center gap-2 no-underline" transitionLabel="Blog" aria-label="View all blog posts">
											<BooksIcon size={ICON_SIZE} weight="duotone" />
											{minimalMode && <span>All Posts</span>}
										</TransitionLink>
									)}

									<div className="h-4 w-px shrink-0 bg-light-gray" />

									<button
										onClick={() => {
											toggleMute();
										}}
										onMouseEnter={() => playSound("hover")}
										className="flex items-center"
										data-no-morph
										aria-pressed={!isMuted}
										aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
									>
										{isMuted ? <SpeakerSlashIcon size={ICON_SIZE} weight="duotone" /> : <SpeakerHighIcon size={ICON_SIZE} weight="duotone" />}
										<span className="sr-only">{isMuted ? "Unmute sounds" : "Mute sounds"}</span>
									</button>

									{!minimalMode && <div className="h-4 w-px shrink-0 bg-light-gray" />}

									{!minimalMode && (
										<>
											<button
												onClick={() => {
													onViewModeChange(nextViewMode);
												}}
												onMouseEnter={() => playSound("hover")}
												className="flex items-center"
												data-no-morph
												aria-label={toggleAriaLabel}
												title={toggleAriaLabel}
											>
												<ToggleIcon size={ICON_SIZE} weight="duotone" />
											</button>

											<div className="h-4 w-px shrink-0 bg-light-gray" />

											<button
												onClick={() => {
													setIsMobileMenuOpen(!isMobileMenuOpen);
													setIsMobileSearchOpen(false);
												}}
												onMouseEnter={() => playSound("hover")}
												className="flex items-center gap-2"
												data-no-morph
												aria-haspopup="menu"
												aria-expanded={isMobileMenuOpen}
											>
											{(() => {
												const activeCat = categories.find((cat) => cat.id === activeCategory);
												return <span className="max-w-[40vw] truncate">{activeCat?.label}</span>;
											})()}
											</button>
										</>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				</div>
			</div>

			{/* Mobile: Drop-up categories panel (animated) */}
			{/* Panel */}
			<div
				className={`md:hidden fixed bottom-20 left-0 right-0 z-100 px-4 transition-all duration-200 ease-out ${
					isMobileMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
				}`}
				role="menu"
				aria-hidden={!isMobileMenuOpen}
			>
				<div className="mx-auto w-full max-w-[1080px] border border-background bg-foreground/80 backdrop-blur-sm shadow-lg font-semi-mono">
					<ul className="p-2">
						{categories.map((category) => {
							return (
								<li key={`mobile-${category.id}`}>
									<button
										onClick={() => {
											onCategoryChange(category.id);
											setIsMobileMenuOpen(false);
										}}
										onMouseEnter={() => playSound("hover")}
										className={`w-full text-left px-4 py-2 transition-all duration-200 font-semi-mono flex items-center gap-2 ${
											activeCategory === category.id ? "bg-background text-foreground/80" : "text-background/80"
										}`}
										role="menuitem"
									>
										{category.label}
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			</div>

			{showSearch && (
				<>
					{/* Mobile: Bottom search panel (animated) */}
					{/* Panel */}
					<div
						className={`md:hidden fixed bottom-20 left-0 right-0 z-100 px-4 transition-all duration-200 ease-out ${
							isMobileSearchOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
						}`}
						aria-hidden={!isMobileSearchOpen}
					>
						<div className="mx-auto w-full max-w-[1080px] border border-background bg-foreground shadow-lg p-3 flex items-center gap-2">
							<input
								type="text"
								placeholder="Search articles..."
								ref={mobileSearchInputRef}
								value={searchQuery}
								onChange={(e) => onSearchChange(e.target.value)}
								className="flex-1 px-3 py-2 text-background/80 placeholder:text-background/60 focus:outline-none font-semi-mono text-sm"
							/>
							<button
								onClick={() => {
									setIsMobileSearchOpen(false);
								}}
								onMouseEnter={() => playSound("hover")}
								className="p-2 text-background/70"
								data-no-morph
								aria-label="Close search"
							>
								<XIcon size={ICON_SIZE} weight="duotone" />
							</button>
						</div>
					</div>
				</>
			)}
		</div>,
		document.body
	);
});

export default MobileMenu;
