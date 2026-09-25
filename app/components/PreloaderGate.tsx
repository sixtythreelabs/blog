"use client";

import { useEffect, useState } from "react";
import Preloader from "./Preloader";
import { hasPreloaderRun, markPreloaderComplete } from "../utils/preloader";

const PreloaderGate = () => {
	// Initialize to true so it matches the server render (which sees hasPreloaderRun() as false)
	const [shouldRender, setShouldRender] = useState(true);
	// We also need to know if we've checked the storage yet to avoid a flash
	const [isChecked, setIsChecked] = useState(false);

	useEffect(() => {
		// Check immediately upon mounting
		if (hasPreloaderRun()) {
			setShouldRender(false);
		}
		setIsChecked(true);

		const handleComplete = () => {
			markPreloaderComplete();
			setShouldRender(false);
		};

		window.addEventListener("app:preloader-complete", handleComplete, { once: true });
		return () => window.removeEventListener("app:preloader-complete", handleComplete);
	}, []);

	// If we haven't checked yet, render null to avoid a flash of content (or preloader)
	// Actually, to match server (which renders Preloader), we must return Preloader initially.
	// But if we want to avoid the "Flash of Preloader" on subsequent visits, we have a dilemma:
	// 1. Server renders Preloader.
	// 2. Client renders Preloader (Hydration Match).
	// 3. Client Effect runs -> Sees visited -> Removes Preloader.
	// Result: Brief flash of preloader.

	// Alternative:
	// 1. Server renders NULL.
	// 2. Client renders NULL.
	// 3. Client Effect runs -> Sees NOT visited -> Renders Preloader.
	// Result: Brief flash of site content before Preloader covers it.

	// Given the preloader is "fixed" and covers the screen, the Flash of Preloader (Option 1) is safer than Flash of Unstyled Content (Option 2).
	// However, if the user has ALREADY visited, they shouldn't see the preloader at all.

	// To fix the Hydration Mismatch specifically:
	// The mismatch was because useState(() => !hasPreloaderRun()) returned DIFFERENT values on server (true) and client (false).
	// By setting useState(true), we force them to agree.

	if (!shouldRender) return null;

	// If we are on the client and have confirmed we should NOT render, return null.
	// But during hydration (isChecked=false), we must match server (return Preloader).
	if (isChecked && !shouldRender) return null;

	return <Preloader />;
};

export default PreloaderGate;
