"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "../utils/gsap";

const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#________";

type ScrambleTextProps = {
	text: string;
	className?: string;
	scrambleOnMount?: boolean;
	scrambleOnHover?: boolean;
	trigger?: unknown;
	as?: "span" | "div" | "p";
	duration?: number;
};

export const ScrambleText = ({ text, className, scrambleOnMount = false, scrambleOnHover = false, trigger, as = "span", duration = 0.6 }: ScrambleTextProps) => {
	const Component = as as any; // Cast to any to avoid generic ref conflict
	const elementRef = useRef<HTMLElement>(null);
	const tweenRef = useRef<gsap.core.Tween | null>(null);

	const { contextSafe } = useGSAP(
		() => {
			const element = elementRef.current;
			if (element) element.textContent = text;

			// Handle initial mount scramble if requested
			if (scrambleOnMount) {
				runScramble();
			}
		},
		{ scope: elementRef, dependencies: [text, scrambleOnMount] } // Re-run if text changes
	);

	const runScramble = contextSafe(() => {
		const element = elementRef.current;
		if (!element) return;

		tweenRef.current?.kill();

		tweenRef.current = gsap.to(element, {
			duration: duration,
			scrambleText: {
				text: text,
				chars: SCRAMBLE_CHARS,
				speed: 1, // Utilize duration instead
				revealDelay: 0,
			},
			ease: "none",
		});
	});

	// Handle trigger prop changes
	useGSAP(
		() => {
			if (trigger !== undefined) {
				runScramble();
			}
		},
		{ scope: elementRef, dependencies: [trigger] }
	);

	const handleMouseEnter = contextSafe(() => {
		if (scrambleOnHover) {
			runScramble();
		}
	});

	return (
		<Component ref={elementRef} className={className} onMouseEnter={handleMouseEnter}>
			{text}
		</Component>
	);
};
