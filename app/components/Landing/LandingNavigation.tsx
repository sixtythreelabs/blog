"use client";

import { useCallback, useState } from "react";
import TransitionLink from "../TransitionLink";
import { ScrambleText } from "../ScrambleText";
import { CONTENT } from "../../utils/content";

const useScrambleSignal = () => {
	const [signal, setSignal] = useState(0);

	const trigger = useCallback(() => {
		setSignal((value) => value + 1);
	}, []);

	return { signal, trigger };
};

type LandingNavigationProps = {
	isLoaded: boolean;
};

export const LandingNavigation = ({ isLoaded }: LandingNavigationProps) => {
	const aboutScramble = useScrambleSignal();
	const twitterScramble = useScrambleSignal();
	const blogScramble = useScrambleSignal();
	const contactScramble = useScrambleSignal();
	const projectsScramble = useScrambleSignal();

	return (
		<div className="grid grid-cols-2 font-mono tracking-tighter pt-4 gap-x-2">
			<ScrambleText as="p" className="m-0 text-10xs text-light-gray/80 min-w-0 wrap-break-word" text="GET IN TOUCH" scrambleOnMount={isLoaded} aria-label="Get in touch" />

			<TransitionLink
				className="m-0 text-10xs text-off-white/80 group min-w-0 wrap-break-word"
				href={CONTENT.links.about.href}
				transitionLabel="About"
				onMouseEnter={aboutScramble.trigger}
				onMouseLeave={aboutScramble.trigger}
			>
				<span aria-label={CONTENT.links.about.label}>
					<ScrambleText
						className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-2"
						text={CONTENT.links.about.label}
						trigger={aboutScramble.signal}
						scrambleOnMount={isLoaded}
					/>
				</span>
			</TransitionLink>

			<TransitionLink
				className="m-0 text-10xs text-off-white/80 group"
				href={CONTENT.links.twitter.href}
				target="_blank"
				rel="noreferrer"
				onMouseEnter={twitterScramble.trigger}
				onMouseLeave={twitterScramble.trigger}
			>
				<span aria-label={CONTENT.links.twitter.label}>
					<ScrambleText
						className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-2"
						text={CONTENT.links.twitter.label}
						trigger={twitterScramble.signal}
						scrambleOnMount={isLoaded}
					/>
				</span>
			</TransitionLink>

			<TransitionLink
				className="m-0 text-10xs text-off-white/80 group"
				href={CONTENT.links.blog.href}
				transitionLabel="Blog"
				onMouseEnter={blogScramble.trigger}
				onMouseLeave={blogScramble.trigger}
			>
				<span aria-label={CONTENT.links.blog.label}>
					<ScrambleText
						className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-2"
						text={CONTENT.links.blog.label}
						trigger={blogScramble.signal}
						scrambleOnMount={isLoaded}
					/>
				</span>
			</TransitionLink>

			<TransitionLink className="m-0 text-10xs text-off-white/80 group" href={CONTENT.links.linkedin.href} onMouseEnter={contactScramble.trigger} onMouseLeave={contactScramble.trigger}>
				<span aria-label={CONTENT.links.linkedin.label}>
					<ScrambleText
						className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-2"
						text={CONTENT.links.linkedin.label}
						trigger={contactScramble.signal}
						scrambleOnMount={isLoaded}
					/>
				</span>
			</TransitionLink>

			<TransitionLink
				className="m-0 text-10xs text-off-white/80 group"
				href={CONTENT.links.projects.href}
				target="_blank"
				rel="noreferrer"
				onMouseEnter={projectsScramble.trigger}
				onMouseLeave={projectsScramble.trigger}
			>
				<span aria-label={CONTENT.links.projects.label}>
					<ScrambleText
						className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-2"
						text={CONTENT.links.projects.label}
						trigger={projectsScramble.signal}
						scrambleOnMount={isLoaded}
					/>
				</span>
			</TransitionLink>
		</div>
	);
};
