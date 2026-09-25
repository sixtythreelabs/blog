"use client";

import { SpeakerHighIcon, SpeakerSlashIcon } from "@phosphor-icons/react";
import { ScrambleText } from "../ScrambleText";
import { CONTENT } from "../../utils/content";
import { useSound } from "../../context/SoundContext";

type LandingControlsProps = {
	isLoaded: boolean;
};

export function LandingControls({ isLoaded }: LandingControlsProps) {
	const { playSound, isMuted, toggleMute } = useSound();

	return (
		<div className="flex flex-col gap-4 w-full">
			<div className="flex justify-between items-center text-xs md:text-sm font-mono text-off-white/60 tracking-tighter uppercase">
				<button
					onClick={() => toggleMute()}
					onMouseEnter={() => playSound("hover")}
					className="flex items-center gap-2 hover:text-off-white transition-colors cursor-pointer"
					aria-pressed={!isMuted}
					aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
				>
					{isMuted ? <SpeakerSlashIcon size={16} /> : <SpeakerHighIcon size={16} />}
					<ScrambleText text={isMuted ? "unmute" : "mute"} scrambleOnMount={isLoaded} scrambleOnHover />
				</button>
				<a href={CONTENT.links.contact.href} className="hover:text-off-white transition-colors cursor-pointer" onMouseEnter={() => playSound("hover")}>
					<ScrambleText text="CONTACT [+]" scrambleOnMount={isLoaded} scrambleOnHover />
				</a>
			</div>
			<div className="w-full h-px bg-light-gray/20" />
		</div>
	);
}
