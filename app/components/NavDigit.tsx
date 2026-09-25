"use client";

import { forwardRef, useRef, useEffect } from "react";
import { MorphingText, MorphingTextHandle } from "./MorphingText";
import { useLayoutContext, type MorphState } from "../context/LayoutContext";

type NavDigitProps = {
	/** The word form of the digit (e.g., "six", "three") */
	label: string;
	/** The numeric form of the digit (e.g., "6", "3") */
	digit: string;
	/** Whether the flicker animation is currently playing */
	isFlickerPhase: boolean;
	/** Whether the morph animation is active */
	isMorphActive: boolean;
	/** Alignment of the digit */
	align: "left" | "right";
	/** CSS class for flicker animation targeting */
	flickerClass: string;
	/** Whether to inject SVG filters (for MorphingText) */
	injectFilters?: boolean;
	/** Blur strength for small screens */
	isSmallScreen?: boolean;
	/** Font-size multiplier (home bakes the giant size via font-size instead of transform scale) */
	fontScale?: number;
};

/**
 * A component that renders a single navbar digit with flicker and morph animations.
 * Handles three states: flickering text, morphing animation, and static digit.
 * 
 * Uses imperative updates for scroll progress to avoid React re-renders on every frame.
 */
const NavDigit = forwardRef<HTMLSpanElement, NavDigitProps>(
	({ label, digit, isFlickerPhase, isMorphActive, align, flickerClass, injectFilters = true, isSmallScreen = false, fontScale = 1 }, ref) => {
		// Blur strength scales with the digit font-size so the gooey effect
		// looks identical to the old transform-scaled version (which magnified
		// the base blur by the scale factor)
		const blurStrength = (isSmallScreen ? 2 : 8) * fontScale;
		const digitStyle = { fontSize: `calc(clamp(2rem, 6vw, 5rem) * ${fontScale})` };
		const morphingTextRef = useRef<MorphingTextHandle>(null);
		const { subscribe, getSnapshot } = useLayoutContext();

		// Subscribe to this digit's progress updates and imperatively update MorphingText
		useEffect(() => {
			if (!isMorphActive) return;

			const sideProgress = (state: MorphState) => (align === "left" ? state.leftProgress : state.rightProgress);

			// Set initial progress
			const initialState = getSnapshot();
			morphingTextRef.current?.setProgress(sideProgress(initialState));

			const unsubscribe = subscribe((state) => {
				morphingTextRef.current?.setProgress(sideProgress(state));
			});

			return unsubscribe;
		}, [isMorphActive, align, subscribe, getSnapshot]);

		// Render flickering letters during flicker phase
		if (isFlickerPhase) {
			return (
				<span ref={ref} className="font-sans text-off-white leading-none" style={digitStyle}>
					{label.split("").map((char, i) => (
						<span key={i} className={flickerClass} style={{ display: "inline-block", opacity: 0 }}>
							{char}
						</span>
					))}
				</span>
			);
		}

		// Render morphing text during morph phase
		if (isMorphActive) {
			return (
				<span ref={ref} className="font-sans text-off-white leading-none" style={digitStyle}>
					<MorphingText
						ref={morphingTextRef}
						textFrom={label}
						textTo={digit}
						layout="inline"
						align={align}
						color="inherit"
						injectFilters={injectFilters}
						blurStrength={blurStrength}
					/>
				</span>
			);
		}

		// Render static digit
		return (
			<span ref={ref} className="font-sans text-off-white leading-none" style={digitStyle}>
				{digit}
			</span>
		);
	}
);

NavDigit.displayName = "NavDigit";

export default NavDigit;
