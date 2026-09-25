"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { type ArticleItem } from "../../types/posts";
import PixelIconDisplay from "./DotMatrixIcon";
import { resolveIcon } from "../../utils/icons";
import AuthorsList from "./AuthorsList";
import { LinearBlur } from "progressive-blur";
import { useSound } from "../../context/SoundContext";

interface TimeMachineProps {
	items: ArticleItem[];
}

export function TimeMachine({ items }: TimeMachineProps) {
	const { playSound } = useSound();
	const [activeIndex, setActiveIndex] = useState(0);
	const [dragProgress, setDragProgress] = useState(0); // -1 to 1, tension before snap
	const containerRef = useRef<HTMLDivElement>(null);
	const scrollAccumulator = useRef(0);
	const snapThreshold = 0.25; // Must scroll 25% to snap to next card
	const [isHovered, setIsHovered] = useState<number | null>(null);
	const [showTimeline, setShowTimeline] = useState(false);
	const timelineTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const hasMounted = useRef(false);

	// Play click sound when active index changes
	useEffect(() => {
		if (hasMounted.current) {
			playSound("tick");
		} else {
			hasMounted.current = true;
		}
	}, [activeIndex, playSound]);

	// Show timeline when scrolling, hide after a delay
	useEffect(() => {
		const isScrolling = Math.abs(dragProgress) > 0.05;
		if (isScrolling) {
			setShowTimeline(true);
			if (timelineTimeoutRef.current) {
				clearTimeout(timelineTimeoutRef.current);
				timelineTimeoutRef.current = null;
			}
		} else if (showTimeline) {
			// Delay hiding the timeline so user can interact with it
			timelineTimeoutRef.current = setTimeout(() => {
				setShowTimeline(false);
			}, 2000);
		}

		return () => {
			if (timelineTimeoutRef.current) {
				clearTimeout(timelineTimeoutRef.current);
			}
		};
	}, [dragProgress, showTimeline]);

	// Snap logic - if past threshold, go to next/prev card
	const handleRelease = () => {
		if (Math.abs(dragProgress) > snapThreshold) {
			const direction = dragProgress > 0 ? 1 : -1;
			// direction 1 means dragging "down/right" -> increment index -> go to older posts
			const newIndex = Math.max(0, Math.min(items.length - 1, activeIndex + direction));
			setActiveIndex(newIndex);
		}
		setDragProgress(0);
	};

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
				e.preventDefault();
				setActiveIndex((current) => Math.max(0, current - 1));
			} else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
				e.preventDefault();
				setActiveIndex((current) => Math.min(items.length - 1, current + 1));
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [items.length]);

	// Touch tracking refs
	const touchStartY = useRef<number | null>(null);
	const touchStartTime = useRef<number>(0);

	// Scroll with tension/snap (wheel events)
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();

			scrollAccumulator.current += e.deltaY * 0.012;

			setDragProgress((current) => {
				const newProgress = current + scrollAccumulator.current;
				scrollAccumulator.current = 0;

				// If we've crossed threshold, snap immediately
				if (Math.abs(newProgress) > 1) {
					const direction = newProgress > 0 ? 1 : -1;
					const newIndex = Math.max(0, Math.min(items.length - 1, activeIndex + direction));
					setTimeout(() => {
						setActiveIndex(newIndex);
						setDragProgress(0);
					}, 0);
					return 0;
				}

				return Math.max(-1, Math.min(1, newProgress));
			});
		};

		const handleWheelEnd = () => {
			handleRelease();
		};

		let wheelTimeout: NodeJS.Timeout;
		const handleWheelWithDebounce = (e: WheelEvent) => {
			handleWheel(e);
			clearTimeout(wheelTimeout);
			wheelTimeout = setTimeout(handleWheelEnd, 40);
		};

		container.addEventListener("wheel", handleWheelWithDebounce, { passive: false });
		return () => {
			container.removeEventListener("wheel", handleWheelWithDebounce);
			clearTimeout(wheelTimeout);
		};
	}, [items.length, activeIndex]);

	// Touch events for mobile
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 1) {
				touchStartY.current = e.touches[0].clientY;
				touchStartTime.current = Date.now();
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (touchStartY.current === null || e.touches.length !== 1) return;

			const currentY = e.touches[0].clientY;
			const deltaY = touchStartY.current - currentY;

			// Convert touch delta to progress (-1 to 1)
			// Positive deltaY = swiping up = go to next (older) card
			const progress = Math.max(-1, Math.min(1, deltaY / 150));
			setDragProgress(progress);

			// Prevent page scroll when interacting with cards
			if (Math.abs(deltaY) > 10) {
				e.preventDefault();
			}
		};

		const handleTouchEnd = () => {
			if (touchStartY.current === null) return;

			// Snap to next/prev card if past threshold
			if (Math.abs(dragProgress) > snapThreshold) {
				const direction = dragProgress > 0 ? 1 : -1;
				const newIndex = Math.max(0, Math.min(items.length - 1, activeIndex + direction));
				setActiveIndex(newIndex);
			}

			setDragProgress(0);
			touchStartY.current = null;
		};

		container.addEventListener("touchstart", handleTouchStart, { passive: true });
		container.addEventListener("touchmove", handleTouchMove, { passive: false });
		container.addEventListener("touchend", handleTouchEnd, { passive: true });
		container.addEventListener("touchcancel", handleTouchEnd, { passive: true });

		return () => {
			container.removeEventListener("touchstart", handleTouchStart);
			container.removeEventListener("touchmove", handleTouchMove);
			container.removeEventListener("touchend", handleTouchEnd);
			container.removeEventListener("touchcancel", handleTouchEnd);
		};
	}, [items.length, activeIndex, dragProgress, snapThreshold]);

	// For timeline calculations
	const scrollPosition = activeIndex;

	if (items.length === 0) {
		return (
			<div className="flex items-center justify-center h-[70vh]">
				<p className="text-subtitle">No posts yet.</p>
			</div>
		);
	}

	const renderAuthors = (authors: ArticleItem["authors"], textClassName: string) => <AuthorsList authors={authors} className={textClassName} disableLinks />;

	return (
		<div ref={containerRef} className="relative h-[80vh] w-full cursor-ns-resize bg-foreground">
			{/* Perspective container */}
			<div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1200px" }}>
				{/* Cards stack */}
				<div className="relative w-full h-[500px]" style={{ transformStyle: "preserve-3d" }}>
					{items.map((item, index) => {
						const isActive = index === activeIndex;
						const offset = index - activeIndex;
						const absOffset = Math.abs(offset);

						// Base positions - cards drift into distance both directions
						let translateY = offset * 45;
						let translateZ = -absOffset * 60;
						let rotateX = 0;
						let opacity = Math.max(0.4, 1 - absOffset * 0.08);
						let scale = Math.max(0.7, 1 - absOffset * 0.035);

						// Active card - lifts up and tilts as you drag
						if (isActive && Math.abs(dragProgress) > 0.05) {
							translateY = translateY - dragProgress * 100; // Lift up as you scroll
							translateZ = translateZ + Math.abs(dragProgress) * 40; // Come forward
							rotateX = -dragProgress * 12; // Tilt back
						}

						const resolvedIcon = resolveIcon(item.icon);
						const excerptClasses = "relative mt-3 overflow-hidden lg:flex-grow";
						const metadataClasses = "mt-4 flex items-center gap-2";

						return (
							<motion.div
								key={item.href}
								className="absolute inset-0 block"
								style={{
									zIndex: 100 - Math.round(absOffset * 10),
									pointerEvents: isActive ? "auto" : "none",
									transformOrigin: "center center",
								}}
								animate={{
									y: translateY,
									z: translateZ,
									rotateX,
									scale,
									opacity,
								}}
								transition={{
									type: "spring",
									stiffness: 350,
									damping: 30,
								}}
							>
								<Link href={item.href} className="block h-full" data-no-morph>
									<article
										className={`
                    h-full overflow-hidden flex flex-col bg-foreground text-black transition-colors duration-200 shadow-2xl border border-light-gray/20
                    gap-4 md:gap-6 p-8 md:p-12 lg:p-14
                  `}
										onMouseEnter={() => setIsHovered(index)}
										onMouseLeave={() => setIsHovered(null)}
									>
										<div className="flex items-center justify-between">
											<div className="inline-flex h-20 w-20 items-center justify-center rounded-sm text-black" aria-hidden="true">
											<PixelIconDisplay
												svg={resolvedIcon.type === "phosphor" ? <resolvedIcon.Component size={48} weight="regular" /> : undefined}
												svgUrl={resolvedIcon.type === "custom" ? resolvedIcon.url : undefined}
												gridSize={32}
												dotScale={0.8}
												sparkleDensity={0.8}
												shape="square"
												color="black"
												sparkleEnabled={isHovered === index}
													className="w-full h-full"
													alignX="left"
												/>
											</div>
											<span className="border border-light-gray/20 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-white/80 bg-black/90">{item.category}</span>
										</div>

										<h2 className="text-black text-2xl leading-tight font-bold tracking-tight">{item.label}</h2>

										<div className={excerptClasses}>
											<p className="text-light-gray text-sm leading-6">{item.intro}</p>
											<div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-b from-transparent to-foreground" />
										</div>

										<div className={metadataClasses}>
											{renderAuthors(item.authors, "text-light-gray text-xs sm:text-sm")}
											<time dateTime={item.dateTime} className="ml-auto text-light-gray text-[0.7rem] md:text-[0.8rem] leading-4 text-right">
												{new Date(item.dateTime).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</time>
										</div>
									</article>
								</Link>
							</motion.div>
						);
					})}
				</div>
			</div>

			{/* Right side blur overlay - mobile only, visible when timeline is showing */}
			<div className={`fixed right-0 top-0 bottom-0 w-24 pointer-events-none z-40 md:hidden transition-opacity duration-300 ${showTimeline ? "opacity-100" : "opacity-0"}`}>
				<LinearBlur side="right" strength={40} style={{ width: "100%", height: "100%" }} />
			</div>

			{/* Timeline scrubber on right - hidden on mobile until scrolling */}
			<motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="contents">
				{(() => {
					// Generate timeline with weeks between oldest and newest post
					const sortedByDate = [...items].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
					const oldestDate = sortedByDate[0]?.dateTime ? new Date(sortedByDate[0].dateTime) : new Date();
					const newestDate = sortedByDate[sortedByDate.length - 1]?.dateTime ? new Date(sortedByDate[sortedByDate.length - 1].dateTime) : new Date();
					const totalDays = Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));

					// Create tick marks - approximately one per week, scaled to date range
					// For short ranges (< 2 weeks), use fewer ticks to avoid clutter
					const weeksInRange = Math.ceil(totalDays / 7);
					const tickCount = Math.min(Math.max(weeksInRange, 2), 40);
					const ticks = [];

					for (let i = 0; i <= tickCount; i++) {
						const tickTime = oldestDate.getTime() + (i / tickCount) * (newestDate.getTime() - oldestDate.getTime());
						const tickDate = new Date(tickTime);
						// Check if a post exists within 4 days of this tick
						const postIndex = items.findIndex((p) => Math.abs(new Date(p.dateTime).getTime() - tickTime) < 1000 * 60 * 60 * 24 * 4);
						ticks.push({
							date: tickDate,
							hasPost: postIndex !== -1,
							postIndex,
							// Invert position so newest is at top (0) and oldest at bottom (1)
							position: 1 - i / tickCount,
						});
					}

					// Current post position on timeline (inverted: newest at top)
					const currentPost = items[activeIndex];
					const currentTime = currentPost?.dateTime ? new Date(currentPost.dateTime).getTime() : newestDate.getTime();
					const currentPosition = 1 - (currentTime - oldestDate.getTime()) / (newestDate.getTime() - oldestDate.getTime());

					return (
						<div
							className={`fixed right-4 top-1/2 -translate-y-1/2 h-[70%] flex flex-col items-end select-none z-50 transition-opacity duration-300 ${
								showTimeline ? "opacity-100" : "opacity-0 md:opacity-100"
							}`}
							onMouseEnter={() => {
								// Keep timeline visible while hovering
								setShowTimeline(true);
								if (timelineTimeoutRef.current) {
									clearTimeout(timelineTimeoutRef.current);
									timelineTimeoutRef.current = null;
								}
							}}
							onMouseLeave={() => {
								// Start hide timer when mouse leaves
								timelineTimeoutRef.current = setTimeout(() => {
									setShowTimeline(false);
								}, 2000);
							}}
							onMouseDown={(e) => {
								const rect = e.currentTarget.getBoundingClientRect();
								const handleDrag = (moveEvent: MouseEvent) => {
									const y = moveEvent.clientY - rect.top;
									const percentage = Math.max(0, Math.min(1, y / rect.height));
									// Invert: top (0%) = newest, bottom (100%) = oldest
									const targetTime = newestDate.getTime() - percentage * (newestDate.getTime() - oldestDate.getTime());
									// Find nearest post
									let nearestIndex = 0;
									let nearestDiff = Infinity;
									items.forEach((post, i) => {
										const diff = Math.abs(new Date(post.dateTime).getTime() - targetTime);
										if (diff < nearestDiff) {
											nearestDiff = diff;
											nearestIndex = i;
										}
									});
									setActiveIndex(nearestIndex);
								};
								const handleUp = () => {
									window.removeEventListener("mousemove", handleDrag);
									window.removeEventListener("mouseup", handleUp);
								};
								handleDrag(e.nativeEvent);
								window.addEventListener("mousemove", handleDrag);
								window.addEventListener("mouseup", handleUp);
							}}
							onTouchStart={(e) => {
								const rect = e.currentTarget.getBoundingClientRect();
								const handleTouchDrag = (moveEvent: TouchEvent) => {
									if (moveEvent.touches.length !== 1) return;
									moveEvent.preventDefault();
									const y = moveEvent.touches[0].clientY - rect.top;
									const percentage = Math.max(0, Math.min(1, y / rect.height));
									// Invert: top (0%) = newest, bottom (100%) = oldest
									const targetTime = newestDate.getTime() - percentage * (newestDate.getTime() - oldestDate.getTime());
									// Find nearest post
									let nearestIndex = 0;
									let nearestDiff = Infinity;
									items.forEach((post, i) => {
										const diff = Math.abs(new Date(post.dateTime).getTime() - targetTime);
										if (diff < nearestDiff) {
											nearestDiff = diff;
											nearestIndex = i;
										}
									});
									setActiveIndex(nearestIndex);
								};
								const handleTouchEnd = () => {
									window.removeEventListener("touchmove", handleTouchDrag);
									window.removeEventListener("touchend", handleTouchEnd);
									window.removeEventListener("touchcancel", handleTouchEnd);
									// Start hide timer after touch ends
									timelineTimeoutRef.current = setTimeout(() => {
										setShowTimeline(false);
									}, 2000);
								};
								// Keep timeline visible during touch
								setShowTimeline(true);
								if (timelineTimeoutRef.current) {
									clearTimeout(timelineTimeoutRef.current);
									timelineTimeoutRef.current = null;
								}
								// Initial position
								if (e.touches.length === 1) {
									const y = e.touches[0].clientY - rect.top;
									const percentage = Math.max(0, Math.min(1, y / rect.height));
									const targetTime = newestDate.getTime() - percentage * (newestDate.getTime() - oldestDate.getTime());
									let nearestIndex = 0;
									let nearestDiff = Infinity;
									items.forEach((post, i) => {
										const diff = Math.abs(new Date(post.dateTime).getTime() - targetTime);
										if (diff < nearestDiff) {
											nearestDiff = diff;
											nearestIndex = i;
										}
									});
									setActiveIndex(nearestIndex);
								}
								window.addEventListener("touchmove", handleTouchDrag, { passive: false });
								window.addEventListener("touchend", handleTouchEnd);
								window.addEventListener("touchcancel", handleTouchEnd);
							}}
						>
							{/* Timeline track */}
							<div className="relative h-full w-24 cursor-pointer">
								{/* Background week tick marks */}
								{ticks.map((tick, i) => {
									if (i === 0 || i === ticks.length - 1) return null;
									return (
										<div key={`week-${i}`} className="absolute right-0" style={{ top: `${tick.position * 100}%`, transform: "translateY(-50%)" }}>
											<div className="w-2 h-px bg-light-gray/50" />
										</div>
									);
								})}

								{/* Post tick marks at their actual positions (inverted) */}
								{items.map((post, index) => {
									const postTime = new Date(post.dateTime).getTime();
									const postPosition = 1 - (postTime - oldestDate.getTime()) / (newestDate.getTime() - oldestDate.getTime());
									const isActive = index === activeIndex;

									return (
										<div
											key={post.href}
											className="absolute right-0 flex items-center justify-end"
											style={{ top: `${postPosition * 100}%`, transform: "translateY(-50%)" }}
											onClick={() => setActiveIndex(index)}
										>
											<motion.div
												animate={{
													width: isActive ? 32 : 20,
													height: isActive ? 2 : 1,
													backgroundColor: isActive ? "rgba(0,0,0,0.8)" : "rgba(120, 118, 112, 0.4)",
												}}
												transition={{ type: "spring", stiffness: 500, damping: 30 }}
											/>
										</div>
									);
								})}

								{/* Floating active date label */}
								<motion.div
									className="absolute right-10 pointer-events-none"
									animate={{ top: `${currentPosition * 100}%` }}
									transition={{ type: "spring", stiffness: 800, damping: 35 }}
									style={{ transform: "translateY(-50%)" }}
								>
									<span className="text-xs text-black whitespace-nowrap font-medium font-mono bg-white/80 px-2 py-1 border border-light-gray/20 rounded-sm backdrop-blur-sm">
										{currentPost?.dateTime &&
											new Date(currentPost.dateTime).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												year: "numeric",
											})}
									</span>
								</motion.div>
							</div>

							{/* Labels - swapped: Newest at top, Oldest at bottom */}
							{/* Hide "Newest" when active post is near top (position < 0.1) */}
							<div
								className={`absolute top-0 right-10 -translate-y-1/2 text-[10px] text-black font-medium font-mono bg-white/90 px-2 py-0.5 border border-light-gray/20 rounded-sm backdrop-blur-sm transition-opacity duration-200 ${
									currentPosition < 0.1 ? "opacity-0" : "opacity-100"
								}`}
							>
								Newest
							</div>
							{/* Hide oldest date when active post is near bottom (position > 0.9) */}
							<div
								className={`absolute bottom-0 right-10 translate-y-1/2 text-[10px] text-light-gray font-mono bg-white/90 px-2 py-0.5 border border-light-gray/20 rounded-sm backdrop-blur-sm transition-opacity duration-200 ${
									currentPosition > 0.9 ? "opacity-0" : "opacity-100"
								}`}
							>
								{oldestDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
							</div>
						</div>
					);
				})()}
			</motion.div>
		</div>
	);
}
