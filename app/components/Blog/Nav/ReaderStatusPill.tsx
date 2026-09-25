"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type ReaderStatusPillProps = {
	/** Message to show above the bar, or null to hide */
	message: string | null;
};

/**
 * Small pill above the mobile nav used for the reader-mode hint and toggle
 * feedback. Purely informational, so it never captures pointer events.
 */
export default function ReaderStatusPill({ message }: ReaderStatusPillProps) {
	const reduceMotion = useReducedMotion();

	return (
		<AnimatePresence>
			{message && (
				<motion.div
					key={message}
					initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
					transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
					role="status"
					className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap border border-light-gray/50 bg-black/90 px-3 py-1.5 font-departure-mono text-[10px] uppercase tracking-[0.16em] text-off-white backdrop-blur-sm"
				>
					{message}
				</motion.div>
			)}
		</AnimatePresence>
	);
}
