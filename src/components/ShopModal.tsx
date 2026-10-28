/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ShoppingBag, ShieldCheck, Zap, Sparkles, Check, Users, Crown } from 'lucide-react';
import { BoardSkinId, CharacterId, BOARD_SKINS, CHARACTERS, GameStats } from '../types';
import { sound } from '../sound';
import confetti from 'canvas-confetti';

interface ShopModalProps {
  stats: GameStats;
  onUpdateStats: (newStats: GameStats) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ stats, onUpdateStats, onClose }) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'boards' | 'revives' | 'upgrades'>('characters');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // EQUIP FREE CHARACTER
  const handleSelectCharacter = (charId: CharacterId) => {
    sound.playPowerup();
    onUpdateStats({
      ...stats,
      selectedCharacter: charId,
    });
    const char = CHARACTERS.find((c) => c.id === charId);
    showToast(`✨ Personagem equipada: ${char?.name}!`);
  };

  // BUY HOVERBOARD PACKS
  const buyHoverboards = (amount: number, cost: number) => {
    if (stats.totalCoins < cost) {
      sound.playCrash();
      showToast('❌ Moedas insuficientes!');
      return;
    }
    sound.playPowerup();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    onUpdateStats({
      ...stats,
      totalCoins: stats.totalCoins - cost,
      hoverboardInventory: stats.hoverboardInventory + amount,
    });
    showToast(`✅ +${amount} Prancha${amount > 1 ? 's' : ''} adicionada${amount > 1 ? 's' : ''}!`);
  };

  // BUY REVIVE TOKENS
  const buyReviveTokens = (amount: number, cost: number) => {
    if (stats.totalCoins < cost) {
      sound.playCrash();
      showToast('❌ Moedas insuficientes!');
      return;
    }
    sound.playRevive();
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    onUpdateStats({
      ...stats,
      totalCoins: stats.totalCoins - cost,
      reviveTokens: stats.reviveTokens + amount,
    });
    showToast(`💖 +${amount} Ficha${amount > 1 ? 's' : ''} de Renascimento adquirida${amount > 1 ? 's' : ''}!`);
  };

  // UNLOCK OR EQUIP BOARD SKIN
  const handleSkinAction = (skinId: BoardSkinId, price: number) => {
    const isUnlocked = stats.unlockedSkins.includes(skinId);

    if (isUnlocked) {
      sound.playClick();
      onUpdateStats({
        ...stats,
        selectedBoardSkin: skinId,
      });
      showToast('🛹 Prancha equipada com sucesso!');
    } else {
      if (stats.totalCoins < price) {
        sound.playCrash();
        showToast('❌ Moedas insuficientes para desbloquear esta prancha!');
        return;
      }
      sound.playPowerup();
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
      onUpdateStats({
        ...stats,
        totalCoins: stats.totalCoins - price,
        unlockedSkins: [...stats.unlockedSkins, skinId],
        selectedBoardSkin: skinId,
      });
      showToast('✨ Nova Prancha 3D Desbloqueada e Equipada!');
    }
  };

  // UPGRADE POWERUPS
  const upgradePower = (powerKey: 'magnet' | 'multiplier' | 'sneakers') => {
    const currentLevel = stats.powerupLevels[powerKey];
    if (currentLevel >= 5) {
      showToast('⭐ Nível máximo atingido!');
      return;
    }
    const cost = currentLevel * 350;
    if (stats.totalCoins < cost) {
      sound.playCrash();
      showToast('❌ Moedas insuficientes para a melhoria!');
      return;
    }
    sound.playPowerup();
    onUpdateStats({
      ...stats,
      totalCoins: stats.totalCoins - cost,
      powerupLevels: {
        ...stats.powerupLevels,
        [powerKey]: currentLevel + 1,
      },
    });
    showToast(`⚡ Melhoria aplicada: Nível ${currentLevel + 1}!`);
  };

  // UPGRADE BASE MULTIPLIER
  const upgradeBaseMultiplier = () => {
    const cost = (stats.baseMultiplier - 28) * 400;
    if (stats.totalCoins < cost) {
      sound.playCrash();
      showToast('❌ Moedas insuficientes!');
      return;
    }
    sound.playNewRecord();
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.5 } });
    onUpdateStats({
      ...stats,
      totalCoins: stats.totalCoins - cost,
      baseMultiplier: stats.baseMultiplier + 2,
    });
    showToast(`🔥 Multiplicador aumentado para x${stats.baseMultiplier + 2}!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-500/10 overflow-hidden text-white relative">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 border border-amber-500/40 p-2.5 rounded-2xl">
              <ShoppingBag className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white flex items-center gap-2">
                LOJA & SKINS
                <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  7 PERSONAGENS GRÁTIS
                </span>
              </h2>
              <p className="text-xs text-slate-400">Escolha personagens, compre pranchas e vidas</p>
            </div>
          </div>

          {/* BALANCE & CLOSE */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-amber-500/50 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-inner">
              <span className="text-xl">🪙</span>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-amber-200/70">Saldo</span>
                <span className="text-amber-400 font-mono font-black text-base sm:text-lg leading-tight">
                  {stats.totalCoins}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-slate-950/95 border border-cyan-400 text-cyan-300 text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-2xl animate-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1 sm:gap-2 overflow-x-auto">
          {/* CHARACTERS TAB */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('characters');
            }}
            className={`flex-1 py-2.5 px-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'characters'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>PERSONAGENS (7)</span>
          </button>

          {/* BOARDS TAB */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('boards');
            }}
            className={`flex-1 py-2.5 px-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'boards'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>🛹</span>
            <span>PRANCHAS ({stats.hoverboardInventory})</span>
          </button>

          {/* REVIVES TAB */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('revives');
            }}
            className={`flex-1 py-2.5 px-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'revives'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>💖</span>
            <span>RENASCIMENTOS ({stats.reviveTokens})</span>
          </button>

          {/* UPGRADES TAB */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('upgrades');
            }}
            className={`flex-1 py-2.5 px-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'upgrades'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>⚡</span>
            <span>MELHORIAS</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 0: PERSONAGENS (1 MASCULINO + 1 FEMININO + 5 GRÁTIS COM EFEITOS) */}
          {activeTab === 'characters' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-black text-purple-300 text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    TODAS AS 7 SKINS SÃO 100% GRÁTIS!
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Cada personagem possui seu visual 3D exclusivo e um efeito visual dinâmico durante a corrida (spray de tinta nos braços, pés, raios, brasas ou poeira estelar).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CHARACTERS.map((char) => {
                  const isSelected = stats.selectedCharacter === char.id;

                  return (
                    <div
                      key={char.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-800 border-2 border-purple-400 shadow-lg shadow-purple-500/20'
                          : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                              {char.title}
                            </span>
                            <h4 className="font-black text-white text-base mt-0.5">{char.name}</h4>
                          </div>
                          {isSelected ? (
                            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-500/40 flex items-center gap-1">
                              <Check className="w-3 h-3" /> EQUIPADO
                            </span>
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                              GRÁTIS
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 mt-2">{char.desc}</p>

                        {/* UNIQUE EFFECT BADGE */}
                        <div className="mt-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Efeito Especial 3D:
                          </span>
                          <span
                            className="text-xs font-bold block"
                            style={{ color: char.effectColor }}
                          >
                            {char.effectName}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">Gênero:</span>
                          <strong className="text-xs text-white">
                            {char.gender === 'M' ? 'Masculino ♂️' : 'Feminino ♀️'}
                          </strong>
                        </div>

                        <button
                          onClick={() => handleSelectCharacter(char.id)}
                          disabled={isSelected}
                          className={`px-4 py-2 rounded-xl font-black text-xs transition-transform active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'bg-slate-700 text-slate-400 cursor-default'
                              : 'bg-purple-500 hover:bg-purple-400 text-white'
                          }`}
                        >
                          {isSelected ? 'EM USO' : 'SELECIONAR'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 1: PRANCHAS & SKINS */}
          {activeTab === 'boards' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🛹</span>
                  <div>
                    <h4 className="font-black text-cyan-300 text-base">ESTOQUE ATUAL DE PRANCHAS</h4>
                    <p className="text-xs text-slate-400">
                      Pressione <strong>SHIFT</strong> ou toque 2x para proteção contra colisão!
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-400">
                    x{stats.hoverboardInventory}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Disponíveis</span>
                </div>
              </div>

              {/* BUY PRANCHA PACKS */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <span>📦</span> Pacotes de Pranchas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-2xl flex flex-col justify-between hover:border-cyan-500/50 transition-all">
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase">Avulsa</span>
                      <h4 className="text-lg font-black text-white mt-0.5">1 Prancha</h4>
                      <p className="text-xs text-slate-400 mt-1">Uso imediato em qualquer corrida.</p>
                    </div>
                    <button
                      onClick={() => buyHoverboards(1, 150)}
                      className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer text-sm"
                    >
                      <span>🪙 150</span>
                    </button>
                  </div>

                  <div className="bg-gradient-to-b from-cyan-950/30 to-slate-800/80 border-2 border-cyan-500/50 p-4 rounded-2xl flex flex-col justify-between relative shadow-lg">
                    <span className="absolute -top-2.5 right-3 bg-cyan-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      POPULAR
                    </span>
                    <div>
                      <span className="text-xs text-cyan-300 font-bold uppercase">Pacote Street</span>
                      <h4 className="text-lg font-black text-white mt-0.5">5 Pranchas</h4>
                      <p className="text-xs text-slate-400 mt-1">Economia de 150 moedas.</p>
                    </div>
                    <button
                      onClick={() => buyHoverboards(5, 600)}
                      className="mt-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer text-sm"
                    >
                      <span>🪙 600</span>
                      <span className="line-through text-slate-700 text-xs font-normal">750</span>
                    </button>
                  </div>

                  <div className="bg-gradient-to-b from-amber-950/30 to-slate-800/80 border border-amber-500/40 p-4 rounded-2xl flex flex-col justify-between relative shadow-lg">
                    <span className="absolute -top-2.5 right-3 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      MELHOR VALOR
                    </span>
                    <div>
                      <span className="text-xs text-amber-300 font-bold uppercase">Mega Pack</span>
                      <h4 className="text-lg font-black text-white mt-0.5">15 Pranchas</h4>
                      <p className="text-xs text-slate-400 mt-1">Economia massiva de 750 moedas.</p>
                    </div>
                    <button
                      onClick={() => buyHoverboards(15, 1500)}
                      className="mt-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer text-sm"
                    >
                      <span>🪙 1500</span>
                      <span className="line-through text-slate-700 text-xs font-normal">2250</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3D BOARD SKINS */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Modelos de Pranchas 3D
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BOARD_SKINS.map((skin) => {
                    const isUnlocked = stats.unlockedSkins.includes(skin.id);
                    const isEquipped = stats.selectedBoardSkin === skin.id;

                    return (
                      <div
                        key={skin.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isEquipped
                            ? 'bg-slate-800 border-2 border-cyan-400 shadow-md shadow-cyan-500/20'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3.5 h-3.5 rounded-full shadow"
                                style={{ backgroundColor: skin.color }}
                              />
                              <h4 className="font-black text-white text-base">{skin.name}</h4>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{skin.desc}</p>
                          </div>
                          {isEquipped && (
                            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/40">
                              EQUIPADA
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-700/60">
                          <div className="text-xs font-bold text-slate-300">
                            {isUnlocked ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Adquirida
                              </span>
                            ) : (
                              <span className="text-amber-400 font-mono text-sm">
                                🪙 {skin.price}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleSkinAction(skin.id, skin.price)}
                            disabled={isEquipped}
                            className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-transform active:scale-95 cursor-pointer ${
                              isEquipped
                                ? 'bg-slate-700 text-slate-400 cursor-default'
                                : isUnlocked
                                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            }`}
                          >
                            {isEquipped ? 'EM USO' : isUnlocked ? 'EQUIPAR' : 'DESBLOQUEAR'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RENASCIMENTO */}
          {activeTab === 'revives' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-pink-950/40 border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💖</span>
                  <div>
                    <h4 className="font-black text-rose-300 text-base">FICHAS DE RENASCIMENTO (SAVE ME)</h4>
                    <p className="text-xs text-slate-400">
                      Ao bater sem prancha, use uma ficha para continuar a corrida sem gastar moedas!
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-mono font-black text-rose-400">
                    x{stats.reviveTokens}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Fichas em Mão</span>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  Como Funciona o Sistema de Renascimento:
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
                  <li>
                    Quando você colide com um obstáculo sem prancha ativa, uma janela de <strong>5 segundos</strong> é aberta.
                  </li>
                  <li>
                    Se você tiver <strong>Fichas de Renascimento</strong>, você pode reviver <strong>GRÁTIS</strong> sem tocar nas suas moedas!
                  </li>
                  <li>
                    Alternativamente, você pode pagar com as moedas da partida/banco (inicia em 100 e dobra a cada uso).
                  </li>
                  <li>
                    Ao reviver, todos os obstáculos próximos explodem e você ganha <strong>2.5 segundos de escudo invulnerável</strong>.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <span>🛍️</span> Comprar Fichas de Renascimento
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-2xl flex flex-col justify-between hover:border-rose-500/50 transition-all">
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase">Individual</span>
                      <h4 className="text-lg font-black text-white mt-0.5">1 Ficha Save Me</h4>
                      <p className="text-xs text-slate-400 mt-1">Salva 1 corrida fatal.</p>
                    </div>
                    <button
                      onClick={() => buyReviveTokens(1, 200)}
                      className="mt-4 bg-rose-500 hover:bg-rose-400 text-white font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer text-sm"
                    >
                      <span>🪙 200</span>
                    </button>
                  </div>

                  <div className="bg-gradient-to-b from-rose-950/30 to-slate-800/80 border-2 border-rose-500/50 p-4 rounded-2xl flex flex-col justify-between relative shadow-lg">
                    <span className="absolute -top-2.5 right-3 bg-rose-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      ECONOMIZE 100
                    </span>
                    <div>
                      <span className="text-xs text-rose-300 font-bold uppercase">Trio de Vidas</span>
                      <h4 className="text-lg font-black text-white mt-0.5">3 Fichas Save Me</h4>
                      <p className="text-xs text-slate-400 mt-1">Garante 3 segundas chances.</p>
                    </div>
                    <button
                      onClick={() => buyReviveTokens(3, 500)}
                      className="mt-4 bg-rose-400 hover:bg-rose-300 text-slate-950 font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer text-sm"
                    >
                      <span>🪙 500</span>
                      <span className="line-through text-slate-700 text-xs font-normal">600</span>
                    </button>
                  </div>

                  <div className="bg-gradient-to-b from-amber-950/30 to-slate-800/80 border border-amber-500/40 p-4 rounded-2xl flex flex-col justify-between relative shadow-lg">
                    <span className="absolute -top-2.5 right-3 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      MEGA SALVADOR
                    </span>
                    <div>
                      <span className="text-xs text-amber-300 font-bold uppercase">Pacote Campeão</span>
                      <h4 className="text-lg font-black text-white mt-0.5">8 Fichas Save Me</h4>
                      <p className="text-xs text-slate-400 mt-1">Ideal para bater recordes lendários.</p>
                    </div>
                    <button
                      onClick={() => buyReviveTokens(8, 1200)}
                      className="mt-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer text-sm"
                    >
                      <span>🪙 1200</span>
                      <span className="line-through text-slate-700 text-xs font-normal">1600</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MELHORIAS */}
          {activeTab === 'upgrades' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border-2 border-amber-500/50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h4 className="font-black text-amber-300 text-base">
                      MULTIPLICADOR DE CORRIDA BASE (x{stats.baseMultiplier})
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Multiplica a velocidade com que seu score sobe na corrida. (Ex: x30 ➔ x32 ➔ x34)
                  </p>
                </div>
                <button
                  onClick={upgradeBaseMultiplier}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2 px-4 rounded-xl transition-transform active:scale-95 cursor-pointer text-sm flex items-center gap-1.5"
                >
                  <span>UPGRADE (+2)</span>
                  <span className="font-mono text-xs">🪙 {(stats.baseMultiplier - 28) * 400}</span>
                </button>
              </div>

              <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🧲</span>
                    <div>
                      <h4 className="font-black text-white text-base">Duração do Ímã de Moedas</h4>
                      <p className="text-xs text-slate-400">
                        Nível {stats.powerupLevels.magnet}/5 ({10 + stats.powerupLevels.magnet * 2}s)
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => upgradePower('magnet')}
                  disabled={stats.powerupLevels.magnet >= 5}
                  className={`py-2 px-4 rounded-xl font-black text-xs transition-transform active:scale-95 ${
                    stats.powerupLevels.magnet >= 5
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-rose-500 hover:bg-rose-400 text-white cursor-pointer'
                  }`}
                >
                  {stats.powerupLevels.magnet >= 5 ? 'MAX' : `UPGRADE 🪙 ${stats.powerupLevels.magnet * 350}`}
                </button>
              </div>

              <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <h4 className="font-black text-white text-base">Duração do Multiplicador 2X</h4>
                      <p className="text-xs text-slate-400">
                        Nível {stats.powerupLevels.multiplier}/5 ({10 + stats.powerupLevels.multiplier * 2}s)
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => upgradePower('multiplier')}
                  disabled={stats.powerupLevels.multiplier >= 5}
                  className={`py-2 px-4 rounded-xl font-black text-xs transition-transform active:scale-95 ${
                    stats.powerupLevels.multiplier >= 5
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                  }`}
                >
                  {stats.powerupLevels.multiplier >= 5 ? 'MAX' : `UPGRADE 🪙 ${stats.powerupLevels.multiplier * 350}`}
                </button>
              </div>

              <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👟</span>
                    <div>
                      <h4 className="font-black text-white text-base">Duração do Super Tênis</h4>
                      <p className="text-xs text-slate-400">
                        Nível {stats.powerupLevels.sneakers}/5 ({10 + stats.powerupLevels.sneakers * 2}s)
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => upgradePower('sneakers')}
                  disabled={stats.powerupLevels.sneakers >= 5}
                  className={`py-2 px-4 rounded-xl font-black text-xs transition-transform active:scale-95 ${
                    stats.powerupLevels.sneakers >= 5
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-400 text-white cursor-pointer'
                  }`}
                >
                  {stats.powerupLevels.sneakers >= 5 ? 'MAX' : `UPGRADE 🪙 ${stats.powerupLevels.sneakers * 350}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
