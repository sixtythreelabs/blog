"use client";

import { usePathname } from "next/navigation";
import { useState, useCallback, type ReactNode } from "react";
import { LinkIcon, CheckIcon } from "@phosphor-icons/react";
import { useSound } from "../../context/SoundContext";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type LinkedHeadingProps = {
	as: HeadingTag;
	id?: string;
	children: ReactNode;
	className?: string;
};

export default function LinkedHeading({ as: Component, id, children, className = "" }: LinkedHeadingProps) {
	const pathname = usePathname();
	const [copied, setCopied] = useState(false);
	const { playSound } = useSound();
	const href = id ? `${pathname}#${id}` : "";

	const handleCopy = useCallback(async () => {
		if (!href) return;
		const url = `${window.location.origin}${href}`;
		try {
			await navigator?.clipboard?.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	}, [href]);

	if (!id) {
		return <Component className={className}>{children}</Component>;
	}

	return (
		<Component id={id} data-press-sound onClick={handleCopy} className={`group flex items-center gap-2 cursor-pointer ${className}`}>
			{children}
			<span
				className="text-current opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity p-1 inline-flex items-center justify-center"
				aria-label={copied ? "Link copied" : "Copy post URL"}
				role="button"
				onMouseEnter={() => playSound("hover")}
			>
				{copied ? <CheckIcon size={16} weight="bold" /> : <LinkIcon size={16} weight="bold" />}
			</span>
		</Component>
	);
}
