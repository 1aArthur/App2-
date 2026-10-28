/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, ShoppingBag, Trophy, Coins, Compass } from 'lucide-react';
import { sound } from '../sound';

interface GameOverModalProps {
  score: number;
  highScore: number;
  isNewRecord: boolean;
  runCoins: number;
  totalCoins: number;
  multiplier: number;
  onRestart: () => void;
  onOpenShop: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  isNewRecord,
  runCoins,
  totalCoins,
  multiplier,
  onRestart,
  onOpenShop,
}) => {
  const formatScore = (val: number) => {
    return Math.floor(val).toString().padStart(6, '0');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl w-full max-w-md p-6 sm:p-7 flex flex-col items-center text-center shadow-2xl shadow-cyan-500/10 text-white relative">
        {/* TOP BADGE */}
        {isNewRecord ? (
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider mb-2 animate-bounce shadow-lg shadow-amber-500/30">
            👑 NOVO RECORDE HISTÓRICO! 👑
          </div>
        ) : (
          <div className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
            CORRIDA ENCERRADA
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
          FIM DE JOGO
        </h1>

        {/* SCORE DISPLAY */}
        <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            Pontuação Final
          </div>
          <div className="text-4xl sm:text-5xl font-mono font-black text-cyan-400 tracking-wider">
            {formatScore(score)}
          </div>

          <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Recorde da Conta:</span>
            <strong className="text-amber-300 font-mono font-bold">
              {formatScore(Math.max(score, highScore))}
            </strong>
          </div>
        </div>

        {/* STATS TILES */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-6 text-left">
          {/* RUN COINS */}
          <div className="bg-slate-800/60 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3">
            <span className="text-2xl">🪙</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Moedas Coletadas</span>
              <strong className="text-amber-400 text-base font-black">+{runCoins}</strong>
            </div>
          </div>

          {/* TOTAL COINS BANK */}
          <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl flex items-center gap-3">
            <Coins className="w-6 h-6 text-amber-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total no Cofre</span>
              <strong className="text-white text-base font-black">{totalCoins}</strong>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black py-3.5 px-4 rounded-2xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer text-base tracking-wide"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>JOGAR NOVAMENTE</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenShop();
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-3 px-4 rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ABRIR LOJA (PRANCHAS E VIDAS)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
