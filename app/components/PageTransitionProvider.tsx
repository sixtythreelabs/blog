"use client";

import { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { gsap, useGSAP } from "../utils/gsap";

type TransitionRequest = {
	href: string;
	label?: string;
};

type InternalTransitionState = {
	href: string;
	normalizedPath: string;
	label: string;
};

type PageTransitionContextValue = {
	startTransition: (request: TransitionRequest) => void;
	isTransitioning: boolean;
};

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

const normalizePath = (value: string) => {
	if (!value) return "/";
	try {
		const url = new URL(value, "http://localhost");
		return url.pathname || "/";
	} catch {
		const stripped = value.split("?")[0]?.split("#")[0] ?? "/";
		if (!stripped.startsWith("/")) return `/${stripped}`;
		return stripped || "/";
	}
};

const formatTransitionLabel = (label: string) => label.toUpperCase();

const deriveLabelFromPath = (path: string) => {
	if (!path || path === "/") return "Home";
	return path
		.replace(/^\//, "")
		.split("/")
		.filter(Boolean)
		.map((segment) => segment.replace(/-/g, " "))
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" / ");
};

const RouteReadyAnnouncer = () => {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const searchKey = searchParams?.toString() ?? "";

	useEffect(() => {
		if (typeof window === "undefined") return;
		const detail = {
			pathname,
			search: searchKey,
		};
		const raf = requestAnimationFrame(() => {
			window.dispatchEvent(
				new CustomEvent("app:route-ready", {
					detail,
				})
			);
		});
		return () => cancelAnimationFrame(raf);
	}, [pathname, searchKey]);

	return null;
};

const getWindowPath = () => {
	if (typeof window === "undefined") return "/";
	try {
		return window.location.pathname || "/";
	} catch {
		return "/";
	}
};

const PANEL_TRANSITION_DURATION = 0.55;
const SCRAMBLE_DURATION = 0.58;
const TEXT_FADE_DURATION = 0.15;
const REVEAL_HOLD_DURATION = 0.1;

export const PageTransitionProvider = ({ children }: { children: ReactNode }) => {
	const router = useRouter();
	const overlayRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);
	const pendingRef = useRef<InternalTransitionState | null>(null);
	const isTransitioningRef = useRef(false);
	const pageReadyRef = useRef(false);
	const scrambleDoneRef = useRef(false);
	const coverTimelineRef = useRef<gsap.core.Timeline | null>(null);
	const revealTimelineRef = useRef<gsap.core.Timeline | null>(null);
	const scrambleTimelineRef = useRef<gsap.core.Timeline | null>(null);
	const lastKnownPathRef = useRef<string>(normalizePath(getWindowPath()));
	const [isTransitioning, setIsTransitioning] = useState(false);

	const { contextSafe } = useGSAP({ scope: overlayRef });

	const showOverlay = contextSafe(() => {
		if (!overlayRef.current) return;
		gsap.set(overlayRef.current, { autoAlpha: 1, pointerEvents: "auto" });
	});

	const hideOverlay = contextSafe(() => {
		if (!overlayRef.current) return;
		gsap.set(overlayRef.current, { autoAlpha: 0, pointerEvents: "none" });
	});

	const tryReveal = contextSafe(() => {
		if (!overlayRef.current || !panelRef.current || !pageReadyRef.current || !scrambleDoneRef.current || revealTimelineRef.current) return;

		const textEl = textRef.current;
		revealTimelineRef.current = gsap
			.timeline({
				defaults: { ease: "power4.inOut" },
				onComplete: () => {
					revealTimelineRef.current = null;
					setIsTransitioning(false);
					isTransitioningRef.current = false;
					pendingRef.current = null;
					pageReadyRef.current = false;
					scrambleDoneRef.current = false;
					hideOverlay();
					if (typeof window !== "undefined") {
						window.dispatchEvent(new CustomEvent("app:transition-end"));
					}
				},
			})
			.to({}, { duration: REVEAL_HOLD_DURATION })
			.add(() => {
				if (textEl) {
					gsap.to(textEl, { autoAlpha: 0, duration: TEXT_FADE_DURATION, ease: "power2.out" });
				}
			})
			.to(panelRef.current, {
				yPercent: -100,
				duration: PANEL_TRANSITION_DURATION,
			})
			.set(panelRef.current, { yPercent: 100 });
	});

	const startScramble = contextSafe((text: string) => {
		const target = textRef.current;
		if (!target) {
			scrambleDoneRef.current = true;
			tryReveal();
			return;
		}

		scrambleTimelineRef.current?.kill();
		scrambleTimelineRef.current = gsap.timeline({
			onComplete: () => {
				scrambleDoneRef.current = true;
				tryReveal();
			},
		});

		scrambleTimelineRef.current.set(target, { autoAlpha: 1, textContent: "" }).to(target, {
			duration: SCRAMBLE_DURATION,
			scrambleText: {
				text,
				chars: "upperCase",
				revealDelay: 0.15,
			},
			ease: "none",
		});
	});

	const beginTransition = contextSafe(({ href, label, shouldPush }: TransitionRequest & { shouldPush: boolean }) => {
		if (!href || !overlayRef.current || !panelRef.current) return;
		const normalizedTarget = normalizePath(href);
		const normalizedCurrent = lastKnownPathRef.current;
		if (normalizedTarget === normalizedCurrent) {
			if (shouldPush) router.push(href);
			return;
		}

		// Skip transition for blog internal navigation (/blog <-> /blog/[slug])
		const isBlogInternal =
			normalizedCurrent.startsWith("/blog") && normalizedTarget.startsWith("/blog");
		if (isBlogInternal) {
			if (shouldPush) router.push(href);
			return;
		}

		if (isTransitioningRef.current) return;

		isTransitioningRef.current = true;
		setIsTransitioning(true);
		if (typeof window !== "undefined") {
			window.dispatchEvent(new CustomEvent("app:transition-start"));
		}

		const rawLabel = label?.trim()?.length ? label : deriveLabelFromPath(normalizedTarget);
		const resolvedLabel = formatTransitionLabel(rawLabel);
		pendingRef.current = {
			href,
			normalizedPath: normalizedTarget,
			label: resolvedLabel,
		};
		pageReadyRef.current = false;
		scrambleDoneRef.current = false;

		const panel = panelRef.current;
		coverTimelineRef.current?.kill();
		revealTimelineRef.current?.kill();
		scrambleTimelineRef.current?.kill();
		showOverlay();
		gsap.set(panel, { yPercent: 100 });

		const tl = gsap.timeline({
			defaults: { ease: "power4.inOut" },
		});
		coverTimelineRef.current = tl;

		tl.to(panel, { yPercent: 0, duration: PANEL_TRANSITION_DURATION }).add(() => {
			startScramble(resolvedLabel);
			if (shouldPush) {
				router.push(href);
			}
		});
	});

	const startTransition = useCallback((request: TransitionRequest) => beginTransition({ ...request, shouldPush: true }), [beginTransition]);

	useEffect(() => {
		const handleRouteReady = (event: Event) => {
			const pending = pendingRef.current;
			const customEvent = event as CustomEvent<{ pathname?: string | null }>;
			const incomingPath = normalizePath(customEvent.detail?.pathname ?? "");
			lastKnownPathRef.current = incomingPath;
			if (!pending || incomingPath !== pending.normalizedPath) return;
			pageReadyRef.current = true;
			tryReveal();
		};

		window.addEventListener("app:route-ready", handleRouteReady);
		return () => window.removeEventListener("app:route-ready", handleRouteReady);
	}, [tryReveal]);

	// Initial setup
	useGSAP(
		() => {
			if (panelRef.current) {
				gsap.set(panelRef.current, { yPercent: 100 });
			}
			hideOverlay();
		},
		{ scope: overlayRef }
	);

	useEffect(() => {
		const handlePopState = () => {
			const href = getWindowPath();
			beginTransition({ href, shouldPush: false });
		};
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [beginTransition]);

	useEffect(() => {
		const handlePageShow = (event: PageTransitionEvent) => {
			if (!event.persisted) return;
			coverTimelineRef.current?.kill();
			revealTimelineRef.current?.kill();
			scrambleTimelineRef.current?.kill();
			coverTimelineRef.current = null;
			revealTimelineRef.current = null;
			scrambleTimelineRef.current = null;
			pendingRef.current = null;
			pageReadyRef.current = false;
			scrambleDoneRef.current = false;
			isTransitioningRef.current = false;
			lastKnownPathRef.current = normalizePath(getWindowPath());
			setIsTransitioning(false);
			if (panelRef.current) {
				gsap.set(panelRef.current, { yPercent: 100 });
			}
			if (textRef.current) {
				gsap.set(textRef.current, { autoAlpha: 0, textContent: "" });
			}
			hideOverlay();
			if (typeof window !== "undefined") {
				window.dispatchEvent(new CustomEvent("app:transition-end"));
			}
		};

		window.addEventListener("pageshow", handlePageShow);
		return () => window.removeEventListener("pageshow", handlePageShow);
	}, [hideOverlay]);

	const contextValue = useMemo<PageTransitionContextValue>(
		() => ({
			startTransition,
			isTransitioning,
		}),
		[startTransition, isTransitioning]
	);

	return (
		<PageTransitionContext.Provider value={contextValue}>
			<Suspense fallback={null}>
				<RouteReadyAnnouncer />
			</Suspense>
			{children}
			<div
				aria-hidden="true"
				ref={overlayRef}
				className="page-transition fixed inset-0 z-70 bg-background text-foreground flex items-center justify-center overflow-hidden will-change-transform pointer-events-none"
				style={{ opacity: 0 }}
			>
				<div ref={panelRef} className="absolute inset-x-0 bottom-0 h-[110%] bg-foreground will-change-transform" />
				<div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-2 px-6 pointer-events-none text-background">
					<p className="text-[10px] md:text-xs tracking-widest font-mono uppercase text-background/60">Preparing</p>
					<div className="flex items-center justify-center min-h-7]">
						<span ref={textRef} className="block text-sm md:text-xl tracking-widest font-mono font-semibold leading-none opacity-0 text-center" />
					</div>
				</div>
			</div>
		</PageTransitionContext.Provider>
	);
};

export const usePageTransition = () => {
	const context = useContext(PageTransitionContext);
	if (!context) {
		throw new Error("usePageTransition must be used within a PageTransitionProvider");
	}
	return context;
};
