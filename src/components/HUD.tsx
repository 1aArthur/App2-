/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Pause, ShoppingBag, HelpCircle, Shield, Zap, Users, Gauge } from 'lucide-react';
import { CharacterId, CHARACTERS } from '../types';
import { sound } from '../sound';

interface HUDProps {
  score: number;
  highScore: number;
  multiplier: number;
  runCoins: number;
  totalCoins: number;
  hoverboardInventory: number;
  hoverboardActive: boolean;
  hoverboardTimeLeft: number;
  reviveTokens: number;
  selectedCharacter: CharacterId;
  activePowers: {
    magnet: number;
    multiplier: number;
    sneakers: number;
  };
  invulnerableTimer: number;
  isNewRecord: boolean;
  currentPhaseName: string;
  currentPhaseIndex: number;
  speedKmh: number;
  onActivateHoverboard: () => void;
  onOpenShop: (initialTab?: 'characters' | 'boards' | 'revives' | 'upgrades') => void;
  onOpenControls: () => void;
  onTogglePause: () => void;
  isPaused: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  multiplier,
  runCoins,
  totalCoins,
  hoverboardInventory,
  hoverboardActive,
  hoverboardTimeLeft,
  reviveTokens,
  selectedCharacter,
  activePowers,
  invulnerableTimer,
  isNewRecord,
  currentPhaseName,
  currentPhaseIndex,
  speedKmh,
  onActivateHoverboard,
  onOpenShop,
  onOpenControls,
  onTogglePause,
  isPaused,
}) => {
  const [muted, setMuted] = React.useState(sound.isMuted);

  const toggleSound = () => {
    sound.isMuted = !sound.isMuted;
    setMuted(sound.isMuted);
    if (!sound.isMuted) sound.playClick();
  };

  const formatScore = (val: number) => {
    return Math.floor(val).toString().padStart(6, '0');
  };

  const activeChar = CHARACTERS.find((c) => c.id === selectedCharacter) || CHARACTERS[0];

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* TOP HEADER */}
      <div className="flex items-start justify-between w-full">
        {/* TOP LEFT: Quick Controls & Currency Counters */}
        <div className="flex flex-col gap-2">
          {/* Action buttons bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            <button
              onClick={onTogglePause}
              className="bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-white p-2 sm:p-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
              title="Pausar / Continuar"
            >
              <Pause className="w-5 h-5 text-cyan-400" />
            </button>

            <button
              onClick={toggleSound}
              className="bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-white p-2 sm:p-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
              title={muted ? 'Ativar Som' : 'Silenciar'}
            >
              {muted ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              )}
            </button>

            {/* CHARACTERS / SKINS BUTTON */}
            <button
              onClick={() => onOpenShop('characters')}
              className="bg-purple-600/90 hover:bg-purple-500 text-white font-black px-2.5 sm:px-3 py-2 rounded-xl shadow-lg shadow-purple-500/20 transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm tracking-wide"
              title="Trocar Personagem (7 Skins Grátis)"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">SKINS</span>
            </button>

            {/* SHOP BUTTON */}
            <button
              onClick={() => onOpenShop('boards')}
              className="bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-black px-3 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm tracking-wide"
              title="Abrir Loja de Pranchas e Renascimentos"
            >
              <ShoppingBag className="w-4 h-4 fill-slate-950" />
              <span>LOJA</span>
            </button>

            <button
              onClick={onOpenControls}
              className="bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-slate-300 p-2 sm:p-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
              title="Instruções de Controles e 8000Hz"
            >
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </button>
          </div>

          {/* Counters: Coins, Total Bank, Revive Tokens, Active Character Info */}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {/* Coins Counter */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <div className="flex flex-col">
                <span className="text-amber-400 font-extrabold text-sm sm:text-base leading-none">
                  {runCoins}
                </span>
                <span className="text-[10px] text-amber-200/70 font-mono">
                  Banco: {totalCoins + runCoins}
                </span>
              </div>
            </div>

            {/* Revive Tokens Counter ("Save Me" Keys) */}
            <div
              onClick={() => onOpenShop('revives')}
              className="pointer-events-auto cursor-pointer bg-slate-900/90 hover:bg-slate-800/90 border border-rose-500/40 px-2.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
              title="Fichas de Renascimento (Clique para ver na Loja)"
            >
              <span className="text-lg">💖</span>
              <div className="flex flex-col">
                <span className="text-rose-400 font-black text-xs sm:text-sm leading-none">
                  x{reviveTokens}
                </span>
                <span className="text-[9px] text-rose-300/70 uppercase font-semibold">Salvar</span>
              </div>
            </div>

            {/* Active Character Badge with Effect */}
            <div
              onClick={() => onOpenShop('characters')}
              className="pointer-events-auto cursor-pointer bg-slate-900/80 hover:bg-slate-850 border border-purple-500/30 px-2.5 py-1 rounded-xl shadow flex items-center gap-1.5 text-xs text-slate-300"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shadow"
                style={{ backgroundColor: activeChar.effectColor }}
              />
              <span className="font-bold text-white text-[11px]">{activeChar.name}</span>
            </div>
          </div>

          {/* DYNAMIC PROGRESSIVE DIFFICULTY & SPEEDOMETER */}
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 border ${
                currentPhaseIndex >= 3
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
                  : currentPhaseIndex === 2
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                  : currentPhaseIndex === 1
                  ? 'bg-pink-950/80 border-pink-500/60 text-pink-300'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300'
              }`}
            >
              <span>{currentPhaseName}</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>{speedKmh} km/h</span>
            </div>
          </div>
        </div>

        {/* TOP RIGHT: Subway Surfers Classic Scoreboard */}
        <div className="flex flex-col items-end gap-1">
          {/* HIGH SCORE RECORD BADGE */}
          <div className="bg-slate-950/85 border border-amber-400/30 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
            <span className="text-amber-400 text-xs">👑</span>
            <span className="text-[11px] uppercase tracking-wider text-amber-200/80 font-bold">
              Recorde:
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-amber-300">
              {formatScore(Math.max(highScore, score))}
            </span>
          </div>

          {/* RUN SCORE WITH MULTIPLIER */}
          <div className="flex items-center gap-2">
            <div
              className={`px-2.5 py-1 rounded-lg font-black text-xs sm:text-sm shadow-lg flex items-center gap-0.5 tracking-tighter ${
                multiplier > 30
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-emerald-500/40 animate-pulse'
                  : 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-amber-500/30'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>x{multiplier}</span>
            </div>

            <div className="text-2xl sm:text-4xl md:text-5xl font-mono font-black tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {formatScore(score)}
            </div>
          </div>

          {/* New Record Banner if beaten */}
          {isNewRecord && (
            <div className="bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[11px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider animate-bounce shadow-lg shadow-amber-500/40">
              ⭐ NOVO RECORDE! ⭐
            </div>
          )}

          {/* Invulnerability / Shield indicator */}
          {invulnerableTimer > 0 && (
            <div className="bg-cyan-500/90 text-slate-950 text-xs font-black px-2.5 py-1 rounded-md flex items-center gap-1 mt-0.5 shadow-md">
              <Shield className="w-3.5 h-3.5 fill-slate-950" />
              <span>ESCUDO ATIVO ({invulnerableTimer.toFixed(1)}s)</span>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE LEFT: Active Powerups Status Bars */}
      <div className="flex flex-col gap-2 my-auto self-start max-w-[170px]">
        {activePowers.magnet > 0 && (
          <div className="bg-slate-900/90 border border-rose-500/50 p-2 rounded-xl shadow-lg flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-black text-rose-400">
              <span className="flex items-center gap-1">🧲 ÍMÃ</span>
              <span>{activePowers.magnet.toFixed(1)}s</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-100"
                style={{ width: `${(activePowers.magnet / 12) * 100}%` }}
              />
            </div>
          </div>
        )}

        {activePowers.multiplier > 0 && (
          <div className="bg-slate-900/90 border border-emerald-500/50 p-2 rounded-xl shadow-lg flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-black text-emerald-400">
              <span className="flex items-center gap-1">⚡ 2X PONTOS</span>
              <span>{activePowers.multiplier.toFixed(1)}s</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-100"
                style={{ width: `${(activePowers.multiplier / 12) * 100}%` }}
              />
            </div>
          </div>
        )}

        {activePowers.sneakers > 0 && (
          <div className="bg-slate-900/90 border border-blue-500/50 p-2 rounded-xl shadow-lg flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-black text-blue-400">
              <span className="flex items-center gap-1">👟 SUPER PULO</span>
              <span>{activePowers.sneakers.toFixed(1)}s</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-400 h-full transition-all duration-100"
                style={{ width: `${(activePowers.sneakers / 12) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM BAR: Hoverboard Action Button & Counter */}
      <div className="flex items-end justify-between w-full">
        {/* HOVERBOARD BUTTON */}
        <div className="pointer-events-auto">
          <button
            onClick={onActivateHoverboard}
            disabled={hoverboardActive || hoverboardInventory <= 0}
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer ${
              hoverboardActive
                ? 'bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 border-2 border-emerald-300 text-slate-950 shadow-emerald-500/30'
                : hoverboardInventory > 0
                ? 'bg-gradient-to-r from-slate-900/95 to-slate-800/95 border-2 border-cyan-500/70 hover:border-cyan-400 text-white shadow-cyan-500/20'
                : 'bg-slate-900/70 border border-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
          >
            <div className="text-3xl sm:text-4xl">🛹</div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-wide">
                  {hoverboardActive ? 'PRANCHA ATIVA!' : 'ATIVAR PRANCHA'}
                </span>
                <span className="hidden sm:inline-block bg-slate-800/90 text-cyan-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30">
                  SHIFT
                </span>
              </div>
              <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                {hoverboardActive ? (
                  <span className="text-emerald-300 font-mono font-bold">
                    🛡️ {hoverboardTimeLeft.toFixed(1)}s restantes (Anti-Morte)
                  </span>
                ) : (
                  <span>
                    Estoque: <strong className="text-cyan-400 font-bold">x{hoverboardInventory}</strong>
                    {hoverboardInventory <= 0 && ' (Compre na Loja)'}
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* CONTROLS HINT FOR MOBILE / PC */}
        <div className="hidden md:flex flex-col items-end text-right bg-slate-950/70 backdrop-blur-sm border border-slate-800/80 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 font-mono">
          <div>
            <strong className="text-cyan-400">A / D</strong> ou <strong className="text-cyan-400">← →</strong> : Pistas
          </div>
          <div>
            <strong className="text-cyan-400">W / Espaço</strong>: Pular | <strong className="text-cyan-400">S</strong>: Rolar
          </div>
          <div className="text-emerald-400 font-bold">8000Hz Polling: 0.125ms Input</div>
        </div>
      </div>
    </div>
  );
};
