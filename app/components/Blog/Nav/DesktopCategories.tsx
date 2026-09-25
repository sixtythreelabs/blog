"use client";

import { CaretDownIcon, SquaresFourIcon, ListDashesIcon, SpeakerHighIcon, SpeakerSlashIcon, ClockCounterClockwiseIcon, HouseIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { type CategoryOption, ENABLE_TIMELINE_VIEW } from "../../../types/posts";
import { useOverflowMeasurement } from "../../../hooks/useOverflowMeasurement";
import { useClickOutside } from "../../../hooks/useClickOutside";
import { useEscapeKey } from "../../../hooks/useKeyboardShortcut";
import SearchBar from "./SearchBar";
import TransitionLink from "../../TransitionLink";
import { useSound } from "../../../context/SoundContext";

type DesktopCategoriesProps = {
	categories: CategoryOption[];
	activeCategory: string;
	onCategoryChange: (category: string) => void;
	viewMode: "grid" | "list" | "timeline";
	onViewModeChange: (mode: "grid" | "list" | "timeline") => void;
	searchQuery: string;
	onSearchChange: (value: string) => void;
	showSearch: boolean;
	shortcutLabel: string;
	searchInputRef: React.RefObject<HTMLInputElement | null>;
	/** When true, hides timeline view option */
	minimalMode?: boolean;
};

export default function DesktopCategories({
	categories,
	activeCategory,
	onCategoryChange,
	viewMode,
	onViewModeChange,
	searchQuery,
	onSearchChange,
	showSearch,
	shortcutLabel,
	searchInputRef,
	minimalMode = false,
}: DesktopCategoriesProps) {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const { playSound, isMuted, toggleMute } = useSound();

	const navRef = useRef<HTMLDivElement | null>(null);
	const measureListRef = useRef<HTMLUListElement | null>(null);
	const searchRef = useRef<HTMLDivElement | null>(null);
	const allButtonRef = useRef<HTMLButtonElement | null>(null);
	const dropdownRef = useRef<HTMLDivElement | null>(null);

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
		ToggleIcon = ListDashesIcon;
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

	const categoriesWithoutAll = categories.filter((category) => category.id !== "all");

	const visibleCount = useOverflowMeasurement({
		navRef,
		measureListRef,
		allButtonRef,
		searchRef,
		totalItemCount: categoriesWithoutAll.length,
	});

	const visibleCategories = categoriesWithoutAll.slice(0, visibleCount);

	useClickOutside(dropdownRef, () => setIsDropdownOpen(false), isDropdownOpen);
	useEscapeKey(() => setIsDropdownOpen(false), isDropdownOpen);

	return (
		<>
			<div className="hidden md:flex items-center w-full gap-6">
				<div ref={navRef} className="flex items-center gap-3 flex-1 min-w-0">
					<div className="relative" ref={dropdownRef}>
						<button
							ref={allButtonRef}
							onClick={() => {
								setIsDropdownOpen((prev) => !prev);
							}}
							onMouseEnter={() => playSound("hover")}
							className={`flex items-center gap-2 px-3 py-1.5 h-8 box-border border transition-all duration-200 font-semi-mono text-xs tracking-tighter ${
								activeCategory === "all" ? "bg-background text-foreground/80 border-background" : "border-background text-background/80"
							}`}
							aria-haspopup="menu"
							aria-expanded={isDropdownOpen}
						>
							<span>All</span>
							<CaretDownIcon className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
						</button>

						{isDropdownOpen && (
							<div className="absolute top-full left-0 mt-2 bg-foreground border border-background shadow-lg z-50 min-w-[200px]" role="menu">
								<ul className="p-1.5 max-h-72 overflow-auto">
									{categories.map((category) => {
										return (
											<li key={`all-${category.id}`}>
											<button
												onClick={() => {
													onCategoryChange(category.id);
													setIsDropdownOpen(false);
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
						)}
					</div>
					<ul className="flex relative gap-4 whitespace-nowrap list-none font-semi-mono text-xs tracking-tighter overflow-hidden">
						{visibleCategories.map((category) => {
							return (
								<li key={category.id}>
								<button
									onClick={() => {
										onCategoryChange(category.id);
									}}
										onMouseEnter={() => playSound("hover")}
										className={`flex items-center gap-2 px-4 py-1.5 h-8 box-border border transition-all duration-200 ${
											activeCategory === category.id ? "bg-background text-foreground/80 border-background" : "border-background text-background/80"
										}`}
										data-morph
									>
										{category.label}
									</button>
								</li>
							);
						})}
					</ul>
				</div>
				<div ref={searchRef} className="flex items-center gap-3">
					<TransitionLink
						href="/"
						transitionLabel="Home"
						className="flex items-center justify-center w-9 h-8 border border-black bg-black/90 text-off-white transition-colors duration-200"
						aria-label="Go to homepage"
					>
						<HouseIcon size={16} weight="regular" />
					</TransitionLink>
					<button
						type="button"
						onClick={() => toggleMute()}
						onMouseEnter={() => playSound("hover")}
						className={`flex items-center justify-center w-9 h-8 border transition-colors duration-200 ${
							isMuted ? "border-black bg-transparent text-black" : "border-black bg-black/90 text-off-white"
						}`}
						aria-pressed={!isMuted}
						aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
						title={isMuted ? "Unmute sounds" : "Mute sounds"}
					>
						{isMuted ? <SpeakerSlashIcon size={16} weight="regular" /> : <SpeakerHighIcon size={16} weight="regular" />}
					</button>
					<button
						type="button"
						onClick={() => {
							onViewModeChange(nextViewMode);
						}}
						onMouseEnter={() => playSound("hover")}
						className="flex items-center justify-center w-9 h-8 border border-black bg-black/90 text-off-white transition-colors duration-200"
						aria-label={toggleAriaLabel}
						title={toggleAriaLabel}
					>
						<ToggleIcon size={16} weight="regular" />
					</button>
					<SearchBar ref={searchInputRef} searchQuery={searchQuery} onSearchChange={onSearchChange} shortcutLabel={shortcutLabel} showSearch={showSearch} />
				</div>
			</div>

			{/* Hidden measurement list to avoid oscillation and ensure stable width checks */}
			<ul
				ref={measureListRef}
				aria-hidden="true"
				className="md:flex hidden gap-4 whitespace-nowrap list-none font-semi-mono text-xs tracking-tighter absolute opacity-0 pointer-events-none -z-10"
			>
				{categoriesWithoutAll.map((category) => {
					return (
						<li key={`measure-${category.id}`}>
							<button className="flex items-center gap-2 px-3 py-1.5 h-8 box-border border">
								{category.label}
							</button>
						</li>
					);
				})}
			</ul>
		</>
	);
}
