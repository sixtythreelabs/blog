import { useState, useEffect, useCallback } from "react";

type ClockOptions = {
	updateInterval?: number;
	locale?: string;
	hour12?: boolean;
};

type ClockReturn = {
	time: Date | null;
	formattedTime: string;
	timezone: string;
};

/**
 * A hook that manages time state and formatting.
 * Updates every second by default.
 * Returns null/empty values on initial render to avoid hydration mismatch.
 */
export function useClock(options: ClockOptions = {}): ClockReturn {
	const { updateInterval = 1000, locale = "en-US", hour12 = true } = options;

	const [time, setTime] = useState<Date | null>(null);

	useEffect(() => {
		// Set time immediately on mount
		setTime(new Date());

		const timer = setInterval(() => {
			setTime(new Date());
		}, updateInterval);

		return () => clearInterval(timer);
	}, [updateInterval]);

	const formatTime = useCallback(
		(date: Date | null) => {
			if (!date) return "";
			return date.toLocaleTimeString(locale, {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12,
			});
		},
		[locale, hour12]
	);

	const getTimezone = useCallback(() => {
		if (!time) return "";
		// Get the user's timezone abbreviation
		try {
			const formatter = new Intl.DateTimeFormat(locale, { timeZoneName: "short" });
			const parts = formatter.formatToParts(time);
			const tzPart = parts.find((part) => part.type === "timeZoneName");
			return tzPart?.value ?? "UTC";
		} catch {
			return "UTC";
		}
	}, [locale, time]);

	return {
		time,
		formattedTime: formatTime(time),
		timezone: getTimezone(),
	};
}
