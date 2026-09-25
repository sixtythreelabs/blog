const STORAGE_KEY = "app:preloader-complete";
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export const hasPreloaderRun = () => {
	if (typeof window === "undefined") return false;
	try {
		const timestamp = window.localStorage.getItem(STORAGE_KEY);
		if (!timestamp) return false;
		const elapsed = Date.now() - Number(timestamp);
		if (elapsed < EXPIRY_MS) return true;
		window.localStorage.removeItem(STORAGE_KEY);
		return false;
	} catch {
		return false;
	}
};

export const markPreloaderComplete = () => {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY, Date.now().toString());
	} catch {
		// Ignore localStorage failures (e.g. Safari private mode)
	}
};

export const waitForAppReady = async () => {
	if (typeof window === "undefined") return;

	// Wait for document ready state
	if (document.readyState !== "complete") {
		await new Promise<void>((resolve) => {
			const handler = () => {
				window.removeEventListener("load", handler);
				resolve();
			};
			window.addEventListener("load", handler);
		});
	}

	// Wait for fonts
	if (document.fonts) {
		try {
			await document.fonts.ready;
		} catch (e) {
			console.warn("Font loading check failed", e);
		}
	}
};
