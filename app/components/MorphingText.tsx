"use client";

import { useEffect, useRef, useMemo, useId, forwardRef, useImperativeHandle, useCallback } from "react";

interface MorphingTextProps {
	textFrom: string;
	textTo: string;
	progress?: number;
	className?: string;
	color?: string;
	opacity?: number;
	filterMode?: "auto" | "always" | "never";
	layout?: "block" | "inline";
	align?: "left" | "right" | "center";
	injectFilters?: boolean;
	blurStrength?: number;
}

export interface MorphingTextHandle {
	setProgress: (value: number) => void;
}

// Deterministic, SSR-safe unique IDs for filter references (Math.random() here
// caused hydration attribute mismatches between server and client renders)
const useUniqueId = (prefix: string) => {
	const reactId = useId();
	const id = useMemo(() => `${prefix}-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`, [prefix, reactId]);
	return id;
};

export const MorphingText = forwardRef<MorphingTextHandle, MorphingTextProps>(
	(
		{
			textFrom,
			textTo,
			progress: propProgress = 0,
			className,
			color = "var(--off-white)",
			opacity = 1,
			filterMode = "auto",
			layout = "block",
			align = "left",
			injectFilters: _injectFilters = true, // Kept for API compatibility, but now handled internally per instance
			blurStrength = 8,
		},
		ref
	) => {
		const filterId = useUniqueId("morph-filter");
		const blur1Id = useUniqueId("blur1");
		const blur2Id = useUniqueId("blur2");

		void _injectFilters;

		const text1Ref = useRef<SVGTextElement>(null);
		const text2Ref = useRef<SVGTextElement>(null);
		const svgRef = useRef<SVGSVGElement>(null);

		// Refs for filter primitives
		const matrixRef = useRef<SVGFEColorMatrixElement>(null);
		const blur1Ref = useRef<SVGFEGaussianBlurElement>(null);
		const blur2Ref = useRef<SVGFEGaussianBlurElement>(null);

		// Store current progress for imperative updates
		const progressRef = useRef(propProgress);

		// Helper to update DOM based on progress - no React state involved
		const updateDOM = useCallback(
			(fraction: number) => {
				const el1 = text1Ref.current;
				const el2 = text2Ref.current;
				const blur1 = blur1Ref.current;
				const blur2 = blur2Ref.current;
				const matrix = matrixRef.current;
				const svg = svgRef.current;

				if (!el1 || !el2 || !blur1 || !blur2) return;

				// Update text content if needed
				if (el1.textContent !== textFrom) el1.textContent = textFrom;
				if (el2.textContent !== textTo) el2.textContent = textTo;

				// Update blur and opacity
				if (fraction <= 0) {
					blur1.setAttribute("stdDeviation", "0");
					el1.style.opacity = "1";
					blur2.setAttribute("stdDeviation", "0");
					el2.style.opacity = "0";
				} else if (fraction >= 1) {
					blur1.setAttribute("stdDeviation", "0");
					el1.style.opacity = "0";
					blur2.setAttribute("stdDeviation", "0");
					el2.style.opacity = "1";
				} else {
					const blur2Val = Math.min(blurStrength / fraction - blurStrength, 100);
					const opacity2 = Math.pow(fraction, 0.4);
					blur2.setAttribute("stdDeviation", blur2Val.toString());
					el2.style.opacity = opacity2.toString();

					const invertedFraction = 1 - fraction;
					const blur1Val = Math.min(blurStrength / invertedFraction - blurStrength, 100);
					const opacity1 = Math.pow(invertedFraction, 0.4);
					blur1.setAttribute("stdDeviation", blur1Val.toString());
					el1.style.opacity = opacity1.toString();
				}

				// Update threshold filter
				if (matrix) {
					let multiplier = 255;
					let offset = -100;
					const transitionDuration = 0.05;

					if (filterMode === "auto") {
						if (fraction < transitionDuration) {
							const p = fraction / transitionDuration;
							multiplier = 1 + p * 254;
							offset = p * -100;
						} else if (fraction > 1 - transitionDuration) {
							const p = (1 - fraction) / transitionDuration;
							multiplier = 1 + p * 254;
							offset = p * -100;
						}
					}

					const values = `1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${multiplier} ${offset}`;
					matrix.setAttribute("values", values.replace(/\s+/g, " "));
				}

				// Update SVG filter attribute based on threshold active state
				if (svg) {
					const isThresholdActive = filterMode === "always" || (filterMode === "auto" && fraction > 0 && fraction < 1);
					svg.style.filter = isThresholdActive ? `url(#${filterId})` : "none";
				}
			},
			[textFrom, textTo, blurStrength, filterMode, filterId]
		);

		// Expose imperative setProgress method
		useImperativeHandle(
			ref,
			() => ({
				setProgress: (value: number) => {
					progressRef.current = value;
					updateDOM(value);
				},
			}),
			[updateDOM]
		);

		// Handle prop-based progress updates (for backwards compatibility)
		useEffect(() => {
			progressRef.current = propProgress;
			updateDOM(propProgress);
		}, [propProgress, updateDOM]);

		const isInline = layout === "inline";

		// For SVG implementation, we use a container div that holds the SVG
		// This maintains the layout behavior while using SVG for rendering
		const baseClass = isInline
			? "relative inline-block leading-none antialiased align-top"
			: "relative mx-auto h-16 w-full max-w-screen-md text-center font-sans text-[40pt] font-bold leading-none antialiased md:h-24 lg:text-[6rem]";

		// Calculate approximate width for inline layout
		const inlineSizerText = textFrom.length >= textTo.length ? textFrom : textTo;

		// Alignment for SVG text
		let textAnchor: "start" | "middle" | "end" = "start";
		let xPos = "0%";

		if (align === "center") {
			textAnchor = "middle";
			xPos = "50%";
		} else if (align === "right") {
			textAnchor = "end";
			xPos = "100%";
		}

		// Common text props
		const textProps = {
			x: xPos,
			y: "50%",
			dy: ".39em", // Vertical center adjustment
			textAnchor,
			fill: "currentColor",
			style: { willChange: "opacity", fontKerning: "none" } as React.CSSProperties,
		};

		// Initial threshold state for SSR
		const initialThresholdActive = filterMode === "always" || (filterMode === "auto" && propProgress > 0 && propProgress < 1);

		return (
			<div className={`${baseClass} ${className}`} style={{ color, opacity }}>
				{/* Hidden sizer for inline layout to maintain width */}
				{isInline && (
					<span aria-hidden="true" className="invisible block whitespace-pre">
						{inlineSizerText}
					</span>
				)}

				<svg
					ref={svgRef}
					width="100%"
					height="100%"
					className={`absolute inset-0 overflow-visible pointer-events-none ${isInline ? "" : "mx-auto"}`}
					style={{
						filter: initialThresholdActive ? `url(#${filterId})` : "none",
						// Force hardware acceleration for Safari
						transform: "translate3d(0,0,0)",
						WebkitTransform: "translate3d(0,0,0)",
					}}
				>
					<defs>
						<filter id={filterId}>
							<feColorMatrix ref={matrixRef} in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 255 -100" />
						</filter>
						<filter id={blur1Id}>
							<feGaussianBlur ref={blur1Ref} in="SourceGraphic" stdDeviation="0" />
						</filter>
						<filter id={blur2Id}>
							<feGaussianBlur ref={blur2Ref} in="SourceGraphic" stdDeviation="0" />
						</filter>
					</defs>

					<text ref={text1Ref} {...textProps} filter={`url(#${blur1Id})`} />
					<text ref={text2Ref} {...textProps} filter={`url(#${blur2Id})`} />
				</svg>
			</div>
		);
	}
);

MorphingText.displayName = "MorphingText";
