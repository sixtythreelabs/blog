"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

interface ReaderModeContextType {
	isReaderMode: boolean;
	setReaderMode: (enabled: boolean) => void;
	toggleReaderMode: () => void;
	/** True once the reader-mode hint has been shown or the mode was toggled */
	hasSeenHint: boolean;
	markHintSeen: () => void;
}

const ReaderModeContext = createContext<ReaderModeContextType | undefined>(undefined);

/**
 * Session-scoped reader mode for blog post pages: in-memory only, so it lasts
 * while the reader navigates between posts and resets on reload.
 */
export function ReaderModeProvider({ children }: { children: React.ReactNode }) {
	const [isReaderMode, setIsReaderMode] = useState(false);
	const [hasSeenHint, setHasSeenHint] = useState(false);

	const setReaderMode = useCallback((enabled: boolean) => setIsReaderMode(enabled), []);
	const toggleReaderMode = useCallback(() => setIsReaderMode((prev) => !prev), []);
	const markHintSeen = useCallback(() => setHasSeenHint(true), []);

	return <ReaderModeContext.Provider value={{ isReaderMode, setReaderMode, toggleReaderMode, hasSeenHint, markHintSeen }}>{children}</ReaderModeContext.Provider>;
}

export function useReaderMode() {
	const context = useContext(ReaderModeContext);
	if (context === undefined) {
		throw new Error("useReaderMode must be used within a ReaderModeProvider");
	}
	return context;
}
