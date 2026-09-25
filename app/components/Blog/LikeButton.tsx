"use client";
import { useState, useSyncExternalStore } from "react";
import { HeartStraightIcon } from "@phosphor-icons/react";
import posthog from "posthog-js";
import { useSound } from "../../context/SoundContext";
import { ScrambleText } from "../ScrambleText";
import PixelIconDisplay from "./DotMatrixIcon";

type Theme = {
	gridLine: string;
	muted: string;
	[key: string]: unknown;
};

export default function LikeButton({ slug, title, theme }: { slug: string; title: string; theme?: Theme }) {
	const [justLiked, setJustLiked] = useState(false);
	const [isExiting, setIsExiting] = useState(false);
	const { playSound } = useSound();

	// SSR-safe hydration flag: false on the server, true once hydrated
	const hydrated = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false
	);

	// Like state lives in localStorage (external store), so read it through a subscription
	const storedLiked = useSyncExternalStore(
		(onStoreChange) => {
			window.addEventListener("storage", onStoreChange);
			return () => window.removeEventListener("storage", onStoreChange);
		},
		() => localStorage.getItem(`liked_${slug}`) === "true",
		() => false
	);

	const liked = hydrated ? storedLiked || justLiked : null;

	const handleLike = () => {
		if (isExiting) return;

		playSound("unlock");
		setIsExiting(true);
		localStorage.setItem(`liked_${slug}`, "true");

		posthog.capture("post_liked", {
			post_slug: slug,
			post_title: title,
			location: "blog_footer",
		});

		// Wait for scramble animation to complete before hiding
		setTimeout(() => {
			setJustLiked(true);
		}, 1500);
	};

	const borderColor = theme?.gridLine || "border-gray-200/50 dark:border-gray-800/50";

	// Don't render anything if already liked or still loading
	if (liked === null || liked === true) {
		return null;
	}

	return (
		<div className={`w-full flex items-center justify-center pt-6 border-t ${borderColor} transition-opacity duration-500 ${isExiting ? "opacity-50" : "opacity-100"}`}>
			<button
				onClick={handleLike}
				onMouseEnter={() => !isExiting && playSound("hover")}
				disabled={isExiting}
				data-no-press-sound
				className={`
					group inline-flex items-center justify-center gap-3 px-4 py-2
					transition-all duration-300
					text-xs font-mono uppercase tracking-[0.2em]
					${theme?.muted || "text-gray-500 dark:text-gray-400"}
					${isExiting ? "cursor-default" : ""}
				`}
				aria-label={isExiting ? "Post liked" : "Like"}
			>
				<span>{isExiting ? <ScrambleText text="Liked" scrambleOnMount /> : "Liked this post?"}</span>
				<span className={`w-5 h-5 transition-transform duration-300  ${isExiting ? "scale-100" : "group-hover:scale-110"}`}>
					<PixelIconDisplay
						svg={<HeartStraightIcon size={20} weight="fill" />}
						gridSize={24}
						dotScale={0.85}
						sparkleDensity={0.5}
						shape="square"
						color="currentColor"
						sparkleEnabled={true}
					/>
				</span>
			</button>
		</div>
	);
}
