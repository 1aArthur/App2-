/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Heart, Key, Sparkles, X } from 'lucide-react';
import { sound } from '../sound';

interface ReviveModalProps {
  reviveTimer: number;
  reviveCost: number;
  reviveTokens: number;
  availableCoins: number;
  onReviveWithToken: () => void;
  onReviveWithCoins: () => void;
  onGiveUp: () => void;
}

export const ReviveModal: React.FC<ReviveModalProps> = ({
  reviveTimer,
  reviveCost,
  reviveTokens,
  availableCoins,
  onReviveWithToken,
  onReviveWithCoins,
  onGiveUp,
}) => {
  const canAffordCoins = availableCoins >= reviveCost;
  const progressPercent = Math.max(0, Math.min(100, (reviveTimer / 5.0) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl w-full max-w-md p-6 flex flex-col items-center text-center shadow-2xl shadow-rose-500/20 relative">
        {/* ICON & TITLE */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500/60 flex items-center justify-center text-rose-400 mb-3 animate-pulse">
          <Heart className="w-9 h-9 fill-rose-500 text-rose-500" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
          SALVAR CORRIDA?
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Continue sua corrida sem perder a pontuação e os multiplicadores!
        </p>

        {/* CIRCULAR / PROGRESS BAR TIMER */}
        <div className="w-full my-4">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-1">
            <span>TEMPO RESTANTE</span>
            <span className="text-rose-400 text-sm">{reviveTimer.toFixed(1)}s</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 h-full rounded-full transition-all duration-100 ease-linear shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="w-full flex flex-col gap-2.5 mt-2">
          {/* OPTION 1: USE REVIVE TOKEN IF AVAILABLE */}
          {reviveTokens > 0 && (
            <button
              onClick={() => {
                sound.playRevive();
                onReviveWithToken();
              }}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-black py-3.5 px-4 rounded-2xl shadow-lg shadow-rose-500/30 flex items-center justify-between transition-transform active:scale-95 cursor-pointer text-sm sm:text-base border border-pink-400/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">💖</span>
                <span>USAR FICHA SAVE ME</span>
              </div>
              <span className="bg-slate-950/40 text-pink-200 text-xs font-mono px-2 py-0.5 rounded-lg border border-pink-300/30">
                x{reviveTokens} em estoque
              </span>
            </button>
          )}

          {/* OPTION 2: PAY WITH COINS */}
          <button
            onClick={() => {
              if (canAffordCoins) {
                sound.playRevive();
                onReviveWithCoins();
              }
            }}
            disabled={!canAffordCoins}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-between transition-transform active:scale-95 border ${
              canAffordCoins
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/30 border-amber-300 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <span>PAGAR COM MOEDAS</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-base font-black">🪙 {reviveCost}</span>
              {!canAffordCoins && (
                <span className="text-[10px] text-rose-400 uppercase font-sans">(Faltam moedas)</span>
              )}
            </div>
          </button>

          {/* OPTION 3: GIVE UP / SKIP */}
          <button
            onClick={() => {
              sound.playClick();
              onGiveUp();
            }}
            className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer mt-1"
          >
            Não obrigado, encerrar corrida
          </button>
        </div>
      </div>
    </div>
  );
};
