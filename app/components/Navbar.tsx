"use client";

import { usePathname } from "next/navigation";
import { useClock, useFlickerAnimation, useMorphState } from "../hooks";
import { useLayoutContext } from "../context/LayoutContext";
import { useReaderMode } from "../context/ReaderModeContext";
import NavDigit from "./NavDigit";

const Navbar = () => {
  const { formattedTime, timezone } = useClock();
  const { isNavVisible, isFlickerPhase } = useFlickerAnimation();
  const { isMorphActive, isSmallScreen, digitFontScale } = useMorphState();
  const { leftDigitRef, rightDigitRef } = useLayoutContext();
  const { isReaderMode } = useReaderMode();
  const pathname = usePathname();
  // Reader mode is a blog-post feature, so the clock only hides there
  const isBlogPost = pathname?.startsWith("/blog/") ?? false;
  const hideClock = isReaderMode && isBlogPost;

  // The giant digit size is baked into font-size (scale via transform caused
  // pixelated filter rendering on WebKit) - giant digits anchor to the top so
  // they grow downward like the previous transform-origin behavior
  const digitAlign = digitFontScale > 1 ? "items-start" : "items-center";

  return (
    <header
      id="header"
      className={`fixed top-0 left-0 right-0 z-50 transition-opacity duration-300 mix-blend-difference pointer-events-none ${isNavVisible ? "opacity-100" : "opacity-0"} ${digitFontScale > 1 ? "pt-[env(safe-area-inset-top,0px)]" : ""}`}
    >
      <div className="relative h-24 flex items-center justify-center">
        {/* Left digit */}
        <div
          aria-hidden="true"
          className={`absolute left-0 top-0 h-full flex ${digitAlign} pl-8 select-none pointer-events-none`}
        >
          <NavDigit
            ref={leftDigitRef}
            label="six"
            digit="6"
            isFlickerPhase={isFlickerPhase}
            isMorphActive={isMorphActive}
            align="left"
            flickerClass="flicker-char-left"
            injectFilters={true}
            isSmallScreen={isSmallScreen}
            fontScale={digitFontScale}
          />
        </div>

        {/* Center clock (fades out on mobile while reader mode is active) */}
        <div aria-hidden={hideClock} className={`text-left transition-opacity duration-300 ${hideClock ? "opacity-0" : "opacity-100"}`}>
          <div className="font-mono text-white/80 text-[clamp(0.7rem,2.5vw,0.8rem)]">
            {formattedTime || "\u00A0"}
          </div>
          <div className="font-mono text-light-gray tracking-tighter text-[clamp(0.7rem,2.5vw,0.8rem)]">
            {timezone ? `(${timezone})` : "\u00A0"}
          </div>
        </div>

        {/* Right digit */}
        <div
          aria-hidden="true"
          className={`absolute right-0 top-0 h-full flex ${digitAlign} pr-8 select-none pointer-events-none`}
        >
          <NavDigit
            ref={rightDigitRef}
            label="three"
            digit="3"
            isFlickerPhase={isFlickerPhase}
            isMorphActive={isMorphActive}
            align="right"
            flickerClass="flicker-char-right"
            injectFilters={false}
            isSmallScreen={isSmallScreen}
            fontScale={digitFontScale}
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
