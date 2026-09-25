"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OutlineItem, OutlinePosition } from "./constants";
import { useSound } from "../../../context/SoundContext";
import { useReaderMode } from "../../../context/ReaderModeContext";

type OutlinePanelProps = {
	isOpen: boolean;
	mode: "side";
	width: number;
	position: OutlinePosition;
	borderClass: string;
	textClass: string;
	items: OutlineItem[];
	activeId: string | null;
	onClose: () => void;
	onNavigate: () => void;
	isDarkMode: boolean;
};

// Delay before the panel slides out after the cursor leaves its zone,
// so quick mouse passes across the strip don't flash it
const HIDE_DELAY_MS = 250;

export default function OutlinePanel({ isOpen, width, position, textClass, items, activeId, onNavigate, isDarkMode }: OutlinePanelProps) {
	const { playSound } = useSound();
	const { isReaderMode } = useReaderMode();
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
	const [isHovered, setIsHovered] = useState(false);
	const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!isOpen || !activeId) return;
		const container = scrollContainerRef.current;
		const activeEl = itemRefs.current.get(activeId);
		if (!container || !activeEl) return;

		const containerRect = container.getBoundingClientRect();
		const elRect = activeEl.getBoundingClientRect();
		const padding = 24;

		if (elRect.top < containerRect.top + padding || elRect.bottom > containerRect.bottom - padding) {
			const targetTop = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
			container.scrollTo({ top: targetTop, behavior: "smooth" });
		}
	}, [activeId, isOpen]);

	useEffect(() => {
		return () => {
			if (hideTimerRef.current) {
				clearTimeout(hideTimerRef.current);
			}
		};
	}, []);

	const handleZoneEnter = useCallback(() => {
		if (hideTimerRef.current) {
			clearTimeout(hideTimerRef.current);
			hideTimerRef.current = null;
		}
		setIsHovered(true);
	}, []);

	const handleZoneLeave = useCallback(() => {
		if (hideTimerRef.current) {
			clearTimeout(hideTimerRef.current);
		}
		hideTimerRef.current = setTimeout(() => setIsHovered(false), HIDE_DELAY_MS);
	}, []);

	if (!isOpen || !items.length) return null;

	const { top, left } = position;

	const separatorClass = isDarkMode ? "border-white/10" : "border-black/10";
	// Always visible by default; in reader mode it hides and reveals on hover.
	const isVisible = !isReaderMode || isHovered;

	const aside = (
		<aside
			data-no-morph
			className={`absolute inset-y-0 left-0 flex flex-col ${textClass} transition-all duration-300 ease-out ${
				isVisible ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0 pointer-events-none"
			}`}
		>
			<div className="flex items-center gap-2 px-4 pb-3" style={{ paddingTop: typeof top === "number" ? top : undefined }}>
				<div className="flex items-center gap-2 font-departure-mono font-medium text-[0.9rem] uppercase tracking-[0.16em]">
					{/* <TreeViewIcon size={16} weight="duotone" aria-hidden="true" /> */}
					Contents
				</div>
			</div>
			<div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-2">
				<nav aria-label="Page outline">
					<ul className="flex flex-col gap-1.5 font-mono uppercase">
						{items.map((item) => {
							const isActive = item.id === activeId;
							return (
								<li key={item.id}>
									<a
										ref={(el) => {
											if (el) {
												itemRefs.current.set(item.id, el);
											} else {
												itemRefs.current.delete(item.id);
											}
										}}
										href={`#${item.id}`}
										onClick={() => {
											onNavigate();
										}}
										onMouseEnter={() => playSound("hover")}
										className={`group flex items-center gap-2 px-2 py-1.5 leading-snug transition-colors ${item.level === 2 ? "pl-6" : "pl-2"} ${
											isActive ? `font-medium text-[10px] xl:text-xs 2xl:text-sm ${isDarkMode ? "text-white" : "text-black"}` : `text-[9px] xl:text-[10px] 2xl:text-xs opacity-80`
										}`}
									>
										<span
											className={`font-mono text-xs transition-all duration-200 ${
												isActive ? (isDarkMode ? "text-white" : "text-black") : "text-current opacity-50 group-hover:opacity-90"
											}`}
											aria-hidden="true"
										>
											{item.level === 2 ? "–" : "+"}
										</span>
										<span className="block overflow-hidden text-ellipsis">{item.title}</span>
									</a>
								</li>
							);
						})}
					</ul>
				</nav>
			</div>
		</aside>
	);

	return createPortal(
		<div
			data-no-morph
			className="fixed inset-y-0 left-0 z-90"
			style={{
				left: typeof left === "number" || typeof left === "string" ? left : undefined,
				width,
			}}
			onMouseEnter={handleZoneEnter}
			onMouseLeave={handleZoneLeave}
		>
			{aside}
		</div>,
		document.body
	);
}
