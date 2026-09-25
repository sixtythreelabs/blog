"use client";

import { forwardRef, useCallback, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ScrambleText } from "../ScrambleText";
import { ArticleItem } from "../../types/posts";
import { hasPreloaderRun } from "../../utils/preloader";
import { LandingNavigation } from "./LandingNavigation";
import { LandingHero } from "./LandingHero";
import { LatestPostPreview } from "./LatestPostPreview";
import { useTouchDevice } from "../../hooks/useTouchDevice";

type LandingSectionProps = {
	latestPost?: ArticleItem;
};

const LandingSection = forwardRef<HTMLElement, LandingSectionProps>(function LandingSection({ latestPost }, ref) {
	const [isLoaded, setIsLoaded] = useState(false);
	const isTouchDevice = useTouchDevice();

	const horizontalRef = useRef<HTMLDivElement>(null);
	const verticalRef = useRef<HTMLDivElement>(null);
	const coordinatesRef = useRef<HTMLDivElement>(null);
	const sectionRef = useRef<HTMLElement>(null);
	const rafId = useRef<number | null>(null);

	// Combine refs
	const setRef = useCallback(
		(node: HTMLElement | null) => {
			sectionRef.current = node;
			if (typeof ref === "function") ref(node);
			else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
		},
		[ref]
	);

	useEffect(() => {
		if (hasPreloaderRun()) {
			setIsLoaded(true);
		}

		const handlePreloaderComplete = () => {
			setIsLoaded(true);
		};

		window.addEventListener("app:preloader-complete", handlePreloaderComplete);
		return () => window.removeEventListener("app:preloader-complete", handlePreloaderComplete);
	}, []);

	const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
		if (!sectionRef.current) return;

		const clientX = e.clientX;
		const clientY = e.clientY;

		if (rafId.current) {
			cancelAnimationFrame(rafId.current);
		}

		rafId.current = requestAnimationFrame(() => {
			// Get fresh rect on every frame to account for GSAP transforms (scale, translate)
			// that are applied during scroll animations
			const section = sectionRef.current;
			const rect = section?.getBoundingClientRect();
			if (!section || !rect) return;

			const borderLeft = section.clientLeft;
			const borderTop = section.clientTop;
			const scaleX = section.offsetWidth > 0 ? rect.width / section.offsetWidth : 1;
			const scaleY = section.offsetHeight > 0 ? rect.height / section.offsetHeight : 1;

			const x = (clientX - rect.left) / scaleX - borderLeft;
			const y = (clientY - rect.top) / scaleY - borderTop;
			const crosshairX = x - 0.5;
			const crosshairY = y - 0.5;

			if (horizontalRef.current) {
				horizontalRef.current.style.transform = `translateY(${crosshairY}px)`;
			}
			if (verticalRef.current) {
				verticalRef.current.style.transform = `translateX(${crosshairX}px)`;
			}
			if (coordinatesRef.current) {
				const centerX = section.clientWidth / 2;
				const centerY = section.clientHeight / 2;

				const dx = x - centerX;
				const dy = centerY - y; // Invert Y so up is positive (North)

				const lat = parseFloat((Math.abs(dy) * 0.05).toFixed(3));
				const long = parseFloat((Math.abs(dx) * 0.05).toFixed(3));
				const latDir = dy >= 0 ? "N" : "S";
				const longDir = dx >= 0 ? "E" : "W";

				coordinatesRef.current.innerText = `[ ${long}° ${longDir} , ${lat}° ${latDir} ]`;
			}
		});
	}, []);

	return (
		<section
			ref={setRef}
			onMouseMove={handleMouseMove}
			className="absolute inset-0 flex flex-col min-h-screen h-screen p-8 gap-8 border border-light-gray/20 bg-background text-foreground overflow-hidden"
		>
			{/* Cursor crosshairs - hidden on touch devices */}
			{!isTouchDevice && (
				<>
					<div ref={horizontalRef} className="absolute top-0 left-0 w-full h-px bg-light-gray/20 pointer-events-none z-5" style={{ willChange: "transform" }} />
					<div ref={verticalRef} className="absolute top-0 left-0 h-full w-px bg-light-gray/20 pointer-events-none z-5" style={{ willChange: "transform" }} />
				</>
			)}
			{/* Coordinates */}
			<div ref={coordinatesRef} className="hidden md:block absolute bottom-8 left-8 font-mono text-10xs text-off-white/50 pointer-events-none z-20 tabular-nums">
				<ScrambleText text="[ 0° E , 0° N ]" scrambleOnMount={isLoaded} />
			</div>

			{/* Bolder corners */}
			<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-light-gray z-20" />
			<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-light-gray z-20" />
			<div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-light-gray z-20" />
			<div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-light-gray z-20" />

			<div className="absolute top-0 left-0 w-full h-[30%] z-0 pointer-events-none">
				<Image src="/images/map-narrow.avif" alt="Map background" fill className="object-cover object-left md:hidden" priority quality={100} sizes="100vw" />
				<Image src="/images/map-wide.avif" alt="Map background" fill className="object-cover object-left hidden md:block" priority quality={100} sizes="100vw" />
			</div>

			<div className="relative z-10 mt-auto h-[70%] flex flex-col justify-between gap-12 border-t border-light-gray/20 w-full">
				<LandingNavigation isLoaded={isLoaded} />

				<div className="grid grid-cols-1 md:grid-cols-2 items-end gap-x-8 gap-y-8">
					<LandingHero isLoaded={isLoaded} />

					{latestPost && <LatestPostPreview latestPost={latestPost} />}
				</div>
			</div>
		</section>
	);
});

LandingSection.displayName = "LandingSection";

export default LandingSection;
