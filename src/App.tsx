/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SubwayRenderer } from './components/SubwayRenderer';
import { HUD } from './components/HUD';
import { ShopModal } from './components/ShopModal';
import { ReviveModal } from './components/ReviveModal';
import { GameOverModal } from './components/GameOverModal';
import { ControlsInfoModal } from './components/ControlsInfoModal';
import { GameStats, INITIAL_STATS, CHARACTERS, CharacterId } from './types';
import { sound } from './sound';
import confetti from 'canvas-confetti';
import { Play, Sparkles, Users, ShoppingBag, HelpCircle } from 'lucide-react';

const STORAGE_KEY = 'subway_velocity_stats_v1';

export default function App() {
  // PERSISTENT STATS IN LOCALSTORAGE (100% OFFLINE)
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...INITIAL_STATS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return INITIAL_STATS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Ignore
    }
  }, [stats]);

  // RUNTIME GAME STATE
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // RUN SCORE & COIN TRACKING
  const [score, setScore] = useState(0);
  const [runCoins, setRunCoins] = useState(0);
  const [speed, setSpeed] = useState(30);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const newRecordCelebrated = useRef(false);

  // DYNAMIC PROGRESSIVE DIFFICULTY
  const [currentPhaseName, setCurrentPhaseName] = useState('Estação Central');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(54);

  // HOVERBOARD RUNTIME STATE
  const [hoverboardActive, setHoverboardActive] = useState(false);
  const [hoverboardTimeLeft, setHoverboardTimeLeft] = useState(0);

  // INVULNERABILITY SHIELD
  const [invulnerableTimer, setInvulnerableTimer] = useState(0);

  // ACTIVE POWERUPS
  const [activePowers, setActivePowers] = useState<{
    magnet: number;
    multiplier: number;
    sneakers: number;
  }>({
    magnet: 0,
    multiplier: 0,
    sneakers: 0,
  });

  // REVIVE SYSTEM ("SAVE ME")
  const [isInRevivePrompt, setIsInRevivePrompt] = useState(false);
  const [reviveTimer, setReviveTimer] = useState(5.0);
  const [reviveCost, setReviveCost] = useState(100);

  // UI MODALS
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopInitialTab, setShopInitialTab] = useState<'characters' | 'boards' | 'revives' | 'upgrades'>('boards');
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  const currentMultiplier = stats.baseMultiplier * (activePowers.multiplier > 0 ? 2 : 1);

  // START RUN
  const handleStartGame = () => {
    sound.playClick();
    setHasStarted(true);
    setIsPlaying(true);
    setIsPaused(false);
    setIsGameOver(false);
    setScore(0);
    setRunCoins(0);
    setSpeed(30);
    setIsNewRecord(false);
    newRecordCelebrated.current = false;
    setHoverboardActive(false);
    setHoverboardTimeLeft(0);
    setInvulnerableTimer(0);
    setActivePowers({ magnet: 0, multiplier: 0, sneakers: 0 });
    setIsInRevivePrompt(false);
    setReviveCost(100);
    setCurrentPhaseName('Estação Central');
    setCurrentPhaseIndex(0);
  };

  const handleRestart = () => {
    handleStartGame();
  };

  // ACTIVATE HOVERBOARD (SHIFT OR BUTTON OR DOUBLE TAP)
  const handleActivateHoverboard = () => {
    if (hoverboardActive) return;
    if (stats.hoverboardInventory <= 0) {
      sound.playCrash();
      return;
    }
    sound.playBoardActivate();
    setStats((prev) => ({
      ...prev,
      hoverboardInventory: Math.max(0, prev.hoverboardInventory - 1),
    }));
    setHoverboardActive(true);
    setHoverboardTimeLeft(25.0);
  };

  const handleHoverboardBroken = () => {
    setHoverboardActive(false);
    setHoverboardTimeLeft(0);
    setInvulnerableTimer(2.5);
  };

  const handleCollectCoin = (amount: number) => {
    setRunCoins((prev) => prev + amount);
  };

  const handleCollectPowerup = (kind: 'magnet' | 'multiplier' | 'sneakers') => {
    const level = stats.powerupLevels[kind];
    const duration = 10 + level * 2;
    setActivePowers((prev) => ({
      ...prev,
      [kind]: duration,
    }));
  };

  const handleScoreTick = (deltaDist: number) => {
    setScore((prev) => {
      const nextScore = prev + deltaDist * (currentMultiplier * 0.4);

      if (stats.highScore > 0 && nextScore > stats.highScore && !newRecordCelebrated.current) {
        newRecordCelebrated.current = true;
        setIsNewRecord(true);
        sound.playNewRecord();
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.4 } });
      }

      return nextScore;
    });

    // Time & distance progressive difficulty: gradual acceleration
    setSpeed((prev) => Math.min(prev + deltaDist * 0.007, 68));
  };

  const handlePhaseUpdate = (phaseName: string, phaseIndex: number, newSpeedKmh: number) => {
    setCurrentPhaseName(phaseName);
    setCurrentPhaseIndex(phaseIndex);
    setSpeedKmh(newSpeedKmh);
  };

  const handlePlayerCrash = () => {
    setIsInRevivePrompt(true);
    setReviveTimer(5.0);
  };

  const handleReviveWithToken = () => {
    if (stats.reviveTokens <= 0) return;
    setStats((prev) => ({
      ...prev,
      reviveTokens: prev.reviveTokens - 1,
    }));
    triggerReviveSuccess();
  };

  const handleReviveWithCoins = () => {
    const totalAvailable = stats.totalCoins + runCoins;
    if (totalAvailable < reviveCost) return;

    if (runCoins >= reviveCost) {
      setRunCoins((prev) => prev - reviveCost);
    } else {
      const rem = reviveCost - runCoins;
      setRunCoins(0);
      setStats((prev) => ({
        ...prev,
        totalCoins: Math.max(0, prev.totalCoins - rem),
      }));
    }

    setReviveCost((prev) => prev * 2);
    triggerReviveSuccess();
  };

  const triggerReviveSuccess = () => {
    setIsInRevivePrompt(false);
    setInvulnerableTimer(3.0);
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.5 } });
  };

  const handleGiveUpRevive = () => {
    setIsInRevivePrompt(false);
    handleFinalGameOver();
  };

  const handleFinalGameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);

    const finalScore = Math.floor(score);
    const updatedHighScore = Math.max(stats.highScore, finalScore);
    const isNew = finalScore > stats.highScore;

    setStats((prev) => ({
      ...prev,
      totalCoins: prev.totalCoins + runCoins,
      highScore: updatedHighScore,
      totalRuns: prev.totalRuns + 1,
    }));

    if (isNew) {
      sound.playNewRecord();
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.45 } });
    }
  };

  // TIMERS TICK
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const interval = setInterval(() => {
      const dt = 0.1;

      if (isInRevivePrompt) {
        setReviveTimer((prev) => {
          if (prev <= dt) {
            handleFinalGameOver();
            return 0;
          }
          return prev - dt;
        });
        return;
      }

      if (hoverboardActive) {
        setHoverboardTimeLeft((prev) => {
          if (prev <= dt) {
            setHoverboardActive(false);
            return 0;
          }
          return prev - dt;
        });
      }

      setInvulnerableTimer((prev) => Math.max(0, prev - dt));

      setActivePowers((prev) => ({
        magnet: Math.max(0, prev.magnet - dt),
        multiplier: Math.max(0, prev.multiplier - dt),
        sneakers: Math.max(0, prev.sneakers - dt),
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, isInRevivePrompt, hoverboardActive]);

  const activeChar = CHARACTERS.find((c) => c.id === stats.selectedCharacter) || CHARACTERS[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D SUBWAY SURF RUNNER VIEWPORT */}
      <SubwayRenderer
        isPlaying={isPlaying && hasStarted}
        isPaused={isPaused}
        isInRevivePrompt={isInRevivePrompt}
        isGameOver={isGameOver}
        speed={speed}
        hoverboardActive={hoverboardActive}
        selectedBoardSkin={stats.selectedBoardSkin}
        selectedCharacter={stats.selectedCharacter}
        invulnerableTimer={invulnerableTimer}
        activePowers={activePowers}
        onCollectCoin={handleCollectCoin}
        onCollectPowerup={handleCollectPowerup}
        onPlayerCrash={handlePlayerCrash}
        onHoverboardBroken={handleHoverboardBroken}
        onScoreTick={handleScoreTick}
        onActivateBoardRequest={handleActivateHoverboard}
        onPhaseUpdate={handlePhaseUpdate}
      />

      {/* GAME RUNTIME HUD OVERLAY */}
      {hasStarted && !isGameOver && (
        <HUD
          score={score}
          highScore={stats.highScore}
          multiplier={currentMultiplier}
          runCoins={runCoins}
          totalCoins={stats.totalCoins}
          hoverboardInventory={stats.hoverboardInventory}
          hoverboardActive={hoverboardActive}
          hoverboardTimeLeft={hoverboardTimeLeft}
          reviveTokens={stats.reviveTokens}
          selectedCharacter={stats.selectedCharacter}
          activePowers={activePowers}
          invulnerableTimer={invulnerableTimer}
          isNewRecord={isNewRecord}
          currentPhaseName={currentPhaseName}
          currentPhaseIndex={currentPhaseIndex}
          speedKmh={speedKmh}
          onActivateHoverboard={handleActivateHoverboard}
          onOpenShop={(tab = 'boards') => {
            sound.playClick();
            setShopInitialTab(tab);
            setIsPaused(true);
            setIsShopOpen(true);
          }}
          onOpenControls={() => {
            sound.playClick();
            setIsPaused(true);
            setIsControlsOpen(true);
          }}
          onTogglePause={() => {
            sound.playClick();
            setIsPaused(!isPaused);
          }}
          isPaused={isPaused}
        />
      )}

      {/* PAUSE OVERLAY */}
      {isPaused && !isShopOpen && !isControlsOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-cyan-500/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl text-white">
            <h2 className="text-3xl font-black mb-2 text-cyan-400">JOGO PAUSADO</h2>
            <p className="text-xs text-slate-300 mb-6">Respira fundo e prepare seus reflexos!</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  sound.playClick();
                  setIsPaused(false);
                }}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black py-3 rounded-2xl transition-transform active:scale-95 cursor-pointer text-base shadow-lg shadow-cyan-500/20"
              >
                CONTINUAR CORRIDA
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setShopInitialTab('characters');
                  setIsShopOpen(true);
                }}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl border border-purple-500/40 transition-colors cursor-pointer text-sm"
              >
                TROCAR PERSONAGEM (7 GRÁTIS)
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setShopInitialTab('boards');
                  setIsShopOpen(true);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer text-sm"
              >
                ABRIR LOJA
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  handleFinalGameOver();
                }}
                className="w-full text-slate-400 hover:text-rose-400 text-xs py-2 transition-colors cursor-pointer"
              >
                Encerrar Partida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* START SCREEN (Before first game) */}
      {!hasStarted && (
        <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-5 sm:p-8 max-w-lg w-full text-center shadow-2xl text-white flex flex-col items-center my-auto">
            <div className="text-5xl sm:text-6xl mb-1 animate-bounce">🛹</div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-0.5">
              SUBWAY <span className="text-cyan-400">SURF</span>
            </h1>
            <div className="bg-cyan-500/20 text-cyan-300 font-mono text-xs font-black px-3 py-1 rounded-full border border-cyan-500/40 mb-3">
              VELOCITY 8000Hz • 7 SKINS GRÁTIS • 100% OFFLINE
            </div>

            {/* EQUIPPED CHARACTER HIGHLIGHT & QUICK SWITCH */}
            <div className="w-full bg-gradient-to-r from-purple-950/60 to-slate-950/80 border border-purple-500/40 rounded-2xl p-3.5 mb-4 text-left flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                  Personagem Atual
                </span>
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <span>{activeChar.name}</span>
                  <span className="text-xs text-slate-400">
                    ({activeChar.gender === 'M' ? '♂️' : '♀️'})
                  </span>
                </h3>
                <span className="text-[11px] font-bold block mt-0.5" style={{ color: activeChar.effectColor }}>
                  {activeChar.effectName}
                </span>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  setShopInitialTab('characters');
                  setIsShopOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-black px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow-md cursor-pointer transition-transform active:scale-95"
              >
                <Users className="w-3.5 h-3.5" />
                <span>TROCAR (7)</span>
              </button>
            </div>

            {/* CURRENCY & INVENTORY SUMMARY */}
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mb-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-amber-500/30">
                <span className="text-base">🪙</span>
                <span className="block text-amber-400 font-mono font-black text-sm">
                  {stats.totalCoins}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">Moedas</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-cyan-500/30">
                <span className="text-base">🛹</span>
                <span className="block text-cyan-400 font-mono font-black text-sm">
                  x{stats.hoverboardInventory}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">Pranchas</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-rose-500/30">
                <span className="text-base">💖</span>
                <span className="block text-rose-400 font-mono font-black text-sm">
                  x{stats.reviveTokens}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">Save Me</span>
              </div>
            </div>

            {/* PLAY BUTTON */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={handleStartGame}
                className="w-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 text-lg tracking-wide transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-6 h-6 fill-slate-950 stroke-none" />
                <span>INICIAR CORRIDA</span>
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    setShopInitialTab('characters');
                    setIsShopOpen(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-purple-400 font-bold py-2.5 px-2 rounded-xl border border-slate-700 transition-colors cursor-pointer text-xs"
                >
                  🎭 SKINS (7)
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setShopInitialTab('boards');
                    setIsShopOpen(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 px-2 rounded-xl border border-slate-700 transition-colors cursor-pointer text-xs"
                >
                  🛍️ LOJA
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsControlsOpen(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold py-2.5 px-2 rounded-xl border border-slate-700 transition-colors cursor-pointer text-xs"
                >
                  🎮 CONTROLES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVIVE MODAL ("SAVE ME") */}
      {isInRevivePrompt && (
        <ReviveModal
          reviveTimer={reviveTimer}
          reviveCost={reviveCost}
          reviveTokens={stats.reviveTokens}
          availableCoins={stats.totalCoins + runCoins}
          onReviveWithToken={handleReviveWithToken}
          onReviveWithCoins={handleReviveWithCoins}
          onGiveUp={handleGiveUpRevive}
        />
      )}

      {/* GAME OVER MODAL */}
      {isGameOver && (
        <GameOverModal
          score={score}
          highScore={stats.highScore}
          isNewRecord={isNewRecord}
          runCoins={runCoins}
          totalCoins={stats.totalCoins}
          multiplier={currentMultiplier}
          onRestart={handleRestart}
          onOpenShop={() => {
            sound.playClick();
            setShopInitialTab('characters');
            setIsShopOpen(true);
          }}
        />
      )}

      {/* SHOP & CHARACTER SKINS MODAL */}
      {isShopOpen && (
        <ShopModal
          stats={stats}
          onUpdateStats={setStats}
          onClose={() => {
            setIsShopOpen(false);
            if (isPaused) setIsPaused(false);
          }}
        />
      )}

      {/* CONTROLS & 8000HZ INFO MODAL */}
      {isControlsOpen && (
        <ControlsInfoModal
          onClose={() => {
            setIsControlsOpen(false);
            if (isPaused) setIsPaused(false);
          }}
        />
      )}
    </div>
  );
}
