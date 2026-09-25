"use client";

import React, { createContext, useContext, useRef, useCallback } from "react";

export type DigitSide = "left" | "right";

export type MorphState = {
	enabled: boolean;
	leftProgress: number;
	rightProgress: number;
	flickerComplete: boolean;
	/** Font-size multiplier for the navbar digits (home bakes the giant size via font-size instead of transform scale) */
	digitFontScale: number;
};

type Listener = (state: MorphState) => void;

interface LayoutContextType {
	leftDigitRef: React.MutableRefObject<HTMLSpanElement | null>;
	rightDigitRef: React.MutableRefObject<HTMLSpanElement | null>;
	setMorphEnabled: (enabled: boolean) => void;
	setDigitProgress: (side: DigitSide, progress: number) => void;
	setFlickerComplete: () => void;
	setDigitFontScale: (scale: number) => void;
	subscribe: (listener: Listener) => () => void;
	getSnapshot: () => MorphState;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
	const leftDigitRef = useRef<HTMLSpanElement | null>(null);
	const rightDigitRef = useRef<HTMLSpanElement | null>(null);

	// specialized state management for high-frequency updates (animation loop)
	// to avoid re-rendering the whole tree on every scroll frame
	const stateRef = useRef<MorphState>({ enabled: false, leftProgress: 0, rightProgress: 0, flickerComplete: false, digitFontScale: 1 });
	const listenersRef = useRef<Set<Listener>>(new Set());

	const notify = useCallback(() => {
		const currentState = stateRef.current;
		listenersRef.current.forEach((listener) => listener(currentState));
	}, []);

	const setMorphEnabled = useCallback(
		(enabled: boolean) => {
			if (stateRef.current.enabled !== enabled) {
				stateRef.current.enabled = enabled;
				notify();
			}
		},
		[notify]
	);

	const setDigitProgress = useCallback(
		(side: DigitSide, progress: number) => {
			const clamped = Math.max(0, Math.min(1, progress));
			const key = side === "left" ? "leftProgress" : "rightProgress";
			if (stateRef.current[key] !== clamped) {
				stateRef.current[key] = clamped;
				notify();
			}
		},
		[notify]
	);

	const setFlickerComplete = useCallback(() => {
		if (!stateRef.current.flickerComplete) {
			stateRef.current.flickerComplete = true;
			notify();
		}
	}, [notify]);

	const setDigitFontScale = useCallback(
		(scale: number) => {
			if (stateRef.current.digitFontScale !== scale) {
				stateRef.current.digitFontScale = scale;
				notify();
			}
		},
		[notify]
	);

	const subscribe = useCallback((listener: Listener) => {
		listenersRef.current.add(listener);
		// immediately call with current state
		listener(stateRef.current);
		return () => {
			listenersRef.current.delete(listener);
		};
	}, []);

	const getSnapshot = useCallback(() => stateRef.current, []);

	const value = {
		leftDigitRef,
		rightDigitRef,
		setMorphEnabled,
		setDigitProgress,
		setFlickerComplete,
		setDigitFontScale,
		subscribe,
		getSnapshot,
	};

	return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useLayoutContext = () => {
	const context = useContext(LayoutContext);
	if (!context) {
		throw new Error("useLayoutContext must be used within a LayoutProvider");
	}
	return context;
};
