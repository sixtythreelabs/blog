"use client";

import { createPortal } from "react-dom";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { HouseIcon, MoonIcon, SunIcon, DotsThreeOutlineIcon, BooksIcon, SpeakerHighIcon, SpeakerSlashIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import TransitionLink from "../../TransitionLink";
import { BLOG_FONT_FAMILY } from "./constants";
import { useScrollDirection, useMediaQuery, useLongPress } from "../../../hooks";
import { useSound } from "../../../context/SoundContext";
import { useReaderMode } from "../../../context/ReaderModeContext";
import ReaderStatusPill from "../Nav/ReaderStatusPill";

type MobileActionBarProps = {
	isDarkMode: boolean;
	hasOutlineItems: boolean;
	isProgressWheelVisible: boolean;
	onToggleTheme: () => void;
	onToggleProgressWheel: () => void;
};

const ICON_SIZE = 18;

// How long the first-collapse hint stays visible before auto-dismissing
const HINT_DURATION_MS = 4000;
// How long the reader-mode on/off feedback stays visible
const STATUS_DURATION_MS = 1200;
// How long the "long press to unlock" tooltip stays visible
const TOOLTIP_DURATION_MS = 2000;
// Window after a toggle where the collapse sound is skipped (toggle has its own)
const TOGGLE_SOUND_WINDOW_MS = 300;

function MobileActionBar({ isDarkMode, hasOutlineItems, isProgressWheelVisible, onToggleTheme, onToggleProgressWheel }: MobileActionBarProps) {
	const { scrollDirection, setScrollDirection } = useScrollDirection({ upThreshold: 100, disabled: isProgressWheelVisible });
	const { playSound, isMuted, toggleMute } = useSound();
	const { isReaderMode, setReaderMode, hasSeenHint, markHintSeen } = useReaderMode();
	const isMobile = useMediaQuery("(max-width: 767px)");
	// Manual expand override when progress wheel is visible
	const [manualExpanded, setManualExpanded] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastToggleTimeRef = useRef(0);
	const prevCollapsedRef = useRef(false);
	// Reset manual expand state when the progress wheel becomes visible
	const [prevWheelVisible, setPrevWheelVisible] = useState(isProgressWheelVisible);

	if (prevWheelVisible !== isProgressWheelVisible) {
		setPrevWheelVisible(isProgressWheelVisible);
		if (isProgressWheelVisible) {
			setManualExpanded(false);
		}
	}

	// Reader mode locks the bar collapsed and takes precedence over the
	// progress-wheel override; otherwise use the existing logic.
	const isCollapsed = isReaderMode ? true : isProgressWheelVisible ? !manualExpanded : scrollDirection === "down";

	// Play sound when collapsed state changes, except right after a reader-mode
	// toggle (which has its own sound) and when the hint is about to show.
	useEffect(() => {
		const collapsedChanged = prevCollapsedRef.current !== isCollapsed;
		prevCollapsedRef.current = isCollapsed;
		if (!collapsedChanged) return;
		if (Date.now() - lastToggleTimeRef.current < TOGGLE_SOUND_WINDOW_MS) return;
		const hintWillShow = isCollapsed && !hasSeenHint && !isReaderMode;
		if (hintWillShow) return;
		if (isMobile) {
			playSound("hover");
		}
	}, [isCollapsed, isMobile, playSound, hasSeenHint, isReaderMode]);

	const showStatus = useCallback((message: string, duration = STATUS_DURATION_MS) => {
		if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
		setStatusMessage(message);
		statusTimerRef.current = setTimeout(() => {
			setStatusMessage(null);
			statusTimerRef.current = null;
		}, duration);
	}, []);

	const handleExpand = useCallback(() => {
		if (isReaderMode) {
			showStatus("Long press to unlock", TOOLTIP_DURATION_MS);
			return;
		}
		if (isProgressWheelVisible) {
			setManualExpanded(true);
		} else {
			setScrollDirection("up");
		}
	}, [isReaderMode, isProgressWheelVisible, setScrollDirection, showStatus]);

	useEffect(() => {
		return () => {
			if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
		};
	}, []);

	const handleLongPress = useCallback(() => {
		lastToggleTimeRef.current = Date.now();
		markHintSeen();
		playSound(isReaderMode ? "click" : "unlock");
		setReaderMode(!isReaderMode);
		showStatus(isReaderMode ? "Reader mode off" : "Reader mode");
	}, [isReaderMode, markHintSeen, playSound, setReaderMode, showStatus]);

	const longPressHandlers = useLongPress({ onLongPress: handleLongPress });

	// Hint the gesture the first time the bar folds into dots, then never again
	// this session. Auto-hides by marking the hint as seen.
	const showHint = isCollapsed && !hasSeenHint && !isReaderMode;
	useEffect(() => {
		if (!showHint) return;
		playSound("hover");
		const timer = setTimeout(markHintSeen, HINT_DURATION_MS);
		return () => clearTimeout(timer);
	}, [showHint, playSound, markHintSeen]);

	const pillMessage = statusMessage ?? (showHint ? "Long press to lock" : null);

	if (!isMobile) return null;

	return createPortal(
		<div className="md:hidden fixed bottom-2 left-0 right-0 z-100 flex justify-center px-4" style={{ fontFamily: BLOG_FONT_FAMILY }}>
			<div className="relative">
				<ReaderStatusPill message={pillMessage} />
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
					className={`flex items-center justify-center shrink-0 border border-light-gray/50 text-off-white backdrop-blur-sm overflow-hidden select-none [-webkit-touch-callout:none] touch-manipulation ${isDarkMode ? "bg-black/50" : "bg-black/90"}`}
					{...longPressHandlers}
				>
					<AnimatePresence mode="popLayout" initial={false}>
						{isCollapsed ? (
							<motion.button
								key="collapsed"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.15 }}
								className="px-1.75"
								data-no-press-sound
								onClick={handleExpand}
								onMouseEnter={() => playSound("hover")}
								aria-label={isReaderMode ? "Reader mode active. Long press to exit" : "Expand menu"}
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
								<TransitionLink href="/" className="flex items-center gap-2 no-underline" transitionLabel="Home" aria-label="Go to homepage">
									<HouseIcon size={ICON_SIZE} weight="duotone" />
									<span className="sr-only">Go to homepage</span>
								</TransitionLink>

								<div className="h-4 w-px shrink-0 bg-light-gray" />

								<TransitionLink href="/blog" className="flex items-center gap-2 no-underline" transitionLabel="All blogs" aria-label="View all blogs">
									<BooksIcon size={ICON_SIZE} weight="duotone" />
									<span className="sr-only">View all blogs</span>
								</TransitionLink>

								<div className="h-4 w-px shrink-0 bg-light-gray" />

								<button
									type="button"
									onClick={() => {
										toggleMute();
									}}
									onMouseEnter={() => playSound("hover")}
									className="flex items-center"
									aria-pressed={!isMuted}
									aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
								>
									{isMuted ? <SpeakerSlashIcon size={ICON_SIZE} weight="duotone" /> : <SpeakerHighIcon size={ICON_SIZE} weight="duotone" />}
									<span className="sr-only">{isMuted ? "Unmute sounds" : "Mute sounds"}</span>
								</button>

								<div className="h-4 w-px shrink-0 bg-light-gray" />

								<button
									type="button"
									onClick={() => {
										onToggleTheme();
									}}
									onMouseEnter={() => playSound("hover")}
									className="flex items-center"
									aria-pressed={isDarkMode}
									aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
								>
									{isDarkMode ? <SunIcon size={ICON_SIZE} weight="duotone" /> : <MoonIcon size={ICON_SIZE} weight="duotone" />}
									<span className="sr-only">{isDarkMode ? "Switch to light mode" : "Switch to dark mode"}</span>
								</button>

								{hasOutlineItems && (
									<>
										<div className="h-4 w-px shrink-0 bg-light-gray" />
										<button
											type="button"
											onClick={onToggleProgressWheel}
											onMouseEnter={() => playSound("hover")}
											className="flex items-center"
											aria-pressed={isProgressWheelVisible}
											aria-label="Toggle progress wheel"
										>
											<svg viewBox="4 5 16 14" fill="none" className="h-[18px] w-[18px]">
												<path d="M13.5 18.5L9 18.5M13.5 15.5L9 15.5M13.5 9L9 9M13.5 6L9 6M16.5 12.25L6 12.25" stroke="currentColor" strokeLinecap="square" />
											</svg>
											<span className="sr-only">Toggle progress wheel</span>
										</button>
									</>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</div>
		</div>,
		document.body
	);
}

export default memo(MobileActionBar);
