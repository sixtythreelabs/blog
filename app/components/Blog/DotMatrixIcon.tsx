"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LucideIcon } from "lucide-react";
import { useSvgToImage } from "../../hooks/useSvgToImage";
import { ICON_DOTS } from "../../generated/icon-dots";

// --- TYPES ---

interface PixelData {
	x: number;
	y: number;
	id: number;
}

interface SparkleData {
	cx: number;
	cy: number;
	radius: number;
	/** Stable per-pixel value (deterministic for baked icons) - drives animation timing so SSR and client agree */
	id: number;
}

export interface PixelIconDisplayProps {
	icon?: LucideIcon;
	svg?: React.ReactNode;
	svgUrl?: string;
	/** Frontmatter icon key (e.g. "QuestionMarkIcon" / "zig.svg") - enables build-time baked dot data for instant SSR rendering */
	iconKey?: string;
	gridSize: number;
	dotScale: number;
	color: string;
	shape?: "circle" | "square";
	sparkleEnabled?: boolean;
	enableOnHover?: boolean;
	sparkleDensity?: number;
	className?: string;
	alignX?: "left" | "center" | "right";
	alignY?: "top" | "center" | "bottom";
}

// --- PIXEL DISPLAY COMPONENT ---

// Module-level cache so repeated icons rasterize once per URL/grid/alignment
const pixelCache = new Map<string, PixelData[]>();

// Deterministic hash so sparkle behavior is stable across renders and builds
const deterministicRandom = (seed: string) => {
	let h = 2166136261;
	for (let i = 0; i < seed.length; i++) {
		h ^= seed.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return ((h >>> 0) % 10000) / 10000;
};

// Alignment is pure math on the raw sample grid - applied per render from props
const alignPixels = (pixels: PixelData[], gridSize: number, alignX: "left" | "center" | "right", alignY: "top" | "center" | "bottom"): PixelData[] => {
	if (pixels.length === 0) return [];

	const minX = Math.min(...pixels.map((p) => p.x));
	const maxX = Math.max(...pixels.map((p) => p.x));
	const minY = Math.min(...pixels.map((p) => p.y));
	const maxY = Math.max(...pixels.map((p) => p.y));

	const contentWidth = maxX - minX + 1;
	const contentHeight = maxY - minY + 1;

	let offsetX = 0;
	let offsetY = 0;

	if (alignX === "left") offsetX = -minX;
	else if (alignX === "right") offsetX = gridSize - 1 - maxX;
	else offsetX = Math.floor((gridSize - contentWidth) / 2) - minX;

	if (alignY === "top") offsetY = -minY;
	else if (alignY === "bottom") offsetY = gridSize - 1 - maxY;
	else offsetY = Math.floor((gridSize - contentHeight) / 2) - minY;

	return pixels.map((p) => ({
		...p,
		x: p.x + offsetX,
		y: p.y + offsetY,
	}));
};

const PixelIconDisplay: React.FC<PixelIconDisplayProps> = ({
	icon: Icon,
	svg,
	svgUrl,
	iconKey,
	gridSize,
	dotScale,
	color,
	shape = "circle",
	sparkleEnabled = false,
	enableOnHover = false,
	sparkleDensity = 0.2,
	className = "",
	alignX = "center",
	alignY = "center",
}) => {
	const [runtimePixels, setRuntimePixels] = useState<PixelData[] | null>(null);
	const [isHovered, setIsHovered] = useState(false);

	// 0. Build-time baked dot data: instant, no canvas/blob/image work, SSR-renderable
	const bakedData = useMemo(() => {
		const key = iconKey?.trim().toLowerCase();
		if (!key) return null;
		const baked = ICON_DOTS[key];
		return baked && baked.gridSize === gridSize ? baked : null;
	}, [iconKey, gridSize]);

	// Baked pixels get deterministic sparkle ids and alignment (pure math, works during SSR)
	const bakedPixels = useMemo(() => {
		if (!bakedData) return null;
		const raw = bakedData.pixels.map(([x, y]) => ({ x, y, id: deterministicRandom(`${iconKey ?? ""}:${x}:${y}`) }));
		return alignPixels(raw, gridSize, alignX, alignY);
	}, [bakedData, iconKey, gridSize, alignX, alignY]);

	// 1. Runtime fallback: Convert Icon/SVG to Image URL (skipped when svgUrl is provided directly or baked data exists)
	const contentToRender = svgUrl || bakedData ? null : Icon ? <Icon size={gridSize} strokeWidth={2.5} fill="none" color="black" /> : svg;
	const { imageUrl, hiddenRef } = useSvgToImage<HTMLDivElement>(contentToRender, [gridSize]);

	const resolvedUrl = svgUrl ?? imageUrl;

	// 2. Runtime rasterization phase: only used when no baked data exists
	useEffect(() => {
		if (bakedData || !resolvedUrl) return;

		const cacheKey = `${resolvedUrl}|${gridSize}|${alignX}|${alignY}`;
		const cached = pixelCache.get(cacheKey);
		if (cached) {
			setRuntimePixels(cached);
			return;
		}

		let cancelled = false;

		const img = new Image();
		img.onload = () => {
			if (cancelled) return;

			const canvas = document.createElement("canvas");
			canvas.width = gridSize;
			canvas.height = gridSize;
			const ctx = canvas.getContext("2d");

			if (!ctx) return;

			ctx.clearRect(0, 0, gridSize, gridSize);
			ctx.drawImage(img, 0, 0, gridSize, gridSize);

			const imageData = ctx.getImageData(0, 0, gridSize, gridSize).data;
			const newPixels: PixelData[] = [];

			for (let y = 0; y < gridSize; y++) {
				for (let x = 0; x < gridSize; x++) {
					const index = (y * gridSize + x) * 4;
					const alpha = imageData[index + 3];

					if (alpha > 50) {
						newPixels.push({ x, y, id: Math.random() });
					}
				}
			}

			const alignedPixels = alignPixels(newPixels, gridSize, alignX, alignY);
			pixelCache.set(cacheKey, alignedPixels);
			setRuntimePixels(alignedPixels);
		};

		img.src = resolvedUrl;

		return () => {
			cancelled = true;
		};
	}, [bakedData, resolvedUrl, gridSize, alignX, alignY]);

	const pixelData = bakedPixels ?? runtimePixels ?? [];

	// 3. Partition Phase: Split pixels into Static vs Sparkling
	const { staticPath, sparkles } = useMemo(() => {
		if (pixelData.length === 0) return { staticPath: "", sparkles: [] as SparkleData[] };

		let d = "";
		const radius = 0.5 * dotScale;
		const sparkleList: SparkleData[] = [];

		// Determine if we should separate potential sparkle pixels from the static path
		// We do this if sparkles are enabled OR if hover-effect is enabled (so they are ready to animate)
		const shouldSeparate = sparkleEnabled || enableOnHover;

		pixelData.forEach((pixel) => {
			const { x, y, id } = pixel;

			// Determine if this pixel is a candidate for sparkling
			const isSparkleCandidate = shouldSeparate && id > 1 - sparkleDensity;

			const cx = x + 0.5;
			const cy = y + 0.5;

			if (isSparkleCandidate) {
				sparkleList.push({ cx, cy, radius, id });
			} else {
				// Add to the static path
				if (shape === "square") {
					const s = radius * 2;
					const x0 = cx - radius;
					const y0 = cy - radius;
					d += `M${x0.toFixed(3)} ${y0.toFixed(3)} h${s.toFixed(3)} v${s.toFixed(3)} h-${s.toFixed(3)} Z `;
				} else {
					d += `M${cx.toFixed(3)} ${cy.toFixed(3)} m -${radius.toFixed(3)}, 0 a ${radius.toFixed(3)},${radius.toFixed(3)} 0 1,0 ${(radius * 2).toFixed(3)},0 a ${radius.toFixed(
						3
					)},${radius.toFixed(3)} 0 1,0 -${(radius * 2).toFixed(3)},0 `;
				}
			}
		});

		return { staticPath: d, sparkles: sparkleList };
	}, [pixelData, dotScale, shape, sparkleEnabled, enableOnHover, sparkleDensity]); // Removed isHovered dependency

	const showSparkle = sparkleEnabled || (enableOnHover && isHovered);

	return (
		<div className={`relative overflow-hidden ${className}`} onMouseEnter={() => enableOnHover && setIsHovered(true)} onMouseLeave={() => enableOnHover && setIsHovered(false)}>
			{/* Actual Display */}
			{pixelData.length > 0 ? (
				<svg viewBox={`0 0 ${gridSize} ${gridSize}`} className="w-full h-full" style={{ color }}>
					{/* Layer 1: The Main Static Body (One single path for performance) */}
					<path d={staticPath} fill="currentColor" />

					{/* Layer 2: The Sparkles (Individual elements for animation) */}
					{sparkles.map((s, i) => {
						// Logic for the stabilizer overlay:
						// If sparkles are globally enabled, we never want to cover them (opacity 0).
						// If hover is enabled, we uncover them (opacity 0) when hovered, and cover them (opacity 1) when not.
						// Otherwise (shouldn't happen given useMemo logic, but safe fallback), cover them.
						const stabilizerOpacity = showSparkle ? 0 : 1;

						// Only attach the twinkle animation when the sparkles are actually visible -
						// hidden sparkle layers (hover mode at rest) cost nothing this way.
						// Timing derives from the pixel's stable id so SSR and client renders agree.
						const animationStyle = showSparkle
							? {
									animation: `twinkle ${1.5 + s.id}s ease-in-out infinite`,
									animationDelay: `${((s.id * 1013) % 1) * 2}s`,
							  }
							: undefined;

						const stabilizerStyle = {
							opacity: stabilizerOpacity,
							transition: "opacity 1s ease-in-out",
						};

						return (
							<React.Fragment key={i}>
								{shape === "square" ? (
									<>
										{/* Base Sparkling Layer */}
										<rect x={s.cx - s.radius} y={s.cy - s.radius} width={s.radius * 2} height={s.radius * 2} fill="currentColor" style={animationStyle} />
										{/* Stabilizer Overlay Layer */}
										<rect x={s.cx - s.radius} y={s.cy - s.radius} width={s.radius * 2} height={s.radius * 2} fill="currentColor" style={stabilizerStyle} />
									</>
								) : (
									<>
										{/* Base Sparkling Layer */}
										<circle cx={s.cx} cy={s.cy} r={s.radius} fill="currentColor" style={animationStyle} />
										{/* Stabilizer Overlay Layer */}
										<circle cx={s.cx} cy={s.cy} r={s.radius} fill="currentColor" style={stabilizerStyle} />
									</>
								)}
							</React.Fragment>
						);
					})}
				</svg>
			) : (
				<div className="animate-pulse w-full h-full bg-current opacity-20" />
			)}

			{/* Hidden Render Container (only needed for Phosphor/Lucide icon → SVG serialization path) */}
			{!svgUrl && !bakedData && (
				<div ref={hiddenRef} style={{ position: "absolute", opacity: 0, pointerEvents: "none", zIndex: -1 }} aria-hidden="true">
					{contentToRender}
				</div>
			)}
		</div>
	);
};

export default PixelIconDisplay;
