/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ActivePowerState {
  kind: 'magnet' | 'multiplier' | 'sneakers' | 'jetpack';
  timeLeft: number;
  totalDuration: number;
}

export type BoardSkinId = 'classic' | 'neon8000' | 'lava' | 'galaxy' | 'stealth';

export interface BoardSkin {
  id: BoardSkinId;
  name: string;
  desc: string;
  color: string;
  glowColor: string;
  thrusterColor: string;
  price: number;
  unlocked: boolean;
}

export type CharacterId =
  | 'jake_graffiti' // Padrão Masculino (Tinta no braço)
  | 'tricky_neon' // Padrão Feminino (Tinta nos pés)
  | 'cyber_8000hz' // Grátis 1 (Raios e circuitos no peito/olhos)
  | 'ignis_lava' // Grátis 2 (Brasas e chamas nos ombros)
  | 'kage_shadow' // Grátis 3 (Névoa de sombra roxa)
  | 'aura_galaxy' // Grátis 4 (Poeira estelar dourada)
  | 'zack_bboy'; // Grátis 5 (Ondas sonoras e graffiti boombox)

export interface CharacterSkin {
  id: CharacterId;
  name: string;
  gender: 'M' | 'F' | 'E';
  title: string;
  desc: string;
  effectName: string;
  effectColor: string;
  hoodieColor: string;
  pantsColor: string;
  capColor: string;
  skinColor: string;
  isDefaultOrFree: boolean;
}

export const CHARACTERS: CharacterSkin[] = [
  {
    id: 'jake_graffiti',
    name: 'Leo Graffiti',
    gender: 'M',
    title: 'Padrão Masculino',
    desc: 'O rei do metrô urbano. Carrega suas latas de spray e deixa sua marca por onde passa.',
    effectName: '🎨 Tinta de Spray nos Braços (Gotejamento Neon)',
    effectColor: '#00f0ff',
    hoodieColor: '#2563eb', // Blue hoodie
    pantsColor: '#1e293b',
    capColor: '#ef4444', // Red backwards cap
    skinColor: '#fbbf24',
    isDefaultOrFree: true,
  },
  {
    id: 'tricky_neon',
    name: 'Maya Neon',
    gender: 'F',
    title: 'Padrão Feminino',
    desc: 'Ágil e acrobática com tênis hiper-modificados que pintam o ar a cada salto.',
    effectName: '👟 Tinta de Spray nos Pés (Rastro Neon nos Saltos)',
    effectColor: '#ec4899',
    hoodieColor: '#d946ef', // Magenta/pink cropped hoodie
    pantsColor: '#0f172a',
    capColor: '#f43f5e', // Pink headband / cap
    skinColor: '#fed7aa',
    isDefaultOrFree: true,
  },
  {
    id: 'cyber_8000hz',
    name: 'Kael 8000Hz',
    gender: 'M',
    title: 'Grátis • Cibernético',
    desc: 'Corredor cibernético otimizado com tempo de reação de 0.125 milissegundos.',
    effectName: '⚡ Circuitos Elétricos & Raios 8000Hz no Peito e Olhos',
    effectColor: '#10b981',
    hoodieColor: '#064e3b',
    pantsColor: '#022c22',
    capColor: '#10b981',
    skinColor: '#a7f3d0',
    isDefaultOrFree: true,
  },
  {
    id: 'ignis_lava',
    name: 'Ignis Vulcão',
    gender: 'M',
    title: 'Grátis • Magma',
    desc: 'Nascido nas caldeiras vulcânicas, queima o asfalto por onde corre.',
    effectName: '🔥 Brasas Vivas e Chamas nos Ombros',
    effectColor: '#f97316',
    hoodieColor: '#991b1b',
    pantsColor: '#450a0a',
    capColor: '#ea580c',
    skinColor: '#ffedd5',
    isDefaultOrFree: true,
  },
  {
    id: 'kage_shadow',
    name: 'Kage Sombra',
    gender: 'M',
    title: 'Grátis • Ninja Urbano',
    desc: 'Mestre da furtividade nos trilhos abandonados, corre envolto em véus sombrios.',
    effectName: '🌑 Névoa de Sombras Roxas nas Costas',
    effectColor: '#a855f7',
    hoodieColor: '#3b0764',
    pantsColor: '#18022e',
    capColor: '#7e22ce',
    skinColor: '#e9d5ff',
    isDefaultOrFree: true,
  },
  {
    id: 'aura_galaxy',
    name: 'Aura Estelar',
    gender: 'F',
    title: 'Grátis • Cósmica',
    desc: 'Uma viajante cósmica cuja corrida ilumina os túneis com constelações.',
    effectName: '✨ Poeira Estelar Dourada e Constelações',
    effectColor: '#ffd700',
    hoodieColor: '#eab308',
    pantsColor: '#713f12',
    capColor: '#facc15',
    skinColor: '#fef9c3',
    isDefaultOrFree: true,
  },
  {
    id: 'zack_bboy',
    name: 'Zack B-Boy',
    gender: 'M',
    title: 'Grátis • Hip-Hop Retro',
    desc: 'Dançarino de rua que corre no compasso das batidas mais pesadas.',
    effectName: '🎵 Ondas Sonoras e Graffiti Boombox nos Pulsos',
    effectColor: '#06b6d4',
    hoodieColor: '#e11d48',
    pantsColor: '#312e81',
    capColor: '#fbbf24',
    skinColor: '#fed7aa',
    isDefaultOrFree: true,
  },
];

export interface GameStats {
  highScore: number;
  totalCoins: number;
  hoverboardInventory: number;
  reviveTokens: number;
  selectedBoardSkin: BoardSkinId;
  selectedCharacter: CharacterId;
  totalRuns: number;
  unlockedSkins: BoardSkinId[];
  baseMultiplier: number; // e.g. 30
  powerupLevels: {
    magnet: number;
    multiplier: number;
    sneakers: number;
  };
}

export const INITIAL_STATS: GameStats = {
  highScore: 0,
  totalCoins: 500,
  hoverboardInventory: 5,
  reviveTokens: 2,
  selectedBoardSkin: 'classic',
  selectedCharacter: 'jake_graffiti',
  totalRuns: 0,
  unlockedSkins: ['classic'],
  baseMultiplier: 30,
  powerupLevels: {
    magnet: 1,
    multiplier: 1,
    sneakers: 1,
  },
};

export const BOARD_SKINS: BoardSkin[] = [
  {
    id: 'classic',
    name: 'Prancha Subway Clássica',
    desc: 'O hoverboard tradicional das linhas de trem. Ágil, confiável e resistente.',
    color: '#00f0ff',
    glowColor: '#00c3ff',
    thrusterColor: '#00ffff',
    price: 0,
    unlocked: true,
  },
  {
    id: 'neon8000',
    name: 'Cyber 8000Hz Rapid-Trigger',
    desc: 'Equipada com reatores magnéticos que reagem a cada 0.125 milissegundo.',
    color: '#00ff88',
    glowColor: '#10b981',
    thrusterColor: '#34d399',
    price: 450,
    unlocked: false,
  },
  {
    id: 'lava',
    name: 'Lava Vulcânica',
    desc: 'Emite chamas incandescentes que iluminam os trilhos escuros.',
    color: '#ff3b30',
    glowColor: '#f97316',
    thrusterColor: '#fbbf24',
    price: 800,
    unlocked: false,
  },
  {
    id: 'galaxy',
    name: 'Galáxia Dourada 24K',
    desc: 'Banhada em ouro maciço com rastro de poeira estelar cintilante.',
    color: '#ffd700',
    glowColor: '#f59e0b',
    thrusterColor: '#fef08a',
    price: 1500,
    unlocked: false,
  },
  {
    id: 'stealth',
    name: 'Phantom Stealth X',
    desc: 'Design aerodinâmico escuro com neon roxo hiper-sônico.',
    color: '#a855f7',
    glowColor: '#9333ea',
    thrusterColor: '#c084fc',
    price: 2200,
    unlocked: false,
  },
];
