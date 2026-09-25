"use client";

import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useSound } from "../../context/SoundContext";
import { languageIcons, fallbackIconSvg } from "./languageIcons";

type CodeBlockProps = ComponentPropsWithoutRef<"pre">;

const joinClassNames = (...values: Array<string | undefined | null>) => values.filter(Boolean).join(" ");

export default function CodeBlock({ className, children, ...props }: CodeBlockProps) {
	const shellRef = useRef<HTMLDivElement>(null);
	const preRef = useRef<HTMLPreElement>(null);
	const [copied, setCopied] = useState(false);
	const { playSound } = useSound();

	useEffect(() => {
		const codeNode = preRef.current?.querySelector("code");

		// Inject language icon into the title bar if it exists
		const shell = shellRef.current;
		const titleElement = shell?.previousElementSibling;
		if (titleElement?.hasAttribute("data-rehype-pretty-code-title")) {
			const lang = codeNode?.getAttribute("data-language");
			const iconPath = lang ? languageIcons[lang] : null;

			// Check if icon already injected
			if (!titleElement.querySelector(".code-title-icon")) {
				const iconWrapper = document.createElement("span");
				iconWrapper.className = "code-title-icon";
				iconWrapper.setAttribute("role", "img");
				iconWrapper.setAttribute("aria-label", lang || "code");
				iconWrapper.style.setProperty("--code-title-icon-url", `url("${iconPath || fallbackIconSvg}")`);

				titleElement.prepend(iconWrapper);
			}
		}
	}, [children]);

	const handleCopy = useCallback(async () => {
		const text = preRef.current?.querySelector("code")?.innerText || "";
		const clipboard = typeof navigator === "undefined" ? null : navigator.clipboard;
		if (!text || !clipboard?.writeText) return;
		try {
			await clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	}, []);

	return (
		<div ref={shellRef} className="code-block-shell">
			<button
				type="button"
				className="code-copy-button"
				onClick={() => {
					handleCopy();
				}}
				onMouseEnter={() => playSound("hover")}
				aria-live="polite"
				data-copied={copied ? "true" : "false"}
			>
				{copied ? <CheckIcon size={16} aria-hidden="true" /> : <CopyIcon size={16} weight="duotone" aria-hidden="true" />}
			</button>
			<pre ref={preRef} className={joinClassNames("code-block", className)} {...props}>
				{children}
			</pre>
		</div>
	);
}
