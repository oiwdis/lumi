interface Props {
  avatarId: string;
  color: string;
  size?: number;
}

export default function Avatar({ avatarId, color, size = 80 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      {AVATARS[avatarId]?.(color) ?? AVATARS.seedling(color)}
    </svg>
  );
}

const AVATARS: Record<string, (c: string) => React.ReactNode> = {
  // Level 1 — Seedling: a tiny sprout
  seedling: (c) => <>
    <circle cx="40" cy="40" r="38" fill="#1a2a1a" stroke={c} strokeWidth="2.5"/>
    <rect x="38" y="28" width="4" height="26" rx="2" fill={c}/>
    <ellipse cx="30" cy="36" rx="10" ry="6" fill={c} opacity="0.85" transform="rotate(-20 30 36)"/>
    <ellipse cx="50" cy="38" rx="10" ry="6" fill={c} opacity="0.85" transform="rotate(20 50 38)"/>
    <circle cx="40" cy="26" r="5" fill={c}/>
  </>,

  // Level 2 — Explorer: compass rose
  explorer: (c) => <>
    <circle cx="40" cy="40" r="38" fill="#0d1a2a" stroke={c} strokeWidth="2.5"/>
    <circle cx="40" cy="40" r="22" fill="none" stroke={c} strokeWidth="1.5" opacity="0.4"/>
    <polygon points="40,16 43,37 40,42 37,37" fill={c}/>
    <polygon points="40,64 43,43 40,38 37,43" fill={c} opacity="0.5"/>
    <polygon points="16,40 37,43 42,40 37,37" fill={c} opacity="0.5"/>
    <polygon points="64,40 43,43 38,40 43,37" fill={c}/>
    <circle cx="40" cy="40" r="4" fill={c}/>
    <text x="40" y="14" textAnchor="middle" fontSize="8" fill={c} fontWeight="bold">N</text>
  </>,

  // Level 3 — Adventurer: shield with lightning
  adventurer: (c) => <>
    <circle cx="40" cy="40" r="38" fill="#1a1400" stroke={c} strokeWidth="2.5"/>
    <path d="M40 14 L58 22 L58 42 Q58 56 40 64 Q22 56 22 42 L22 22 Z" fill="none" stroke={c} strokeWidth="2.5"/>
    <path d="M40 14 L58 22 L58 42 Q58 56 40 64 Q22 56 22 42 L22 22 Z" fill={c} opacity="0.1"/>
    <polygon points="43,24 36,42 42,42 37,58 48,36 41,36" fill={c}/>
  </>,

  // Level 4 — Scholar: open book with star
  scholar: (c) => <>
    <circle cx="40" cy="40" r="38" fill="#0f0a1a" stroke={c} strokeWidth="2.5"/>
    <path d="M18 28 Q40 22 62 28 L62 54 Q40 48 18 54 Z" fill="none" stroke={c} strokeWidth="2"/>
    <path d="M18 28 Q40 22 62 28 L62 54 Q40 48 18 54 Z" fill={c} opacity="0.08"/>
    <line x1="40" y1="23" x2="40" y2="53" stroke={c} strokeWidth="1.5"/>
    <polygon points="40,15 41.8,20.5 47.5,20.5 43,24 44.7,29.5 40,26 35.3,29.5 37,24 32.5,20.5 38.2,20.5" fill={c}/>
  </>,

  // Level 5 — Linguist: speech bubble with globe lines
  linguist: (c) => <>
    <circle cx="40" cy="40" r="38" fill="#1a0808" stroke={c} strokeWidth="2.5"/>
    <circle cx="40" cy="38" r="20" fill="none" stroke={c} strokeWidth="2"/>
    <ellipse cx="40" cy="38" rx="10" ry="20" fill="none" stroke={c} strokeWidth="1.2" opacity="0.6"/>
    <line x1="20" y1="32" x2="60" y2="32" stroke={c} strokeWidth="1.2" opacity="0.6"/>
    <line x1="20" y1="44" x2="60" y2="44" stroke={c} strokeWidth="1.2" opacity="0.6"/>
    <path d="M36 55 L36 62 L44 55" fill={c}/>
  </>,

  // Level 6 — Polyglot: starburst / many rays
  polyglot: (c) => <>
    <circle cx="40" cy="40" r="38" fill="#1a1500" stroke={c} strokeWidth="2.5"/>
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
      const r1 = 14, r2 = 30;
      const a = (deg * Math.PI) / 180;
      return <line key={i} x1={40 + r1*Math.cos(a)} y1={40 + r1*Math.sin(a)} x2={40 + r2*Math.cos(a)} y2={40 + r2*Math.sin(a)} stroke={c} strokeWidth="2.5" strokeLinecap="round"/>;
    })}
    <circle cx="40" cy="40" r="11" fill={c}/>
    <circle cx="40" cy="40" r="6" fill="#1a1500"/>
  </>,

  // Level 7 — Master: crown
  master: (c) => <>
    <circle cx="40" cy="40" r="38" fill="#001a18" stroke={c} strokeWidth="2.5"/>
    <path d="M16 52 L22 28 L33 42 L40 20 L47 42 L58 28 L64 52 Z" fill="none" stroke={c} strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M16 52 L22 28 L33 42 L40 20 L47 42 L58 28 L64 52 Z" fill={c} opacity="0.15"/>
    <rect x="16" y="52" width="48" height="7" rx="2" fill={c}/>
    <circle cx="40" cy="20" r="4" fill={c}/>
    <circle cx="22" cy="28" r="3" fill={c}/>
    <circle cx="58" cy="28" r="3" fill={c}/>
  </>,

  // Level 8 — Grand Master: double ring + diamond
  grandmaster: (c) => <>
    <circle cx="40" cy="40" r="38" fill="#150020" stroke={c} strokeWidth="2.5"/>
    <circle cx="40" cy="40" r="28" fill="none" stroke={c} strokeWidth="1.5"/>
    <circle cx="40" cy="40" r="20" fill="none" stroke={c} strokeWidth="1.5" opacity="0.6"/>
    <polygon points="40,18 50,35 40,52 30,35" fill="none" stroke={c} strokeWidth="2.5"/>
    <polygon points="40,18 50,35 40,52 30,35" fill={c} opacity="0.15"/>
    <circle cx="40" cy="18" r="3.5" fill={c}/>
    <circle cx="50" cy="35" r="3.5" fill={c}/>
    <circle cx="40" cy="52" r="3.5" fill={c}/>
    <circle cx="30" cy="35" r="3.5" fill={c}/>
    <circle cx="40" cy="35" r="5" fill={c}/>
  </>,

  // Level 9 — Legend: phoenix / flame wings
  legend: (c) => <>
    <circle cx="40" cy="40" r="38" fill="#1a0a00" stroke={c} strokeWidth="2.5"/>
    <path d="M40 58 Q26 48 24 34 Q30 38 34 34 Q28 24 36 16 Q38 26 40 28 Q42 26 44 16 Q52 24 46 34 Q50 38 56 34 Q54 48 40 58 Z" fill={c} opacity="0.9"/>
    <path d="M40 58 Q32 50 32 42 Q36 44 38 42 Q36 36 40 30 Q44 36 42 42 Q44 44 48 42 Q48 50 40 58 Z" fill="#fff" opacity="0.25"/>
    <circle cx="40" cy="56" r="4" fill={c}/>
  </>,

  // Level 10 — Luminary: radiant star / sun crown
  luminary: (c) => <>
    <circle cx="40" cy="40" r="38" fill="#1a1500" stroke={c} strokeWidth="3"/>
    <circle cx="40" cy="40" r="38" fill="none" stroke={c} strokeWidth="1" opacity="0.3"/>
    {[0,45,90,135,180,225,270,315].map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      return <line key={i} x1={40 + 17*Math.cos(a)} y1={40 + 17*Math.sin(a)} x2={40 + 34*Math.cos(a)} y2={40 + 34*Math.sin(a)} stroke={c} strokeWidth="3" strokeLinecap="round"/>;
    })}
    {[22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5].map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      return <line key={i} x1={40 + 18*Math.cos(a)} y1={40 + 18*Math.sin(a)} x2={40 + 26*Math.cos(a)} y2={40 + 26*Math.sin(a)} stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>;
    })}
    <circle cx="40" cy="40" r="14" fill={c}/>
    <circle cx="40" cy="40" r="8" fill="#1a1500"/>
    <circle cx="40" cy="40" r="4" fill={c}/>
  </>,
};
