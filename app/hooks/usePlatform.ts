import { useEffect, useState } from "react";

type PlatformInfo = {
	isMac: boolean;
	isIos: boolean;
	shortcutLabel: string;
};

/**
 * Detects the user's platform for conditional rendering and shortcut labels.
 */
export function usePlatform(): PlatformInfo {
	const [platform, setPlatform] = useState<PlatformInfo>({
		isMac: false,
		isIos: false,
		shortcutLabel: "Ctrl K",
	});

	useEffect(() => {
		const platformStr = navigator.platform || navigator.userAgent || "";
		const ua = navigator.userAgent;
		const macDetected = /Mac|iPhone|iPad|iPod/i.test(platformStr);
		const iosDetected = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

		setPlatform({
			isMac: macDetected,
			isIos: iosDetected,
			shortcutLabel: macDetected ? "⌘K" : "Ctrl K",
		});
	}, []);

	return platform;
}

