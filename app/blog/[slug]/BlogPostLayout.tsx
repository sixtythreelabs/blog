"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ClockFading } from "lucide-react";
import { AtIcon, EyeglassesIcon, HouseIcon, MoonIcon, SunIcon, SpeakerHighIcon, SpeakerSlashIcon } from "@phosphor-icons/react";

import CopyLinkButton from "../../components/CopyLinkButton";
import LikeButton from "../../components/Blog/LikeButton";
import AuthorsList from "../../components/Blog/AuthorsList";
import PixelIconDisplay from "../../components/Blog/DotMatrixIcon";
import { ScrollProgressWheel } from "../../components/Blog/ScrollProgressWheel";
import Dither from "../../components/Dither";
import { resolveIcon } from "../../utils/icons";
import { formatShortDate } from "../../utils/date";
import { ScrambleText } from "../../components/ScrambleText";
import { usePageTransition } from "../../components/PageTransitionProvider";
import TransitionLink from "../../components/TransitionLink";
import { MobileActionBar, SocialLinkItem, OutlinePanel, InlineOutline, CONTROL_BUTTON_BASE, THEME_PRESETS, BLOG_FONT_FAMILY, CONTACT_EMAIL, SOCIAL_LINKS } from "../../components/Blog/Post";
import { useArticleOutline, useThemeSync } from "../../hooks";
import type { BlogPostMetadata } from "../../utils/mdx";
import { hasPreloaderRun } from "../../utils/preloader";
import { useLayoutContext } from "../../context/LayoutContext";
import { useSound } from "../../context/SoundContext";
import { useReaderMode } from "../../context/ReaderModeContext";

type BlogPostLayoutProps = {
	metadata: BlogPostMetadata;
	readTimeLabel: string;
	formattedDate: string;
	children: ReactNode;
};

// Minimum viewport width (px) for the progress wheel to be visible by default
const PROGRESS_WHEEL_MIN_WIDTH = 1280;

export default function BlogPostLayout({ metadata, readTimeLabel, formattedDate, children }: BlogPostLayoutProps) {
	const [isDarkMode, setIsDarkMode] = useState(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem("blog-theme") === "dark";
	});
	// SSR-safe hydration flag: false on the server, true once hydrated.
	const mounted = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false
	);
	const articleRef = useRef<HTMLDivElement | null>(null);
	const [isMobileBarActive, setIsMobileBarActive] = useState(false);
	const [isPreloaderDone, setIsPreloaderDone] = useState<boolean>(() => hasPreloaderRun());
	// const [scrollProgress, setScrollProgress] = useState(0); // Removed state to prevent re-renders
	const { startTransition, isTransitioning } = usePageTransition();
	const { setMorphEnabled, setDigitProgress } = useLayoutContext();
	const { playSound, isMuted, toggleMute } = useSound();
	const { isReaderMode, setReaderMode } = useReaderMode();

	const [isProgressWheelVisible, setIsProgressWheelVisible] = useState(() => {
		if (typeof window === "undefined") return true;
		return window.innerWidth >= PROGRESS_WHEEL_MIN_WIDTH;
	});
	const userToggledWheel = useRef(false);

	const { outlineItems, outlineWidth, outlinePosition, activeHeadingId, isOutlineOpen, handleCloseOutline, handleNavigateFromOutline } = useArticleOutline({
		articleRef,
		mounted,
		isMobileBarActive,
		isPreloaderDone,
		isTransitioning,
		postHref: metadata.href,
	});

	const handleToggleProgressWheel = useCallback(() => {
		userToggledWheel.current = true;
		setIsProgressWheelVisible((prev) => !prev);
	}, []);

	const handleToggleReaderMode = useCallback(() => {
		setReaderMode(!isReaderMode);
	}, [isReaderMode, setReaderMode]);

	useThemeSync({ isDarkMode, mounted });

	// Reader mode restores the native system cursor while active
	useEffect(() => {
		const root = document.documentElement;
		root.classList.toggle("reader-mode", isReaderMode);
		return () => root.classList.remove("reader-mode");
	}, [isReaderMode]);

	// Layout effect (not passive): the morph state is shared with the home page,
	// whose hook enables it in a layout effect. Layout-phase ordering guarantees
	// this page's reset runs before the next page's setup on navigation.
	useLayoutEffect(() => {
		setMorphEnabled(false);
		setDigitProgress("left", 0);
		setDigitProgress("right", 0);
		setMorphEnabled(true);

		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const docHeight = document.documentElement.scrollHeight;
			const winHeight = window.innerHeight;
			const scrollable = Math.max(1, docHeight - winHeight);
			const scrollPercent = Math.min(1, Math.max(0, scrollTop / scrollable));

			setDigitProgress("left", scrollPercent);
			setDigitProgress("right", scrollPercent);
			// setScrollProgress(scrollPercent);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("resize", handleScroll);
		handleScroll();

		return () => {
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("resize", handleScroll);
			setMorphEnabled(false);
			setDigitProgress("left", 0);
			setDigitProgress("right", 0);
		};
	}, [setMorphEnabled, setDigitProgress]);

	const handleScrub = useCallback((newProgress: number) => {
		const docHeight = document.documentElement.scrollHeight;
		const winHeight = window.innerHeight;
		const scrollable = Math.max(1, docHeight - winHeight);
		window.scrollTo({ top: newProgress * scrollable, behavior: "instant" });
		// setScrollProgress(newProgress);
	}, []);

	// Auto-hide progress wheel on narrow screens
	useEffect(() => {
		if (!mounted) return;
		const handleResize = () => {
			const isWideEnough = window.innerWidth >= PROGRESS_WHEEL_MIN_WIDTH;
			// Only auto-hide, don't force show (respect user's manual toggle)
			if (!isWideEnough && !userToggledWheel.current) {
				setIsProgressWheelVisible(false);
			}
		};
		handleResize(); // Check on mount
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [mounted]);

	const theme = useMemo(() => (isDarkMode ? THEME_PRESETS.dark : THEME_PRESETS.light), [isDarkMode]);

	// Only linked H1 headings in the article body appear on the progress wheel.
	const sectionsWithPositions = useMemo(() => {
		if (!mounted) return [];
		const docHeight = document.documentElement.scrollHeight;

		return Array.from(document.querySelectorAll<HTMLElement>("article h1[id]")).map((el) => {
			// Use getBoundingClientRect + scrollY for absolute document position
			// (offsetTop is relative to offsetParent, not document root)
			const absoluteTop = el.getBoundingClientRect().top + window.scrollY;
			// Divide by docHeight to get position as % of document
			const position = Math.min(1, Math.max(0, absoluteTop / docHeight));
			return { id: el.id, title: el.textContent?.trim() || "Section", level: 1 as const, position };
		});
		// Removed scrollProgress dependency
	}, [mounted, outlineItems]);

	const handleToggleTheme = useCallback(() => {
		const next = !isDarkMode;
		setIsDarkMode(next);
		localStorage.setItem("blog-theme", next ? "dark" : "light");
	}, [isDarkMode]);

	const handleBackToBlog = useCallback(() => {
		if (isTransitioning) return;
		startTransition({ href: "/blog", label: "Blog" });
	}, [isTransitioning, startTransition]);

	const handleGoHome = useCallback(() => {
		if (isTransitioning) return;
		startTransition({ href: "/", label: "Home" });
	}, [isTransitioning, startTransition]);

	useEffect(() => {
		if (!mounted) return;
		const mq = window.matchMedia("(max-width: 768px)");
		const handleQueryChange = () => setIsMobileBarActive(mq.matches);
		handleQueryChange();
		try {
			mq.addEventListener("change", handleQueryChange);
			return () => mq.removeEventListener("change", handleQueryChange);
		} catch {
			mq.addListener(handleQueryChange);
			return () => mq.removeListener(handleQueryChange);
		}
	}, [mounted]);

	// Prevent cursor morph on images inside the article
	useEffect(() => {
		const article = articleRef.current;
		if (!mounted || !article) return;

		const mark = () => {
			for (const img of article.querySelectorAll("img")) {
				img.setAttribute("data-no-morph", "");
				const parent = img.parentElement;
				if (!parent) continue;
				// Mark wrapping <a> that contains only the image
				if (parent.tagName === "A" && parent.children.length === 1) {
					parent.setAttribute("data-no-morph", "");
					const grandparent = parent.parentElement;
					if (grandparent?.tagName === "P" && grandparent.children.length === 1) {
						grandparent.setAttribute("data-no-morph", "");
					}
				}
				// Mark wrapping <p> that contains only the image
				if (parent.tagName === "P" && parent.children.length === 1) {
					parent.setAttribute("data-no-morph", "");
				}
			}
		};

		mark();

		const observer = new MutationObserver(mark);
		observer.observe(article, { childList: true, subtree: true });
		return () => observer.disconnect();
	}, [mounted]);

	useEffect(() => {
		if (isPreloaderDone) return;
		const handlePreloaderComplete = () => setIsPreloaderDone(true);
		window.addEventListener("app:preloader-complete", handlePreloaderComplete, { once: true });
		window.addEventListener("app:preloader-start-exit", handlePreloaderComplete, { once: true });
		return () => {
			window.removeEventListener("app:preloader-complete", handlePreloaderComplete);
			window.removeEventListener("app:preloader-start-exit", handlePreloaderComplete);
		};
	}, [isPreloaderDone]);

	const hasContactEmail = Boolean(CONTACT_EMAIL);
	const readerModeButtonVariant = isReaderMode ? theme.linkButton : theme.toggleButton;
	const soundButtonVariant = isMuted ? theme.toggleButton : theme.linkButton;
	const resolvedIcon = resolveIcon(metadata.icon);

	return (
		<>
			<main className={`${theme.main} min-h-screen px-4 pt-20 pb-16 sm:pt-28 sm:px-8 lg:px-12`} style={{ fontFamily: BLOG_FONT_FAMILY }}>
				<div className="flex justify-center">
					<div className="relative flex w-full max-w-[1080px] min-w-[368px] mt-px ml-px flex-col">
						<div ref={articleRef} className="ul-cross w-full">
							<article
								data-code-theme={isDarkMode ? "dark" : "light"}
								className={`relative border ${theme.articleSurface} px-8 pt-0 pb-6 sm:px-12 sm:pt-10 sm:pb-4 lg:px-36 lg:pt-20 lg:pb-8`}
							>
								<div className={`absolute inset-0 grid grid-cols-1 lg:grid-cols-3 pointer-events-none select-none transition-opacity duration-300 ${isReaderMode ? "opacity-0" : "opacity-100"}`}>
									<div className={`hidden lg:block border-r border-dashed ${theme.gridLine}`} />
									<div className={`hidden lg:block border-r border-dashed ${theme.gridLine}`} />
								</div>
								<div className="relative z-10 flex flex-col gap-0">
									<div className="sticky top-24 z-20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<div
											className={`hidden md:flex items-center gap-3 transition-transform duration-300 ease-out ${isReaderMode ? "-translate-y-1" : "translate-y-0"}`}
											inert={isReaderMode}
										>
											<button
												type="button"
												onClick={handleBackToBlog}
												onMouseEnter={() => playSound("hover")}
												className={`reader-control hidden md:inline-flex ${CONTROL_BUTTON_BASE} gap-2 min-w-[105px] backdrop-blur-lg ${theme.linkButton} ${isReaderMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}
												disabled={isTransitioning}
												aria-label="Back to blog"
											>
												<span aria-hidden="true">←</span>
												<ScrambleText text="Back to blog" scrambleOnHover />
											</button>
											<button
												type="button"
												onClick={handleGoHome}
												onMouseEnter={() => playSound("hover")}
												className={`reader-control hidden md:inline-flex ${CONTROL_BUTTON_BASE} w-9 px-0 backdrop-blur-lg ${theme.toggleButton} ${isReaderMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}
												disabled={isTransitioning}
												aria-label="Go to homepage"
											>
												<HouseIcon className="h-6 w-6" strokeWidth={1.5} />
												<span className="sr-only">Go to homepage</span>
											</button>
										</div>
										<div className="hidden md:flex items-center gap-3">
											<div
												className={`flex items-center gap-3 transition-transform duration-300 ease-out ${isReaderMode ? "-translate-y-1" : "translate-y-0"}`}
												inert={isReaderMode}
											>
											<button
												type="button"
												className={`reader-control hidden md:inline-flex ${CONTROL_BUTTON_BASE} w-9 px-0 overflow-hidden backdrop-blur-lg ${theme.toggleButton} ${isReaderMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}
												onClick={handleToggleTheme}
												onMouseEnter={() => playSound("hover")}
												aria-pressed={isDarkMode}
												aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
											>
												{isDarkMode ? <SunIcon size={24} /> : <MoonIcon size={24} />}
												<span className="sr-only">{isDarkMode ? "Switch to light mode" : "Switch to dark mode"}</span>
											</button>
											<button
												type="button"
												className={`reader-control hidden md:inline-flex ${CONTROL_BUTTON_BASE} w-9 px-0 overflow-hidden backdrop-blur-lg ${soundButtonVariant} ${isReaderMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}
												onClick={() => {
													toggleMute();
												}}
												onMouseEnter={() => playSound("hover")}
												aria-pressed={!isMuted}
												aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
											>
												{isMuted ? <SpeakerSlashIcon size={24} /> : <SpeakerHighIcon size={24} />}
												<span className="sr-only">{isMuted ? "Unmute sounds" : "Mute sounds"}</span>
											</button>
											</div>
											<button
												type="button"
												className={`hidden md:inline-flex ${CONTROL_BUTTON_BASE} w-9 px-0 backdrop-blur-lg ${readerModeButtonVariant}`}
												onClick={handleToggleReaderMode}
												onMouseEnter={() => playSound("hover")}
												aria-pressed={isReaderMode}
												aria-label={isReaderMode ? "Exit reader mode" : "Enter reader mode"}
												title={isReaderMode ? "Exit reader mode" : "Enter reader mode"}
												style={{ touchAction: "manipulation" }}
											>
												<EyeglassesIcon size={24} />
												<span className="sr-only">Toggle reader mode</span>
											</button>
										</div>
									</div>

									<header className="flex flex-col gap-4 items-center">
										<div className="inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center" aria-hidden="true">
											<PixelIconDisplay
												svg={resolvedIcon.type === "phosphor" ? <resolvedIcon.Component size={48} weight="regular" /> : undefined}
												svgUrl={resolvedIcon.type === "custom" ? resolvedIcon.url : undefined}
												iconKey={metadata.icon}
												gridSize={32}
												dotScale={0.8}
												sparkleDensity={0.7}
												shape="square"
												color="currentColor"
												sparkleEnabled
												className={`w-full h-full ${theme.heading}`}
												alignY="bottom"
											/>
										</div>
										<h1 className={`text-[1.75rem] sm:text-4xl md:text-5xl leading-tight font-semibold text-center font-fixel-display tracking-[-0.03em] ${theme.heading}`}>
											{metadata.label}
										</h1>
										{metadata.authors.length ? (
											<AuthorsList
												authors={metadata.authors}
												prefix=" "
												className={`text-[0.6875rem] sm:text-xs md:text-[0.8125rem] uppercase tracking-[0.2em] text-center font-departure-mono ${theme.muted}`}
												linkClassName={`${theme.muted} underline decoration-dotted underline-offset-4 transition-colors`}
												onLinkHover={() => playSound("hover")}
											/>
										) : null}
									<div className={`w-full flex items-center gap-2 sm:gap-3 text-[0.65rem] sm:text-xs ${theme.muted}`}>
										<span className="inline-flex items-center gap-1.5 sm:gap-2 shrink-0">
											<ClockFading className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={1.5} aria-hidden="true" />
											<span className="sm:hidden">{readTimeLabel.replace(/ read$/i, "")}</span>
											<span className="hidden sm:inline">{readTimeLabel}</span>
										</span>
										<CopyLinkButton href={metadata.href} variant={theme.copyVariant} />
										<time className={`ml-auto text-[0.65rem] sm:text-xs shrink-0 ${theme.muted}`} dateTime={metadata.dateTime}>
											<span className="sm:hidden">{formatShortDate(metadata.dateTime)}</span>
											<span className="hidden sm:inline">{formattedDate}</span>
										</time>
									</div>
										{!isOutlineOpen && outlineItems.length > 0 && <InlineOutline items={outlineItems} isDarkMode={isDarkMode} />}
										{metadata.intro ? (
											<p className={`w-full text-[0.8rem] sm:text-sm md:text-[0.9375rem] leading-[1.8] tracking-[-0.025em] ${theme.content}`}>{metadata.intro}</p>
										) : null}
									</header>

									<div
										data-article-content
										className={`mt-3 text-[0.8rem] sm:text-sm md:text-[0.9375rem] leading-[1.8] tracking-[-0.025em] space-y-4 [&>:is(h1,h2,h3,h4,h5,h6)]:font-semibold [&>:is(h1,h2,h3,h4,h5,h6)]:font-fixel-display [&>:is(h1,h2,h3,h4,h5,h6)]:tracking-[-0.03em] [&>h1]:text-2xl [&>h1]:sm:text-3xl [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h3]:text-lg [&>h3]:sm:text-xl [&>h4]:text-base [&>h4]:sm:text-lg [&>h5]:text-sm [&>h5]:sm:text-base [&>h6]:text-[0.8125rem] [&>h6]:sm:text-sm [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-4 [&_a]:italic [&_:not(pre)>code]:text-[0.9em] ${theme.content}`}
									>
										{children}
									</div>

									<div className="mt-20 print:hidden">
										<LikeButton slug={metadata.href} title={metadata.label} theme={theme} />
									</div>
								</div>
							</article>

							<section className={`relative ul-cross-br border ${theme.articleSurface} border-t-0 mb-20 p-6 sm:p-8`} aria-label="Article footer">
								<h2 id="footer" className="sr-only">
									EOF
								</h2>
								<div className="pointer-events-none absolute inset-0 overflow-hidden">
									<div className={`absolute inset-0 opacity-80 ${theme.ditherBlendMode}`}>
										<Dither waveColor={theme.ditherWaveColor} colorNum={6} pixelSize={1.2} enableMouseInteraction={false} />
									</div>
									<div className={`absolute inset-0 bg-linear-to-b ${isDarkMode ? "from-black/80 via-black/20 to-black/90" : "from-white/80 via-white/10 to-white/90"}`} />
								</div>

								<div className="relative z-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
									<div className="flex flex-col gap-5">
										<div className={`border ${theme.sectionBorder} ${theme.sectionBg} p-5 flex flex-col gap-3`}>
											<div className="flex flex-col gap-1">
												<p className={`text-[0.65rem] uppercase tracking-[0.35em] ${theme.muted}`}>Status</p>
												<ScrambleText text="/// EOF" className={`mt-2 font-mono text-xs ${theme.heading}`} scrambleOnMount />
											</div>
											<div className="flex flex-col gap-3">
												<p className={`text-xs font-semi-mono ${theme.content} leading-relaxed`}>Meet the human behind the post.</p>
												<TransitionLink
													href="/about"
													className={`inline-flex w-full h-8 items-center justify-center border ${theme.linkButton} px-6 text-xs font-mono uppercase tracking-[0.4em] transition-colors`}
													transitionLabel="About"
												>
													About
												</TransitionLink>
											</div>
										</div>
									</div>

									<div className={`border ${theme.sectionBorder} ${theme.sectionBg} p-5 flex flex-col gap-6 h-full`}>
										<p className={`text-[0.65rem] uppercase tracking-[0.35em] ${theme.muted}`}>Communication</p>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full content-between">
											{hasContactEmail && <SocialLinkItem label="Send Email" href={`mailto:${CONTACT_EMAIL}`} Icon={AtIcon} theme={theme} gridLineClass={theme.gridLine} />}
											{SOCIAL_LINKS.map((link) => (
												<SocialLinkItem key={link.label} label={link.label} href={link.href} Icon={link.Icon} theme={theme} gridLineClass={theme.gridLine} />
											))}
										</div>
									</div>
								</div>
							</section>
						</div>
					</div>
				</div>

				{mounted && !isTransitioning && isPreloaderDone && (
					<>
						<OutlinePanel
							isOpen={isOutlineOpen}
							mode="side"
							width={outlineWidth}
							position={outlinePosition}
							borderClass={theme.outlineBorder}
							textClass={theme.outlineText}
							items={outlineItems}
							activeId={activeHeadingId}
							onClose={handleCloseOutline}
							onNavigate={handleNavigateFromOutline}
							isDarkMode={isDarkMode}
						/>
						{isProgressWheelVisible && (
							<ScrollProgressWheel
								onScrub={handleScrub}
								onClose={handleToggleProgressWheel}
								isDarkMode={isDarkMode}
								theme={{ bg: theme.main }}
								sections={sectionsWithPositions}
								labelsHidden={isOutlineOpen}
							/>
						)}
						<MobileActionBar
							isDarkMode={isDarkMode}
							hasOutlineItems={outlineItems.length > 0}
							isProgressWheelVisible={isProgressWheelVisible}
							onToggleTheme={handleToggleTheme}
							onToggleProgressWheel={handleToggleProgressWheel}
						/>
					</>
				)}
			</main>
		</>
	);
}
