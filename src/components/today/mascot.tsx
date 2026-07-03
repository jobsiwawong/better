"use client";

import * as React from "react";

// A friendly little monster that floats, blinks, waves, and wiggles its
// antenna — purely decorative, to make the Today page feel alive.
export function Mascot({ className }: { className?: string }) {
  const [wink, setWink] = React.useState(false);

  return (
    <div className={className} aria-hidden="true">
      <style>{`
        @keyframes betterMascotFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes betterMascotBlink { 0%,92%,100%{transform:scaleY(1)} 96%{transform:scaleY(0.12)} }
        @keyframes betterMascotWave { 0%,100%{transform:rotate(6deg)} 25%{transform:rotate(30deg)} 50%{transform:rotate(-2deg)} 75%{transform:rotate(28deg)} }
        @keyframes betterMascotAntenna { 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(8deg)} }
        @keyframes betterMascotBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(2px)} }
        .better-mascot-float { animation: betterMascotFloat 3.2s ease-in-out infinite; }
        .better-mascot-eyes { animation: betterMascotBlink 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .better-mascot-arm { animation: betterMascotWave 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: top left; }
        .better-mascot-antenna { animation: betterMascotAntenna 2.8s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center; }
        .better-mascot-cheeks { animation: betterMascotBob 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .better-mascot-float, .better-mascot-eyes, .better-mascot-arm,
          .better-mascot-antenna, .better-mascot-cheeks { animation: none; }
        }
      `}</style>
      <svg
        viewBox="0 0 120 128"
        width="112"
        height="120"
        role="img"
        className="cursor-pointer select-none"
        onClick={() => {
          setWink(true);
          setTimeout(() => setWink(false), 400);
        }}
      >
        <g className="better-mascot-float">
          {/* shadow */}
          <ellipse cx="60" cy="120" rx="30" ry="5" fill="#00000012" />

          {/* antenna */}
          <g className="better-mascot-antenna">
            <line x1="60" y1="30" x2="60" y2="12" stroke="#a85f3c" strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="9" r="6" fill="#e0a13c" />
          </g>

          {/* body */}
          <path
            d="M28 62 C28 40 44 30 60 30 C76 30 92 40 92 62 L92 92 C92 104 82 112 60 112 C38 112 28 104 28 92 Z"
            fill="#c9784f"
          />
          {/* belly */}
          <ellipse cx="60" cy="82" rx="24" ry="22" fill="#f4dfc9" />

          {/* feet */}
          <ellipse cx="46" cy="112" rx="9" ry="6" fill="#a85f3c" />
          <ellipse cx="74" cy="112" rx="9" ry="6" fill="#a85f3c" />

          {/* waving arm */}
          <g className="better-mascot-arm">
            <path d="M90 66 C102 60 108 50 106 44" stroke="#c9784f" strokeWidth="9" strokeLinecap="round" fill="none" />
          </g>
          {/* resting arm */}
          <path d="M30 68 C22 74 20 84 24 90" stroke="#c9784f" strokeWidth="9" strokeLinecap="round" fill="none" />

          {/* eyes */}
          <g className="better-mascot-eyes">
            {wink ? (
              <path d="M44 58 q6 5 12 0" stroke="#3a2a20" strokeWidth="3" fill="none" strokeLinecap="round" />
            ) : (
              <>
                <circle cx="50" cy="58" r="8" fill="#ffffff" />
                <circle cx="52" cy="59" r="3.4" fill="#3a2a20" />
              </>
            )}
            <circle cx="74" cy="58" r="8" fill="#ffffff" />
            <circle cx="76" cy="59" r="3.4" fill="#3a2a20" />
          </g>

          {/* cheeks */}
          <g className="better-mascot-cheeks">
            <circle cx="42" cy="72" r="4" fill="#e8927088" />
            <circle cx="82" cy="72" r="4" fill="#e8927088" />
          </g>

          {/* smile */}
          <path d="M52 74 q8 8 16 0" stroke="#3a2a20" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
