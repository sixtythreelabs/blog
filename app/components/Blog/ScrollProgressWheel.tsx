"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type MouseEvent as ReactMouseEvent } from "react";
import { motion } from "framer-motion";
import { LinearBlur } from "progressive-blur";
import { useSound } from "../../context/SoundContext";
import { useReaderMode } from "../../context/ReaderModeContext";

// Gutter the wheel needs beside the article: right-4 offset (16px) + w-32 track (128px)
export const WHEEL_MIN_GUTTER = 144;
// Fallback viewport width for the overlap check before the article is measured
const BLUR_THRESHOLD_WIDTH = 1440;

// Delay before the wheel slides out after the cursor leaves its zone
const WHEEL_HIDE_DELAY_MS = 150;

export interface SectionMarker {
	id: string;
	title: string;
	level: 1 | 2 | 3;
	position: number;
}

interface ScrollProgressWheelProps {
	onScrub: (progress: number) => void;
	onClose?: () => void;
	isDarkMode?: boolean;
	theme?: {
		text?: string;
		muted?: string;
		bg?: string;
		border?: string;
	};
	sections?: SectionMarker[];
	labelsHidden?: boolean;
	/** Hidden by default but revealed when hovering the right screen edge (reader mode off). */
	revealOnEdge?: boolean;
	/** Width (px) of the right-edge hover strip; falls back to its default width. */
	edgeZoneWidth?: number;
}

export function ScrollProgressWheel({ onScrub, onClose, isDarkMode, theme, sections, labelsHidden, revealOnEdge = false, edgeZoneWidth }: ScrollProgressWheelProps) {
	const [progress, setProgress] = useState(0);
	const roundedProgress = Math.round(progress * 100);
	const isDragging = useRef(false);
	const isMouseDragging = useRef(false);
	const { playSound } = useSound();
	const { isReaderMode } = useReaderMode();
	const previousTick = useRef<number | null>(null);
	const lastTickTime = useRef(0);
	const [isWheelHovered, setIsWheelHovered] = useState(false);
	const [expandedLabelId, setExpandedLabelId] = useState<string | null>(null);
	const wheelHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastHoverSoundTime = useRef(0);
	// Touch detection via subscription so hydration stays consistent
	const isTouchDevice = useSyncExternalStore(
		(onStoreChange) => {
			const mql = window.matchMedia("(hover: none)");
			mql.addEventListener("change", onStoreChange);
			return () => mql.removeEventListener("change", onStoreChange);
		},
		() => window.matchMedia("(hover: none)").matches,
		() => false
	);

	// Reader mode and edge reveal hide the wheel, but hovering the right edge shows it.
	const wheelVisible = (!isReaderMode && !revealOnEdge) || isWheelHovered;

	const handleWheelEnter = () => {
		if (wheelHideTimerRef.current) {
			clearTimeout(wheelHideTimerRef.current);
			wheelHideTimerRef.current = null;
		}
		setIsWheelHovered(true);
	};

	const handleWheelLeave = () => {
		if (wheelHideTimerRef.current) {
			clearTimeout(wheelHideTimerRef.current);
		}
		wheelHideTimerRef.current = setTimeout(() => setIsWheelHovered(false), WHEEL_HIDE_DELAY_MS);
	};

	// Hovering a tick plays the hover sound, rate-limited so sweeping across
	// the wheel doesn't machine-gun the sound.
	const handleTrackMouseOver = (event: ReactMouseEvent<HTMLDivElement>) => {
		const target = event.target instanceof Element ? event.target : null;
		if (!target?.closest("[data-wheel-tick]")) return;
		const now = performance.now();
		if (now - lastHoverSoundTime.current < 80) return;
		lastHoverSoundTime.current = now;
		playSound("hover");
	};

	useEffect(() => {
		return () => {
			if (wheelHideTimerRef.current) clearTimeout(wheelHideTimerRef.current);
		};
	}, []);

	// Tick only when progress changes during mouse interaction with the wheel.
	useEffect(() => {
		if (!isWheelHovered && !isMouseDragging.current) {
			previousTick.current = null;
			return;
		}

		if (previousTick.current !== null && previousTick.current !== roundedProgress) {
			const now = performance.now();
			if (now - lastTickTime.current >= 64) {
				playSound("tick");
				lastTickTime.current = now;
			}
		}
		previousTick.current = roundedProgress;
	}, [roundedProgress, isWheelHovered, playSound]);

	useEffect(() => {
		const handleScroll = () => {
			if (isDragging.current) return;
			const scrollTop = window.scrollY;
			const docHeight = document.documentElement.scrollHeight;
			const winHeight = window.innerHeight;
			const scrollable = Math.max(1, docHeight - winHeight);
			const scrollPercent = Math.min(1, Math.max(0, scrollTop / scrollable));
			setProgress(scrollPercent);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("resize", handleScroll);
		handleScroll();
		return () => {
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("resize", handleScroll);
		};
	}, []);

	// Overlaps when the measured gutter can't fit the wheel; falls back to a viewport
	// check until the article measurement is available
	const isOverlapping = edgeZoneWidth !== undefined ? edgeZoneWidth < WHEEL_MIN_GUTTER : typeof window !== "undefined" && window.innerWidth < BLUR_THRESHOLD_WIDTH;

	// Calculate active section based on scroll progress position
	const activeSection = useMemo(() => {
		if (!sections?.length) return null;

		// Find the last section whose position we've scrolled past
		let active: string | null = null;
		for (const section of sections) {
			if (section.position <= progress) {
				active = section.id;
			} else {
				break; // sections are ordered, so we can stop early
			}
		}
		return active;
	}, [sections, progress]);

	// Generate 100 ticks for 1% intervals
	const ticks = Array.from({ length: 101 }, (_, i) => i);

	// Check if current position is near a section marker (within 3 ticks)
	const isNearSectionMarker =
		sections?.some((section) => {
			const sectionPercent = Math.round(section.position * 100);
			return Math.abs(sectionPercent - roundedProgress) <= 2;
		}) ?? false;

	const handleInteractionStart = (y: number, rect: DOMRect) => {
		isDragging.current = true;
		setExpandedLabelId(null);
		window.dispatchEvent(new CustomEvent("app:scrub-start"));
		const percentage = Math.max(0, Math.min(1, y / rect.height));
		setProgress(percentage);
		onScrub(percentage);
	};

	const handleInteractionMove = (y: number, rect: DOMRect) => {
		if (!isDragging.current) return;
		const percentage = Math.max(0, Math.min(1, y / rect.height));
		setProgress(percentage);
		onScrub(percentage);
	};

	const handleInteractionEnd = () => {
		isDragging.current = false;
		window.dispatchEvent(new CustomEvent("app:scrub-end"));
	};

	const expandedMaxWidth = typeof window !== "undefined" ? Math.min(500, window.innerWidth - 80) : 500;

	// Calculate scale for magnification effect
	const currentPercent = progress * 100;
	const MAX_SCALE = 2;
	const MAJOR_TICK_WIDTH = 16; // w-4 = 16px

	const getScale = (position: number) => {
		const distance = Math.abs(position - currentPercent);
		const range = 6; // Range of effect in percent
		if (distance > range) return 1;

		// Cosine interpolation for smooth bell curve
		const scale = 1 + (MAX_SCALE - 1) * Math.cos((distance / range) * (Math.PI / 2));
		return scale;
	};

	return (
		<motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="contents">
			{/* Clickable backdrop to close wheel when blur is active */}
			{isOverlapping && !isReaderMode && !revealOnEdge && onClose && (
				<div
					className="fixed inset-0 z-30 cursor-pointer"
					onClick={onClose}
					onTouchEnd={(e) => { e.preventDefault(); onClose(); }}
					aria-hidden="true"
				/>
			)}
			{/* Localized blur behind the wheel - only when overlapping with article.
			    Mounted with the wheel so it never trails the reveal (discrete visibility
			    transitions or animating opacity over a backdrop-filter both render late). */}
			{isOverlapping && !isReaderMode && wheelVisible && (
				<div className="fixed right-0 top-0 bottom-0 w-[min(420px,50vw)] pointer-events-none z-40">
					<LinearBlur side="right" strength={40} style={{ width: "100%", height: "100%" }} />
				</div>
			)}
			{/* Hover strip that reveals the wheel from the right screen edge */}
			{(isReaderMode || revealOnEdge) && (
				<div
					className="fixed inset-y-0 right-0 z-40 w-16"
					style={edgeZoneWidth ? { width: edgeZoneWidth } : undefined}
					onMouseEnter={handleWheelEnter}
					onMouseLeave={revealOnEdge ? handleWheelLeave : undefined}
					onTouchStart={handleWheelEnter}
					aria-hidden="true"
				/>
			)}

			<div
				inert={!wheelVisible}
				className={`fixed right-4 top-[55%] -translate-y-1/2 h-[85%] flex flex-col items-end select-none z-50 transition-all duration-300 ease-out ${
					wheelVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6 pointer-events-none"
				}`}
				onMouseEnter={handleWheelEnter}
				onMouseLeave={handleWheelLeave}
				onMouseDown={(e) => {
					e.preventDefault();
					isMouseDragging.current = true;
					const rect = e.currentTarget.getBoundingClientRect();
					handleInteractionStart(e.clientY - rect.top, rect);

					const handleDrag = (moveEvent: MouseEvent) => {
						handleInteractionMove(moveEvent.clientY - rect.top, rect);
					};
					const handleUp = () => {
						isMouseDragging.current = false;
						previousTick.current = null;
						handleInteractionEnd();
						window.removeEventListener("mousemove", handleDrag);
						window.removeEventListener("mouseup", handleUp);
					};
					window.addEventListener("mousemove", handleDrag);
					window.addEventListener("mouseup", handleUp);
				}}
				onTouchStart={(e) => {
					if (e.touches.length !== 1) return;
					e.preventDefault(); // Prevent scroll while scrubbing
					const rect = e.currentTarget.getBoundingClientRect();
					handleInteractionStart(e.touches[0].clientY - rect.top, rect);

					const handleTouchDrag = (moveEvent: TouchEvent) => {
						if (moveEvent.touches.length !== 1) return;
						moveEvent.preventDefault();
						handleInteractionMove(moveEvent.touches[0].clientY - rect.top, rect);
					};
					const handleTouchEnd = () => {
						handleInteractionEnd();
						window.removeEventListener("touchmove", handleTouchDrag);
						window.removeEventListener("touchend", handleTouchEnd);
						window.removeEventListener("touchcancel", handleTouchEnd);
					};
					window.addEventListener("touchmove", handleTouchDrag, { passive: false });
					window.addEventListener("touchend", handleTouchEnd);
					window.addEventListener("touchcancel", handleTouchEnd);
				}}
			>
				{/* Timeline track */}
				<div className="relative h-full w-32 cursor-pointer" onMouseOver={handleTrackMouseOver}>
					{/* Ticks at 1% intervals */}
					{ticks.map((tick) => {
						const isMajor = tick % 10 === 0;
						const isMinor = !isMajor;
						const isAbove = tick < roundedProgress;
						// Hide tick if there's a section marker at this position
						const hasSection = sections?.some((s) => Math.round(s.position * 100) === tick);
						if (hasSection) return null;

						const scale = getScale(tick);

						return (
							<div
								key={`tick-${tick}`}
								className="absolute right-0 flex items-center justify-end origin-right"
								style={{
									top: `${tick}%`,
									transform: `translateY(-50%) scale(${scale})`,
									zIndex: Math.round(scale * 100),
								}}
							>
								{/* Major ticks (10%) */}
								{isMajor && (
									<div data-wheel-tick data-morph data-morph-width="20px" data-morph-height="1px" data-morph-align="right" className="group py-2 w-12 flex items-center justify-end cursor-pointer relative after:content-[''] after:absolute after:top-0 after:bottom-0 after:-right-4 after:w-4">
										<div className={`h-px bg-current w-4 transition-all duration-300 group-hover:opacity-0 ${isAbove ? "opacity-25" : "opacity-60"}`} />
									</div>
								)}

								{/* Minor ticks (1%) - Visual only */}
								{isMinor && (
									<div data-wheel-tick data-morph data-morph-width="12px" data-morph-height="1px" data-morph-align="right" className="group py-2 w-12 flex items-center justify-end cursor-pointer relative after:content-[''] after:absolute after:top-0 after:bottom-0 after:-right-4 after:w-4">
										<div className={`h-px bg-current w-2 transition-all duration-300 group-hover:opacity-0 ${isAbove ? "opacity-10" : "opacity-25"}`} />
									</div>
								)}
							</div>
						);
					})}

					{/* Section markers */}
					{sections?.map((section) => {
						const isActive = section.id === activeSection;
						const sectionPercent = Math.round(section.position * 100);
						const isAbove = sectionPercent < roundedProgress;

						return (
							<div
								key={section.id}
								className="group absolute right-0 flex items-center justify-end"
								style={{
									top: `${sectionPercent}%`,
									transform: "translateY(-50%)",
									zIndex: 1000,
								}}
							>
								{/* Section tick - more prominent than regular ticks */}
								<div
									data-wheel-tick
									data-morph
									data-morph-width={isActive ? "32px" : "20px"}
									data-morph-height="1px"
									data-morph-align="right"
									className="py-4 w-12 flex items-center justify-end cursor-pointer relative after:content-[''] after:absolute after:top-0 after:bottom-0 after:-right-4 after:w-4"
								>
									<motion.div
										className="h-px bg-current group-hover:opacity-0"
										animate={{
											width: isActive ? MAJOR_TICK_WIDTH * MAX_SCALE : 16,
											opacity: isActive ? 0.9 : isAbove ? 0.2 : 0.4,
										}}
										transition={{ type: "spring", stiffness: 400, damping: 25 }}
									/>
								</div>
							</div>
						);
					})}

					{/* Section labels — rendered separately so they don't extend the morph group's hover zone */}
					{sections?.map((section, index) => {
						const isActive = section.id === activeSection;
						const sectionPercent = Math.round(section.position * 100);
						const isAbove = sectionPercent < roundedProgress;
					const isLabelExpanded = labelsHidden
						? isWheelHovered || (isTouchDevice && expandedLabelId === section.id)
						: isWheelHovered || isActive || (isTouchDevice && expandedLabelId === section.id);

					const shouldHideLabel = labelsHidden && !isWheelHovered && !(isTouchDevice && expandedLabelId === section.id);

					return (
						<motion.span
							key={`label-${section.id}`}
							className={`absolute right-12 uppercase font-departure-mono whitespace-nowrap cursor-pointer transition-opacity duration-200 ${
								isTouchDevice ? "pointer-events-auto" : "pointer-events-none"
							} ${
								isActive ? "font-medium text-[10px] xl:text-xs 2xl:text-sm" : "text-[9px] xl:text-[10px] 2xl:text-xs"
							} ${
								shouldHideLabel
									? "opacity-0"
									: isActive ? "opacity-100" : isAbove ? "opacity-30" : "opacity-50"
							}`}
								onTouchStart={(e) => e.stopPropagation()}
								onClick={isTouchDevice ? () => setExpandedLabelId((prev) => (prev === section.id ? null : section.id)) : undefined}
								animate={{
									maxWidth: isLabelExpanded ? expandedMaxWidth : 160,
								}}
								transition={{ type: "spring", stiffness: 400, damping: 30 }}
								style={{
									top: `${sectionPercent}%`,
									transform: "translateY(-50%)",
									zIndex: 1000,
									overflow: "hidden",
									textOverflow: "ellipsis",
									transitionDelay: shouldHideLabel ? "0ms" : `${index * 40}ms`,
								}}
							>
								{section.title}
							</motion.span>
						);
					})}

					{/* Active Indicator / Handle */}
					<div className="absolute right-0 flex items-center justify-end pointer-events-none" style={{ top: `${roundedProgress}%`, transform: "translateY(-50%)" }}>
						<motion.div
							animate={{
								width: MAJOR_TICK_WIDTH * MAX_SCALE,
								height: 2.5,
								backgroundColor: "currentColor",
								opacity: 0.8,
							}}
							transition={{ type: "spring", stiffness: 500, damping: 30 }}
						/>
					</div>

				{/* Floating active label - hidden when near a section marker (unless labels are hidden) */}
				{(!isNearSectionMarker || (labelsHidden && !isWheelHovered)) && (
						<motion.div
							className="absolute right-12 pointer-events-none"
							style={{ top: `${roundedProgress}%`, transform: "translateY(-50%)" }}
							transition={{ type: "spring", stiffness: 800, damping: 35 }}
						>
							<span className={`text-sm font-medium font-departure-mono whitespace-nowrap ${isDarkMode ? "text-white" : "text-black"}`}>{roundedProgress / 100}</span>
						</motion.div>
					)}
				</div>
			</div>
		</motion.div>
	);
}
