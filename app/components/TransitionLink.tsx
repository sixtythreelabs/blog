"use client";

import Link, { type LinkProps } from "next/link";
import { AnchorHTMLAttributes, MouseEvent, forwardRef } from "react";
import { usePageTransition } from "./PageTransitionProvider";
import { useSound } from "../context/SoundContext";

type TransitionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
	Omit<LinkProps, "href"> & {
		href: string;
		transitionLabel?: string;
	};

const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(function TransitionLink(
	{ href, onClick, transitionLabel, children, target, prefetch, ...rest },
	ref
) {
	const { startTransition, isTransitioning } = usePageTransition();
	const { playSound } = useSound();

	const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
		onClick?.(event);
		if (event.defaultPrevented) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
		if (target === "_blank") return;
		if (!href.startsWith("/") || href.startsWith("#")) return;
		event.preventDefault();
		if (isTransitioning) return;
		startTransition({ href, label: transitionLabel });
	};

	return (
		<Link
			ref={ref}
			href={href}
			target={target}
			prefetch={prefetch}
			{...rest}
			onClick={handleClick}
			onMouseEnter={(e) => {
				playSound("hover");
				rest.onMouseEnter?.(e);
			}}
		>
			{children}
		</Link>
	);
});

TransitionLink.displayName = "TransitionLink";

export default TransitionLink;
