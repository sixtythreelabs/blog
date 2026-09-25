import { useEffect, useState } from "react";

export function useTouchDevice() {
	const [isTouchDevice, setIsTouchDevice] = useState(false);

	useEffect(() => {
		const detectTouchDevice = () => {
			// Method 1: Check for touch events support
			const hasTouchEvents = "ontouchstart" in window;

			// Method 2: Check for touch points
			const hasTouchPoints = navigator.maxTouchPoints > 0;

			// Method 3: Check media query for pointer type
			const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

			// Method 4: Check user agent for mobile devices
			const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

			return hasTouchEvents || hasTouchPoints || hasCoarsePointer || mobileUserAgent;
		};

		setIsTouchDevice(detectTouchDevice());
	}, []);

	return isTouchDevice;
}

