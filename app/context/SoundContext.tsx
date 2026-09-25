"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type SoundType = "hover" | "click" | "unlock" | "tick" | "pop" | "button_down" | "button_up";

interface SoundContextType {
	playSound: (type: SoundType) => void;
	isMuted: boolean;
	toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const SOUND_URLS = {
	hover: "/sounds/hover.mp3",
	click: "/sounds/click.mp3",
	unlock: "/sounds/unlock.mp3",
	tick: "/sounds/tick.mp3",
	pop: "/sounds/pop.mp3",
	button_down: "/sounds/button_down.mp3",
	button_up: "/sounds/button_up.mp3",
};

const SOUND_MUTED_KEY = "sound-muted";

function trimSilence(buffer: AudioBuffer, context: AudioContext): AudioBuffer {
	const data = buffer.getChannelData(0);
	// Increase threshold slightly to catch more noise floor if necessary
	const threshold = 0.01;
	let start = 0;
	let end = data.length;

	// Find start
	for (let i = 0; i < data.length; i++) {
		if (Math.abs(data[i]) > threshold) {
			start = i;
			break;
		}
	}

	// Find end
	for (let i = data.length - 1; i >= 0; i--) {
		if (Math.abs(data[i]) > threshold) {
			end = i;
			break;
		}
	}

	if (end <= start) return buffer;

	const length = end - start;
	const newBuffer = context.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);

	for (let i = 0; i < buffer.numberOfChannels; i++) {
		newBuffer.getChannelData(i).set(buffer.getChannelData(i).subarray(start, end));
	}

	return newBuffer;
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
	const audioContextRef = useRef<AudioContext | null>(null);
	const buffersRef = useRef<Record<SoundType, AudioBuffer | null>>({ hover: null, click: null, unlock: null, tick: null, pop: null, button_down: null, button_up: null });
	const [isMuted, setIsMuted] = useState(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem(SOUND_MUTED_KEY) === "true";
	});

	useEffect(() => {
		const initAudio = async () => {
			const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!AudioContextClass) return;

			const context = new AudioContextClass();
			audioContextRef.current = context;

			// Handle autoplay policy
			const resumeAudio = () => {
				if (context.state === "suspended") {
					context.resume();
				}
			};

			// Attach listeners to resume context on first interaction
			window.addEventListener("click", resumeAudio);
			window.addEventListener("mousedown", resumeAudio);
			window.addEventListener("keydown", resumeAudio);
			window.addEventListener("touchstart", resumeAudio);

			const loadBuffer = async (url: string): Promise<AudioBuffer> => {
				const response = await fetch(url);
				const arrayBuffer = await response.arrayBuffer();
				const audioBuffer = await context.decodeAudioData(arrayBuffer);
				return trimSilence(audioBuffer, context);
			};

			try {
				const [hoverBuffer, clickBuffer, unlockBuffer, tickBuffer, popBuffer, buttonDownBuffer, buttonUpBuffer] = await Promise.all([
					loadBuffer(SOUND_URLS.hover),
					loadBuffer(SOUND_URLS.click),
					loadBuffer(SOUND_URLS.unlock),
					loadBuffer(SOUND_URLS.tick),
					loadBuffer(SOUND_URLS.pop),
					loadBuffer(SOUND_URLS.button_down),
					loadBuffer(SOUND_URLS.button_up),
				]);
				buffersRef.current = {
					hover: hoverBuffer,
					click: clickBuffer,
					unlock: unlockBuffer,
					tick: tickBuffer,
					pop: popBuffer,
					button_down: buttonDownBuffer,
					button_up: buttonUpBuffer,
				};
			} catch (error) {
				console.error("Failed to load sounds:", error);
			}

			// Cleanup listeners
			return () => {
				window.removeEventListener("click", resumeAudio);
				window.removeEventListener("mousedown", resumeAudio);
				window.removeEventListener("keydown", resumeAudio);
				window.removeEventListener("touchstart", resumeAudio);
				context.close();
			};
		};

		const cleanup = initAudio();
		return () => {
			cleanup.then((fn) => fn && fn());
		};
	}, []);

	const playSound = useCallback((type: SoundType) => {
		if (isMuted || !audioContextRef.current || !buffersRef.current[type]) return;

		const context = audioContextRef.current;

		// Try to resume if suspended (though the global listener should catch this)
		if (context.state === "suspended") {
			context.resume().catch(() => {});
		}

		const source = context.createBufferSource();
		source.buffer = buffersRef.current[type];

		// Pitch variation: +/- 50 cents
		const detuneAmount = Math.random() * 100 - 50;
		source.detune.value = detuneAmount;

		const gainNode = context.createGain();

		// Reduce volume significantly and add envelope to avoid pops
		let volume = type === "hover" ? 0.24 : 0.25;
		if (type === "click") volume = 0.3;
		if (type === "tick") volume = 0.3;
		if (type === "pop") volume = 0.12;
		// Press sounds stay softer and ease in slower so they don't feel sharp
		const isButtonSound = type === "button_down" || type === "button_up";
		if (isButtonSound) volume = 0.6;

		// Start at 0
		gainNode.gain.setValueAtTime(0, context.currentTime);
		// Ease in to the target volume (slower attack for the softer press sounds)
		gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + (isButtonSound ? 0.035 : 0.01));
		// Decay if needed, but for short sounds just letting it play is usually fine.
		// For longer sounds, we might want to release, but these are short SFX.

		source.connect(gainNode);
		gainNode.connect(context.destination);
		source.start(0);
	}, [isMuted]);

	// Latest-ref so the global press listeners register only once
	const playSoundRef = useRef(playSound);
	useEffect(() => {
		playSoundRef.current = playSound;
	}, [playSound]);

	// Global press sounds for interactive elements: button_down on press and
	// button_up when released inside the same control. Elements can opt out
	// with data-no-press-sound (e.g. reader-mode long press, image pop).
	useEffect(() => {
		const INTERACTIVE_SELECTOR = 'button, a, [role="button"], [data-press-sound]';
		let pressedElement: Element | null = null;

		const handlePointerDown = (event: PointerEvent) => {
			if (event.pointerType === "mouse" && event.button !== 0) return;
			const target = event.target instanceof Element ? event.target : null;
			const element = target?.closest(INTERACTIVE_SELECTOR) ?? null;
			if (!element || element.closest("[data-no-press-sound]")) return;
			pressedElement = element;
			playSoundRef.current("button_down");
		};

		const handlePointerUp = (event: PointerEvent) => {
			const element = pressedElement;
			pressedElement = null;
			if (!element) return;
			const target = event.target instanceof Element ? event.target : null;
			if (target && element.contains(target)) {
				playSoundRef.current("button_up");
			}
		};

		const handlePointerCancel = () => {
			pressedElement = null;
		};

		window.addEventListener("pointerdown", handlePointerDown, true);
		window.addEventListener("pointerup", handlePointerUp, true);
		window.addEventListener("pointercancel", handlePointerCancel, true);
		return () => {
			window.removeEventListener("pointerdown", handlePointerDown, true);
			window.removeEventListener("pointerup", handlePointerUp, true);
			window.removeEventListener("pointercancel", handlePointerCancel, true);
		};
	}, []);

	const toggleMute = () => {
		setIsMuted((prev) => {
			const next = !prev;
			localStorage.setItem(SOUND_MUTED_KEY, String(next));
			return next;
		});
	};

	return <SoundContext.Provider value={{ playSound, isMuted, toggleMute }}>{children}</SoundContext.Provider>;
}

export function useSound() {
	const context = useContext(SoundContext);
	if (context === undefined) {
		throw new Error("useSound must be used within a SoundProvider");
	}
	return context;
}
