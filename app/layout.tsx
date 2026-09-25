import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PageTransitionProvider } from "./components/PageTransitionProvider";
import PreloaderGate from "./components/PreloaderGate";
import Navbar from "./components/Navbar";
import { ReaderModeProvider } from "./context/ReaderModeContext";
import Cursor from "./components/Cursor";
import { LayoutProvider } from "./context/LayoutContext";
import { SoundProvider } from "./context/SoundContext";
import { CSPostHogProvider } from "./providers";

const roobertSans = localFont({
	src: [
		{
			path: "../public/fonts/RoobertTRIAL-Light.woff2",
			weight: "300",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertTRIAL-LightItalic.woff2",
			weight: "300",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertTRIAL-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertTRIAL-RegularItalic.woff2",
			weight: "400",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertTRIAL-Medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertTRIAL-MediumItalic.woff2",
			weight: "500",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertTRIAL-SemiBold.woff2",
			weight: "600",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertTRIAL-SemiBoldItalic.woff2",
			weight: "600",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertTRIAL-Bold.woff2",
			weight: "700",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertTRIAL-BoldItalic.woff2",
			weight: "700",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertTRIAL-Heavy.woff2",
			weight: "800",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertTRIAL-HeavyItalic.woff2",
			weight: "800",
			style: "italic",
		},
	],
	variable: "--font-roobert-sans",
});

const roobertMono = localFont({
	src: [
		{
			path: "../public/fonts/RoobertMonoTRIAL-Light.woff2",
			weight: "100",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertMonoTRIAL-LightItalic.woff2",
			weight: "300",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertMonoTRIAL-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertMonoTRIAL-RegularItalic.woff2",
			weight: "400",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertMonoTRIAL-Medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertMonoTRIAL-MediumItalic.woff2",
			weight: "500",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertMonoTRIAL-SemiBold.woff2",
			weight: "600",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertMonoTRIAL-SemiBoldItalic.woff2",
			weight: "600",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertMonoTRIAL-Bold.woff2",
			weight: "700",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertMonoTRIAL-BoldItalic.woff2",
			weight: "700",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertMonoTRIAL-Heavy.woff2",
			weight: "800",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertMonoTRIAL-HeavyItalic.woff2",
			weight: "800",
			style: "italic",
		},
	],
	variable: "--font-roobert-mono",
});

const fixelDisplay = localFont({
	src: [
		{
			path: "../public/fonts/FixelDisplay/FixelDisplay-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../public/fonts/FixelDisplay/FixelDisplay-RegularItalic.woff2",
			weight: "400",
			style: "italic",
		},
		{
			path: "../public/fonts/FixelDisplay/FixelDisplay-Medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "../public/fonts/FixelDisplay/FixelDisplay-MediumItalic.woff2",
			weight: "500",
			style: "italic",
		},
		{
			path: "../public/fonts/FixelDisplay/FixelDisplay-SemiBold.woff2",
			weight: "600",
			style: "normal",
		},
		{
			path: "../public/fonts/FixelDisplay/FixelDisplay-SemiBoldItalic.woff2",
			weight: "600",
			style: "italic",
		},
		{
			path: "../public/fonts/FixelDisplay/FixelDisplay-Bold.woff2",
			weight: "700",
			style: "normal",
		},
		{
			path: "../public/fonts/FixelDisplay/FixelDisplay-BoldItalic.woff2",
			weight: "700",
			style: "italic",
		},
	],
	variable: "--font-fixel-display",
});

const fixelText = localFont({
	src: [
		{
			path: "../public/fonts/FixelText/FixelText-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../public/fonts/FixelText/FixelText-RegularItalic.woff2",
			weight: "400",
			style: "italic",
		},
		{
			path: "../public/fonts/FixelText/FixelText-Medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "../public/fonts/FixelText/FixelText-MediumItalic.woff2",
			weight: "500",
			style: "italic",
		},
		{
			path: "../public/fonts/FixelText/FixelText-SemiBold.woff2",
			weight: "600",
			style: "normal",
		},
		{
			path: "../public/fonts/FixelText/FixelText-SemiBoldItalic.woff2",
			weight: "600",
			style: "italic",
		},
		{
			path: "../public/fonts/FixelText/FixelText-Bold.woff2",
			weight: "700",
			style: "normal",
		},
		{
			path: "../public/fonts/FixelText/FixelText-BoldItalic.woff2",
			weight: "700",
			style: "italic",
		},
	],
	variable: "--font-fixel-text",
});

const roobertSemiMono = localFont({
	src: [
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-Light.woff2",
			weight: "100",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-LightItalic.woff2",
			weight: "300",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-RegularItalic.woff2",
			weight: "400",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-Medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-MediumItalic.woff2",
			weight: "500",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-SemiBold.woff2",
			weight: "600",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-SemiBoldItalic.woff2",
			weight: "600",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-Bold.woff2",
			weight: "700",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-BoldItalic.woff2",
			weight: "700",
			style: "italic",
		},
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-Heavy.woff2",
			weight: "800",
			style: "normal",
		},
		{
			path: "../public/fonts/RoobertSemiMonoTRIAL-HeavyItalic.woff2",
			weight: "800",
			style: "italic",
		},
	],
	variable: "--font-roobert-semi-mono",
});

const departureMono = localFont({
	src: "../public/fonts/DepartureMono-Regular.woff2",
	weight: "400",
	style: "normal",
	variable: "--font-departure-mono",
});

const monaspaceNeon = localFont({
	src: [
		{
			path: "../public/fonts/code/MonaspaceNeonNF-Light.woff2",
			weight: "300",
			style: "normal",
		},
		{
			path: "../public/fonts/code/MonaspaceNeonNF-LightItalic.woff2",
			weight: "300",
			style: "italic",
		},
		{
			path: "../public/fonts/code/MonaspaceNeonNF-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../public/fonts/code/MonaspaceNeonNF-Italic.woff2",
			weight: "400",
			style: "italic",
		},
		{
			path: "../public/fonts/code/MonaspaceNeonNF-Medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "../public/fonts/code/MonaspaceNeonNF-MediumItalic.woff2",
			weight: "500",
			style: "italic",
		},
		{
			path: "../public/fonts/code/MonaspaceNeonNF-SemiBold.woff2",
			weight: "600",
			style: "normal",
		},
		{
			path: "../public/fonts/code/MonaspaceNeonNF-SemiBoldItalic.woff2",
			weight: "600",
			style: "italic",
		},
		{
			path: "../public/fonts/code/MonaspaceNeonNF-Bold.woff2",
			weight: "700",
			style: "normal",
		},
		{
			path: "../public/fonts/code/MonaspaceNeonNF-BoldItalic.woff2",
			weight: "700",
			style: "italic",
		},
	],
	variable: "--font-code",
});

export const metadata: Metadata = {
	title: {
		default: "sixtythreelabs",
		template: "%s | stl",
	},
	description: "We build the connective layer for your infrastructure — one system across every machine, with boundaries and control intact.",
	keywords: ["sixtythreelabs", "self-hosted systems", "infrastructure", "distributed systems", "blockchain", "software engineering", "AI", "backend", "frontend", "design", "philosophy", "photography"],
	authors: [{ name: "Karan", url: "https://x.com/naraklog" }],
	formatDetection: {
		telephone: false,
	},
};

export const viewport: Viewport = {
	themeColor: "#050508",
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${roobertSans.variable} ${roobertMono.variable} ${roobertSemiMono.variable} ${fixelDisplay.variable} ${fixelText.variable} ${departureMono.variable} ${monaspaceNeon.variable}`}>
			<body className="antialiased">
				<CSPostHogProvider>
					<PageTransitionProvider>
						<SoundProvider>
							<ReaderModeProvider>
								<LayoutProvider>
									<PreloaderGate />
									<Cursor />
									<Navbar />
									{children}
								</LayoutProvider>
							</ReaderModeProvider>
						</SoundProvider>
					</PageTransitionProvider>
				</CSPostHogProvider>
			</body>
		</html>
	);
}
