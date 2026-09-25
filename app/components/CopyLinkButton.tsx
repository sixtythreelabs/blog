"use client";

import { useCallback, useMemo, useState } from "react";
import { LinkIcon, CheckIcon } from "@phosphor-icons/react";
import { useSound } from "../context/SoundContext";

type CopyLinkButtonProps = {
	href: string;
	className?: string;
	variant?: "light" | "dark";
};

const VARIANT_STYLES = {
	light: {
		button: "text-black/80",
		label: "text-black",
	},
	dark: {
		button: "text-foreground/80",
		label: "text-foreground",
	},
};

const buildAbsoluteUrl = (href: string) => {
	if (typeof window === "undefined") return href;
	if (href.startsWith("http://") || href.startsWith("https://")) return href;
	return `${window.location.origin}${href.startsWith("/") ? href : `/${href}`}`;
};

export default function CopyLinkButton({ href, className, variant = "light", showLabel = true }: CopyLinkButtonProps & { showLabel?: boolean }) {
	const [copied, setCopied] = useState(false);
	const variantClasses = VARIANT_STYLES[variant];
	const targetUrl = useMemo(() => buildAbsoluteUrl(href), [href]);
	const { playSound } = useSound();

	const handleCopy = useCallback(async () => {
		try {
			await navigator?.clipboard?.writeText(targetUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	}, [targetUrl]);

	return (
		<button
			type="button"
			onClick={() => {
				handleCopy();
			}}
			onMouseEnter={() => playSound("hover")}
			className={`inline-flex items-center gap-2 bg-transparent px-2 py-1 transition-opacity duration-200 ${variantClasses.button} ${className ?? ""}`}
			aria-label={copied ? "Link copied" : "Copy post URL"}
		>
			{copied ? <CheckIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" weight="bold" /> : <LinkIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" weight="bold" />}
			{showLabel && <span className={`hidden sm:inline font-semibold ${variantClasses.label}`}>Copy URL</span>}
		</button>
	);
}
