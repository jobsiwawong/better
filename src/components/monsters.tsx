"use client";

import * as React from "react";

// A little menagerie of quirky monsters that make the app feel alive.
// Each kind is its own species (color + activity + motion style): some sway
// side to side, some bob up and down, some drift. All respect
// prefers-reduced-motion. Pick one with <Monster kind=.../> or let
// <DailyMonster/> rotate through them twice a day (like the quotes).

export type MonsterKind =
  | "waver"
  | "violinist"
  | "sleeper"
  | "athlete"
  | "yawner"
  | "floater";

export const MONSTER_KINDS: MonsterKind[] = [
  "waver",
  "violinist",
  "sleeper",
  "athlete",
  "yawner",
  "floater",
];

/** Deterministic pick that changes at local midnight and noon. */
export function monsterForNow(seed = 0, now: Date = new Date()): MonsterKind {
  const localMs = now.getTime() - now.getTimezoneOffset() * 60_000;
  const dayNumber = Math.floor(localMs / 86_400_000);
  const halfDay = now.getHours() < 12 ? 0 : 1;
  const idx =
    (((dayNumber * 2 + halfDay + seed) % MONSTER_KINDS.length) +
      MONSTER_KINDS.length) %
    MONSTER_KINDS.length;
  return MONSTER_KINDS[idx];
}

export function DailyMonster({
  seed = 0,
  size = 112,
  className,
}: {
  seed?: number;
  size?: number;
  className?: string;
}) {
  return <Monster kind={monsterForNow(seed)} size={size} className={className} />;
}

const STYLES = `
@keyframes bmnFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
@keyframes bmnBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(3px)} }
@keyframes bmnSway { 0%,100%{transform:translateX(-4px) rotate(-2deg)} 50%{transform:translateX(4px) rotate(2deg)} }
@keyframes bmnDriftX { 0%,100%{transform:translateX(-7px)} 50%{transform:translateX(7px)} }
@keyframes bmnBlink { 0%,92%,100%{transform:scaleY(1)} 96%{transform:scaleY(0.12)} }
@keyframes bmnWave { 0%,100%{transform:rotate(6deg)} 25%{transform:rotate(30deg)} 50%{transform:rotate(-2deg)} 75%{transform:rotate(28deg)} }
@keyframes bmnAntenna { 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(8deg)} }
@keyframes bmnBow { 0%,100%{transform:rotate(-11deg)} 50%{transform:rotate(9deg)} }
@keyframes bmnNote { 0%{opacity:0;transform:translate(0,4px) scale(.7)} 25%{opacity:1} 100%{opacity:0;transform:translate(6px,-26px) scale(1.05)} }
@keyframes bmnBreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.045)} }
@keyframes bmnZzz { 0%{opacity:0;transform:translate(0,0) scale(.6)} 30%{opacity:.9} 100%{opacity:0;transform:translate(10px,-22px) scale(1.1)} }
@keyframes bmnSunflower { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(5deg)} }
@keyframes bmnBall { 0%,100%{transform:translateY(0)} 45%{transform:translateY(-24px) rotate(160deg)} 55%{transform:translateY(-24px) rotate(200deg)} }
@keyframes bmnHeader { 0%,100%{transform:translateY(0)} 45%{transform:translateY(3px)} 60%{transform:translateY(-3px)} }
@keyframes bmnYawnMouth { 0%,55%,100%{transform:scale(1)} 70%,85%{transform:scale(2.6)} }
@keyframes bmnYawnEyes { 0%,55%,100%{transform:scaleY(1)} 70%,85%{transform:scaleY(0.15)} }
@keyframes bmnStretch { 0%,55%,100%{transform:rotate(0deg)} 70%,85%{transform:rotate(-38deg)} }
@keyframes bmnDangle { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(9deg)} }
@keyframes bmnBalloon { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(4deg)} }
.bmn-float { animation: bmnFloat 3.2s ease-in-out infinite; }
.bmn-bob { animation: bmnBob 2.6s ease-in-out infinite; }
.bmn-sway { animation: bmnSway 3.6s ease-in-out infinite; }
.bmn-driftx { animation: bmnDriftX 5.5s ease-in-out infinite; }
.bmn-eyes { animation: bmnBlink 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.bmn-wave { animation: bmnWave 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: top left; }
.bmn-antenna { animation: bmnAntenna 2.8s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center; }
.bmn-bow { animation: bmnBow 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 15% 85%; }
.bmn-note1 { animation: bmnNote 2.6s ease-out infinite; transform-box: fill-box; }
.bmn-note2 { animation: bmnNote 2.6s ease-out infinite 1.3s; transform-box: fill-box; }
.bmn-breathe { animation: bmnBreathe 3.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
.bmn-zzz1 { animation: bmnZzz 3.2s ease-out infinite; transform-box: fill-box; }
.bmn-zzz2 { animation: bmnZzz 3.2s ease-out infinite 1.6s; transform-box: fill-box; }
.bmn-sunflower { animation: bmnSunflower 4.2s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center; }
.bmn-ball { animation: bmnBall 1.5s cubic-bezier(.5,.05,.5,.95) infinite; transform-box: fill-box; transform-origin: center; }
.bmn-header { animation: bmnHeader 1.5s ease-in-out infinite; }
.bmn-yawn-mouth { animation: bmnYawnMouth 5.5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.bmn-yawn-eyes { animation: bmnYawnEyes 5.5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.bmn-stretch { animation: bmnStretch 5.5s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom right; }
.bmn-dangle { animation: bmnDangle 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: top center; }
.bmn-balloon { animation: bmnBalloon 3s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center; }
@media (prefers-reduced-motion: reduce) {
  [class^="bmn-"], [class*=" bmn-"] { animation: none !important; }
}
`;

export function Monster({
  kind,
  size = 112,
  className,
}: {
  kind: MonsterKind;
  size?: number;
  className?: string;
}) {
  const [wink, setWink] = React.useState(false);
  const Body = BODIES[kind];
  return (
    <div className={className} aria-hidden="true">
      <style>{STYLES}</style>
      <svg
        viewBox="0 0 120 128"
        width={size}
        height={(size * 128) / 120}
        role="img"
        className="cursor-pointer select-none"
        onClick={() => {
          setWink(true);
          setTimeout(() => setWink(false), 400);
        }}
      >
        <Body wink={wink} />
      </svg>
    </div>
  );
}

type BodyProps = { wink: boolean };

/* ---------- shared bits ---------- */

function Eyes({
  wink,
  color = "#2c2438",
  y = 58,
  lx = 50,
  rx = 74,
}: {
  wink: boolean;
  color?: string;
  y?: number;
  lx?: number;
  rx?: number;
}) {
  return (
    <g className="bmn-eyes">
      {wink ? (
        <path
          d={`M${lx - 6} ${y} q6 5 12 0`}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <>
          <circle cx={lx} cy={y} r="8" fill="#ffffff" />
          <circle cx={lx + 2} cy={y + 1} r="3.4" fill={color} />
        </>
      )}
      <circle cx={rx} cy={y} r="8" fill="#ffffff" />
      <circle cx={rx + 2} cy={y + 1} r="3.4" fill={color} />
    </g>
  );
}

function Blob({ fill, belly }: { fill: string; belly: string }) {
  return (
    <>
      <path
        d="M28 62 C28 40 44 30 60 30 C76 30 92 40 92 62 L92 92 C92 104 82 112 60 112 C38 112 28 104 28 92 Z"
        fill={fill}
      />
      <ellipse cx="60" cy="82" rx="24" ry="22" fill={belly} />
    </>
  );
}

/* ---------- the menagerie ---------- */

// 1. The classic waver — terracotta, floats up and down.
function Waver({ wink }: BodyProps) {
  return (
    <g className="bmn-float">
      <ellipse cx="60" cy="120" rx="30" ry="5" fill="#00000012" />
      <g className="bmn-antenna">
        <line x1="60" y1="30" x2="60" y2="12" stroke="#a85f3c" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="9" r="6" fill="#e0a13c" />
      </g>
      <Blob fill="#c9784f" belly="#f4dfc9" />
      <ellipse cx="46" cy="112" rx="9" ry="6" fill="#a85f3c" />
      <ellipse cx="74" cy="112" rx="9" ry="6" fill="#a85f3c" />
      <g className="bmn-wave">
        <path d="M90 66 C102 60 108 50 106 44" stroke="#c9784f" strokeWidth="9" strokeLinecap="round" fill="none" />
      </g>
      <path d="M30 68 C22 74 20 84 24 90" stroke="#c9784f" strokeWidth="9" strokeLinecap="round" fill="none" />
      <Eyes wink={wink} color="#3a2a20" />
      <circle cx="42" cy="72" r="4" fill="#e8927088" />
      <circle cx="82" cy="72" r="4" fill="#e8927088" />
      <path d="M52 74 q8 8 16 0" stroke="#3a2a20" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}

// 2. The violinist — sage green, sways side to side while playing.
function Violinist() {
  return (
    <g className="bmn-sway">
      <ellipse cx="60" cy="120" rx="30" ry="5" fill="#00000012" />
      {/* floating notes */}
      <g className="bmn-note1">
        <text x="96" y="34" fontSize="14" fill="#5e7f57">♪</text>
      </g>
      <g className="bmn-note2">
        <text x="20" y="30" fontSize="12" fill="#5e7f57">♫</text>
      </g>
      <Blob fill="#8aa86f" belly="#eef2dc" />
      <ellipse cx="46" cy="112" rx="9" ry="6" fill="#6b8a55" />
      <ellipse cx="74" cy="112" rx="9" ry="6" fill="#6b8a55" />
      {/* blissful closed eyes */}
      <path d="M44 57 q6 -5 12 0" stroke="#2f3b26" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M68 57 q6 -5 12 0" stroke="#2f3b26" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M53 70 q7 6 14 0" stroke="#2f3b26" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="41" cy="66" r="4" fill="#d489648e" />
      <circle cx="83" cy="66" r="4" fill="#d489648e" />
      {/* violin tucked at the chin */}
      <g transform="rotate(-24 52 88)">
        <ellipse cx="50" cy="92" rx="12" ry="16" fill="#9a6238" />
        <ellipse cx="50" cy="80" rx="9" ry="10" fill="#9a6238" />
        <rect x="48" y="52" width="4" height="26" rx="2" fill="#6f4426" />
        <line x1="46" y1="86" x2="54" y2="86" stroke="#3d2413" strokeWidth="1.6" />
        <line x1="46" y1="92" x2="54" y2="92" stroke="#3d2413" strokeWidth="1.6" />
      </g>
      {/* left arm holding the neck */}
      <path d="M32 70 C34 60 40 54 46 52" stroke="#8aa86f" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* bow arm */}
      <g className="bmn-bow">
        <path d="M88 74 C94 76 98 80 100 84" stroke="#8aa86f" strokeWidth="8" strokeLinecap="round" fill="none" />
        <line x1="30" y1="106" x2="102" y2="72" stroke="#6f4426" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  );
}

// 3. The sleeper — dusty blue, snoozing on grass among sunflowers.
function Sleeper() {
  return (
    <g>
      {/* grass mound */}
      <ellipse cx="60" cy="116" rx="52" ry="10" fill="#8fae74" />
      <ellipse cx="60" cy="113" rx="44" ry="7" fill="#a3c188" />
      {/* zzz */}
      <g className="bmn-zzz1">
        <text x="88" y="52" fontSize="15" fontWeight="700" fill="#7d93b8">z</text>
      </g>
      <g className="bmn-zzz2">
        <text x="95" y="42" fontSize="11" fontWeight="700" fill="#7d93b8">z</text>
      </g>
      {/* sunflowers */}
      <g className="bmn-sunflower">
        <line x1="22" y1="112" x2="22" y2="84" stroke="#6b8a55" strokeWidth="3" strokeLinecap="round" />
        <path d="M22 100 q-8 -2 -10 -8" stroke="#6b8a55" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <ellipse
            key={a}
            cx="22"
            cy="76"
            rx="3.4"
            ry="7"
            fill="#e8b93c"
            transform={`rotate(${a} 22 82)`}
          />
        ))}
        <circle cx="22" cy="82" r="5.5" fill="#7a5228" />
      </g>
      <g className="bmn-sunflower" style={{ animationDelay: "-2s" }}>
        <line x1="102" y1="112" x2="102" y2="92" stroke="#6b8a55" strokeWidth="3" strokeLinecap="round" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <ellipse
            key={a}
            cx="102"
            cy="85"
            rx="2.8"
            ry="5.5"
            fill="#e8b93c"
            transform={`rotate(${a} 102 90)`}
          />
        ))}
        <circle cx="102" cy="90" r="4.5" fill="#7a5228" />
      </g>
      {/* snoozing blob, breathing */}
      <g className="bmn-breathe">
        <path
          d="M34 86 C34 70 46 62 62 62 C78 62 90 70 90 86 L90 96 C90 106 80 112 62 112 C44 112 34 106 34 96 Z"
          fill="#7d93b8"
        />
        <ellipse cx="62" cy="98" rx="20" ry="12" fill="#e3e9f4" />
        {/* closed eyes + tiny open mouth */}
        <path d="M48 84 q5 4 10 0" stroke="#2c3448" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M68 84 q5 4 10 0" stroke="#2c3448" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="63" cy="94" r="2.5" fill="#2c3448" />
        <circle cx="44" cy="92" r="3.5" fill="#c886868e" />
        <circle cx="82" cy="92" r="3.5" fill="#c886868e" />
      </g>
    </g>
  );
}

// 4. The athlete — teal, heading a football that bounces up and down.
function Athlete({ wink }: BodyProps) {
  return (
    <g>
      <ellipse cx="60" cy="122" rx="30" ry="5" fill="#00000012" />
      {/* bouncing ball */}
      <g className="bmn-ball">
        <circle cx="60" cy="26" r="10" fill="#ffffff" stroke="#2c3438" strokeWidth="1.5" />
        <path d="M60 20 l4 3 -1.5 5 h-5 L56 23 Z" fill="#2c3438" />
        <circle cx="53" cy="27" r="1.6" fill="#2c3438" />
        <circle cx="67" cy="27" r="1.6" fill="#2c3438" />
      </g>
      <g className="bmn-header">
        {/* headband */}
        <path d="M31 47 C36 40 47 36 60 36 C73 36 84 40 89 47 L89 53 C82 47 72 44 60 44 C48 44 38 47 31 53 Z" fill="#e05d5d" />
        <Blob fill="#5aa3a3" belly="#e2f0ec" />
        {/* arms out for balance */}
        <path d="M30 70 C20 68 14 62 12 56" stroke="#5aa3a3" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M90 70 C100 68 106 62 108 56" stroke="#5aa3a3" strokeWidth="9" strokeLinecap="round" fill="none" />
        <Eyes wink={wink} color="#1f3333" y={60} />
        <path d="M52 76 q8 7 16 0" stroke="#1f3333" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="42" cy="73" r="4" fill="#e8887088" />
        <circle cx="82" cy="73" r="4" fill="#e8887088" />
      </g>
      {/* planted feet */}
      <ellipse cx="46" cy="114" rx="9" ry="6" fill="#417d7d" />
      <ellipse cx="74" cy="114" rx="9" ry="6" fill="#417d7d" />
    </g>
  );
}

// 5. The yawner — plum, does a huge periodic yawn with a stretch.
function Yawner() {
  return (
    <g className="bmn-bob">
      <ellipse cx="60" cy="120" rx="30" ry="5" fill="#00000012" />
      {/* droopy antenna */}
      <path d="M60 30 C60 20 66 16 72 16" stroke="#7e5a94" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="75" cy="16" r="5" fill="#e0a13c" />
      <Blob fill="#a37bb5" belly="#f0e4f6" />
      <ellipse cx="46" cy="112" rx="9" ry="6" fill="#7e5a94" />
      <ellipse cx="74" cy="112" rx="9" ry="6" fill="#7e5a94" />
      {/* stretching arm */}
      <g className="bmn-stretch">
        <path d="M88 72 C98 66 102 56 102 48" stroke="#a37bb5" strokeWidth="9" strokeLinecap="round" fill="none" />
      </g>
      <path d="M32 72 C24 78 22 86 26 92" stroke="#a37bb5" strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* sleepy eyes that squeeze shut on the yawn */}
      <g className="bmn-yawn-eyes">
        <path d="M44 58 q6 3 12 0" stroke="#3a2a48" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M68 58 q6 3 12 0" stroke="#3a2a48" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      </g>
      {/* mouth that opens wide */}
      <g className="bmn-yawn-mouth">
        <ellipse cx="61" cy="76" rx="5" ry="4" fill="#3a2a48" />
      </g>
      <circle cx="42" cy="70" r="4" fill="#d489a88e" />
      <circle cx="82" cy="70" r="4" fill="#d489a88e" />
    </g>
  );
}

// 6. The floater — gold, drifts sideways holding a little red balloon.
function Floater({ wink }: BodyProps) {
  return (
    <g className="bmn-driftx">
      <g className="bmn-float" style={{ animationDuration: "4.4s" }}>
        {/* balloon */}
        <g className="bmn-balloon">
          <path d="M88 64 C88 46 92 34 92 22" stroke="#8a6a4a" strokeWidth="1.8" fill="none" />
          <ellipse cx="92" cy="14" rx="11" ry="13" fill="#d96060" />
          <path d="M89 26 l3 4 3 -4" fill="#b84c4c" />
          <path d="M87 8 q3 -3 6 -1" stroke="#f0a0a0" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
        {/* small round body, feet dangling */}
        <path
          d="M34 66 C34 48 46 40 60 40 C74 40 86 48 86 66 L86 88 C86 99 77 106 60 106 C43 106 34 99 34 88 Z"
          fill="#dcae4a"
        />
        <ellipse cx="60" cy="84" rx="20" ry="17" fill="#f8ecd2" />
        {/* dangling feet */}
        <g className="bmn-dangle">
          <path d="M50 106 L48 116" stroke="#b98a2e" strokeWidth="7" strokeLinecap="round" />
        </g>
        <g className="bmn-dangle" style={{ animationDelay: "-1.2s" }}>
          <path d="M70 106 L72 116" stroke="#b98a2e" strokeWidth="7" strokeLinecap="round" />
        </g>
        {/* arm holding the string */}
        <path d="M84 72 C88 70 89 67 88 64" stroke="#dcae4a" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M36 74 C30 78 28 84 30 88" stroke="#dcae4a" strokeWidth="8" strokeLinecap="round" fill="none" />
        <Eyes wink={wink} color="#4a3416" y={62} lx={51} rx={71} />
        <path d="M54 78 q7 6 14 0" stroke="#4a3416" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="44" cy="74" r="4" fill="#e8a87088" />
        <circle cx="80" cy="74" r="4" fill="#e8a87088" />
      </g>
    </g>
  );
}

const BODIES: Record<MonsterKind, (p: BodyProps) => React.ReactElement> = {
  waver: Waver,
  violinist: Violinist,
  sleeper: Sleeper,
  athlete: Athlete,
  yawner: Yawner,
  floater: Floater,
};
