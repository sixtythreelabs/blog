"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ScrambleText } from "../../ScrambleText";
import type { ThemePreset } from "./constants";
import { useSound } from "../../../context/SoundContext";

type SocialLinkItemProps = {
	label: string;
	href: string;
	Icon: LucideIcon;
	theme: ThemePreset;
	gridLineClass: string;
};

export default function SocialLinkItem({ label, href, Icon, theme, gridLineClass }: SocialLinkItemProps) {
	const [isHovered, setIsHovered] = useState(false);
	const { playSound } = useSound();

	return (
		<a
			href={href}
			target={href.startsWith("mailto:") ? undefined : "_blank"}
			rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
			className={`group flex items-center gap-3 text-sm ${theme.content} hover:${theme.heading} transition-colors`}
			onMouseEnter={() => {
				playSound("hover");
				setIsHovered(true);
			}}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className={`flex items-center justify-center w-8 h-8 border ${gridLineClass} group-hover:border-current transition-colors overflow-hidden relative`}>
				<Icon className="absolute inset-0 m-auto w-4 h-4 transform transition-transform duration-300 group-hover:-translate-y-[175%] group-hover:translate-x-[175%]" />
				<ArrowUpRight className="absolute inset-0 m-auto w-4 h-4 transform -translate-x-[175%] translate-y-[175%] transition-transform duration-300 group-hover:translate-x-0 group-hover:translate-y-0" />
			</div>
			<ScrambleText text={label} className="font-mono uppercase text-xs" trigger={isHovered} />
		</a>
	);
}
