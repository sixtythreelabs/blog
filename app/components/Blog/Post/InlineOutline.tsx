"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import type { OutlineItem } from "./constants";
import { useSound } from "../../../context/SoundContext";

type InlineOutlineProps = {
	items: OutlineItem[];
	isDarkMode: boolean;
};

export default function InlineOutline({ items, isDarkMode }: InlineOutlineProps) {
	const { playSound } = useSound();
	const [isOpen, setIsOpen] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentHeight, setContentHeight] = useState(0);

	useEffect(() => {
		if (!contentRef.current) return;
		const observer = new ResizeObserver(([entry]) => {
			if (entry) setContentHeight(entry.contentRect.height);
		});
		observer.observe(contentRef.current);
		return () => observer.disconnect();
	}, [items]);

	const toggle = useCallback(() => {
		setIsOpen((prev) => !prev);
	}, []);

	const topLevel = items.filter((item) => item.level === 1);

	if (!topLevel.length) return null;

	const separatorClass = isDarkMode ? "border-white/10" : "border-black/10";
	const hoverClass = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5";

	return (
		<div className={`w-full border ${separatorClass} transition-colors`}>
			<button
				type="button"
				onClick={toggle}
				onMouseEnter={() => playSound("hover")}
				className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors ${hoverClass}`}
			>
				<span className="font-departure-mono text-[0.6rem] sm:text-xs uppercase tracking-[0.16em] opacity-60">Contents</span>
				<span className="flex items-center gap-2">
					<span className="text-[0.6rem] sm:text-xs font-mono uppercase tracking-wide opacity-50">
						{topLevel.length} {topLevel.length === 1 ? "section" : "sections"}
					</span>
					<ChevronDown
						className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
						strokeWidth={1.5}
					/>
				</span>
			</button>

			<div
				className="overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
				style={{ maxHeight: isOpen ? contentHeight + 16 : 0 }}
			>
				<div ref={contentRef}>
					<nav aria-label="Table of contents" className={`border-t ${separatorClass} px-3 py-2`}>
						<div className="flex flex-col gap-0.5">
							{topLevel.map((item, index) => (
								<a
									key={item.id}
									data-no-morph
									href={`#${item.id}`}
									onClick={() => {
										setIsOpen(false);
									}}
									onMouseEnter={() => playSound("hover")}
									className="flex items-center gap-2 py-1.5 text-xs sm:text-sm leading-snug no-underline not-italic opacity-70"
								>
									<span className="font-mono text-xs opacity-50 w-4 text-right tabular-nums" aria-hidden="true">{index + 1}</span>
									<span>{item.title}</span>
								</a>
							))}
						</div>
					</nav>
				</div>
			</div>
		</div>
	);
}
