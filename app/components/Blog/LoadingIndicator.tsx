"use client";

import { useRef, useEffect } from "react";
import { gsap } from "../../utils/gsap";

const LOADING_TEXT = "Loading more...";

type LoadingIndicatorProps = {
	isLoading: boolean;
};

export default function LoadingIndicator({ isLoading }: LoadingIndicatorProps) {
	const loadingTextRef = useRef<HTMLSpanElement | null>(null);
	const scrambleTimelineRef = useRef<gsap.core.Timeline | null>(null);

	useEffect(() => {
		scrambleTimelineRef.current?.kill();
		scrambleTimelineRef.current = null;
		const loadingElement = loadingTextRef.current;

		if (!isLoading) {
			if (loadingElement) loadingElement.textContent = LOADING_TEXT;
			return;
		}

		const el = loadingElement;
		if (!el) return;

		const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.25 });
		tl.set(el, { textContent: "" });
		tl.to(el, {
			duration: 0.9,
			ease: "none",
			scrambleText: {
				text: LOADING_TEXT,
				chars: "upperAndLowerCase",
				speed: 0.55,
				revealDelay: 0,
			},
		});
		tl.set(el, { textContent: LOADING_TEXT }, ">+0.2");

		scrambleTimelineRef.current = tl;

		return () => {
			tl.kill();
			if (loadingElement) loadingElement.textContent = LOADING_TEXT;
		};
	}, [isLoading]);

	if (!isLoading) return null;

	return (
		<div className="flex flex-col items-center gap-3 py-6 text-[0.7rem] font-mono uppercase tracking-[0.12em] text-light-gray/80" role="status" aria-live="polite">
			<div className="flex items-center gap-1.5">
				{[0, 1, 2, 3].map((i) => (
					<span
						key={`pixel-${i}`}
						className="block h-3 w-3 rounded-[2px] bg-white/80 animate-pixel-blink"
						style={{ animationDelay: `${i * 0.12}s` }}
					/>
				))}
			</div>
			<span ref={loadingTextRef}>{LOADING_TEXT}</span>
		</div>
	);
}

