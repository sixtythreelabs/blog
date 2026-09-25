"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "../utils/gsap";
import { waitForAppReady } from "../utils/preloader";
import { useSound } from "../context/SoundContext";

const Preloader = () => {
	const [count, setCount] = useState(0);
	const [loadingText, setLoadingText] = useState("Booting up...");
	const [isReady, setIsReady] = useState(false);
	const exitTimelineRef = useRef<gsap.core.Tween | null>(null);
	const introTimelineRef = useRef<gsap.core.Timeline | null>(null);
	const { playSound } = useSound();

	const startExit = useCallback(() => {
		if (exitTimelineRef.current) return;

		// Restore body scroll before exit animation starts
		document.body.style.overflow = "";

		// Play exit sound
		playSound("unlock");

		exitTimelineRef.current = gsap.to(".preloader", {
			yPercent: -100,
			duration: 0.5,
			ease: "power4.inOut",
			onStart: () => {
				window.dispatchEvent(new CustomEvent("app:preloader-start-exit"));
			},
			onComplete: () => {
				window.dispatchEvent(new CustomEvent("app:preloader-complete"));
			},
		});
	}, [playSound]);

	// Lock body scroll on mount
	useEffect(() => {
		// Store original overflow style
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			// Restore original overflow style on unmount
			document.body.style.overflow = originalOverflow;
		};
	}, []);

	useEffect(() => {
		if (!isReady) return;

		const exitTimer = window.setTimeout(() => {
			startExit();
		}, 180);

		return () => window.clearTimeout(exitTimer);
	}, [isReady, startExit]);

	useEffect(() => {
		const counter = { value: 0 };

		const updateProgress = () => {
			const newCount = Math.round(counter.value);
			setCount(newCount);
			gsap.set(".preloader-bar", { width: `${newCount}%` });
		};

		// Create a promise that resolves when the intro animation is done
		const introAnimationPromise = new Promise<void>((resolve) => {
			introTimelineRef.current = gsap.timeline({
				onComplete: () => {
					resolve();
				},
			});

			// Animate the progress bar and counter together
			introTimelineRef.current
				.to(counter, {
					value: 72,
					duration: 0.85,
					ease: "power4.inOut",
					onUpdate: updateProgress,
				})
				.to(
					".scramble-text",
					{
						scrambleText: {
							text: "0x3634206279746573",
							tweenLength: false,
							chars: "01",
							revealDelay: 0.5,
						},
					},
					0
				)
				// Switch to hex flip text and animate the digit flip
				.call(
					() => {
						gsap.set(".scramble-text", { opacity: 0 });
						gsap.set(".hex-flip-text", { opacity: 1 });
						// Set initial position: second span starts below
						gsap.set(".flip-container span:last-child", { yPercent: 100 });
					},
					[],
					"+=0.15"
				)
				.to(
					".flip-container span:first-child",
					{
						yPercent: -100,
						duration: 0.32,
						ease: "power4.inOut",
					},
					"+=0.15"
				)
				.to(
					".flip-container span:last-child",
					{
						yPercent: 0,
						duration: 0.32,
						ease: "power4.inOut",
					},
					"<"
				)
				.call(() => setLoadingText("Loading Assets..."))
				.to(
					counter,
					{
						value: 100,
						duration: 0.6,
						ease: "power2.in",
						onUpdate: updateProgress,
					},
					"+=0.25"
				)
				.to(
					".hex-flip-text",
					{
						scrambleText: {
							text: "63",
							revealDelay: 0.25,
							chars: "01",
						},
					},
					"<"
				)
				.to({}, { duration: 0.2 });
		});

		// Wait for both the intro animation AND the app to be ready
		Promise.all([introAnimationPromise, waitForAppReady()]).then(() => {
			setLoadingText("System Ready");
			setIsReady(true);
		});

		return () => {
			introTimelineRef.current?.kill();
			exitTimelineRef.current?.kill();
		};
	}, []);

	return (
		<div className="preloader fixed bottom-0 left-0 w-full h-full bg-background z-200 flex flex-col items-center justify-center p-4 sm:p-8 isolate">
			<div className="hex-container relative z-10 text-lg sm:text-lg md:text-xl lg:text-2xl text-foreground/80 font-mono">
				<div className="scramble-text"></div>
				<div className="hex-flip-text" style={{ opacity: 0 }}>
					0x363
					<div className="flip-container">
						<span>4</span>
						<span>3</span>
					</div>
					206279746573
				</div>
			</div>

			<div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 text-foreground/80 text-xs sm:text-sm font-mono">{loadingText}</div>
			<div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 text-foreground/80 text-xs sm:text-sm font-mono">{count}%</div>
			<div className="preloader-bar-container absolute bottom-0 left-0 w-full h-full z-20 mix-blend-difference">
				<div className="preloader-bar h-full bg-foreground" style={{ width: "0%" }}></div>
			</div>
		</div>
	);
};

export default Preloader;
