"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSound } from "../../context/SoundContext";

function ImageViewer({ src, alt, caption, figureNumber, isDarkMode, onClose }: { src: string; alt: string; caption: string; figureNumber: number; isDarkMode: boolean; onClose: () => void }) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const captionId = useId();
	const reduceMotion = useReducedMotion();
	const hasCaptionText = caption.trim().length > 0;

	useEffect(() => {
		const dialog = dialogRef.current;
		const previousFocus = document.activeElement;
		const previousOverflow = document.body.style.overflow;
		dialog?.showModal();
		document.body.style.overflow = "hidden";
		return () => {
			dialog?.close();
			document.body.style.overflow = previousOverflow;
			if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
		};
	}, []);

	return createPortal(
		<motion.dialog
			ref={dialogRef}
			initial={{ opacity: 0, "--backdrop-opacity": 0 }}
			animate={{ opacity: 1, "--backdrop-opacity": 1 }}
			exit={{ opacity: 0, "--backdrop-opacity": 0 }}
			transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
			aria-label={alt ? `Expanded image: ${alt}` : "Expanded image"}
			aria-describedby={caption ? captionId : undefined}
			className="image-viewer fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-4 text-white outline-none sm:p-10 backdrop:bg-transparent backdrop:backdrop-blur-md backdrop:opacity-[var(--backdrop-opacity)]"
			onCancel={(event) => { event.preventDefault(); onClose(); }}
			onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
		>
			<motion.div
				initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.94 }}
				transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
				className="pointer-events-none flex h-full w-full items-center justify-center"
			>
				<div className={`pointer-events-auto relative max-w-full ${hasCaptionText ? "pb-20" : "pb-10"}`}>
					{/* Native images preserve arbitrary MDX image sources and original dimensions. */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={src} alt={alt} className={`block max-w-full border-[1.5px] object-contain ${isDarkMode ? "border-light-gray/30" : "border-light-gray/15"} ${hasCaptionText ? "max-h-[calc(100dvh-7rem)] sm:max-h-[calc(100dvh-10rem)]" : "max-h-[calc(100dvh-4.5rem)] sm:max-h-[calc(100dvh-7.5rem)]"}`} />
					<motion.p
						id={captionId}
						initial={{ clipPath: reduceMotion ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)", opacity: 0 }}
						animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
						transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.15, ease: "easeOut" }}
						// Base style matches the animation end so the final style commit doesn't flicker
						style={{ clipPath: "inset(0 0% 0 0)", opacity: 1, willChange: "clip-path, opacity" }}
						className={`absolute inset-x-0 bottom-0 m-0 overflow-y-auto pt-2 text-center font-fixel-text text-xs leading-relaxed tracking-tighter sm:text-sm ${hasCaptionText ? "h-20" : "h-10"} ${isDarkMode ? "text-white" : "text-black"}`}
					>
						{figureNumber > 0 && <span className="font-fixel-text italic tracking-normal">Fig {figureNumber}.</span>}
						{hasCaptionText && <> {caption}</>}
					</motion.p>
				</div>
			</motion.div>
			<button
				type="button"
				autoFocus
				data-no-morph
				aria-label="Close image"
				onClick={onClose}
				// Override the global unlayered button position rule.
				style={{ position: "absolute" }}
				className={`right-4 top-4 flex items-center justify-center font-departure-mono text-sm uppercase tracking-tighter sm:right-10 sm:top-10 sm:text-base ${isDarkMode ? "text-white" : "text-black"}`}
			>
				Exit
			</button>
		</motion.dialog>,
		document.body
	);
}

export default function ZoomableImage({ alt = "", ...props }: ComponentProps<"img">) {
	const [expandedImage, setExpandedImage] = useState<{ src: string; caption: string; figureNumber: number; isDarkMode: boolean } | null>(null);
	const imageRef = useRef<HTMLImageElement>(null);
	const { playSound } = useSound();

	const openImage = () => {
		const image = imageRef.current;
		if (!image?.complete || !image.naturalWidth) return;
		const caption = image.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || "";
		const isDarkMode = image.closest("[data-code-theme]")?.getAttribute("data-code-theme") === "dark";

		// Matches the CSS figure counter: order within the post's article element.
		const wrapper = image.closest("[data-figure-image]");
		const scope = image.closest("article") ?? document;
		const wrappers = Array.from(scope.querySelectorAll("[data-figure-image]"));
		const index = wrapper ? wrappers.indexOf(wrapper) : -1;
		const figureNumber = index >= 0 ? index + 1 : 0;

		setExpandedImage({ src: image.currentSrc || image.src, caption, figureNumber, isDarkMode });
		playSound("pop");
	};

	return (
		<>
			<span
				role="button"
				tabIndex={0}
				aria-label={alt ? `Expand image: ${alt}` : "Expand image"}
				aria-haspopup="dialog"
				data-figure-image
				data-no-press-sound
				data-no-morph
				className="block cursor-zoom-in"
				onMouseEnter={() => playSound("hover")}
				// Keep mouse clicks from focusing the wrapper so no focus ring lingers after closing
				onMouseDown={(event) => event.preventDefault()}
				onClick={(event) => { event.preventDefault(); event.stopPropagation(); openImage(); }}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						event.stopPropagation();
						openImage();
					}
				}}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img {...props} alt={alt} ref={imageRef} />
			</span>
			<AnimatePresence>
				{expandedImage && <ImageViewer key="image-viewer" {...expandedImage} alt={alt} onClose={() => setExpandedImage(null)} />}
			</AnimatePresence>
		</>
	);
}
