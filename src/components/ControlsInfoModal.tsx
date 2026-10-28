/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Keyboard, Smartphone, Cpu, ShieldCheck } from 'lucide-react';
import { sound } from '../sound';

interface ControlsInfoModalProps {
  onClose: () => void;
}

export const ControlsInfoModal: React.FC<ControlsInfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl text-white relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">CONTROLES & GUIA DO JOGO</h3>
              <p className="text-xs text-slate-400">Suporte a Teclado Magnético 8000Hz & Mobile</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="space-y-4 py-4 text-xs sm:text-sm text-slate-300">
          {/* KEYBOARD CONTROLS */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl space-y-2">
            <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 uppercase text-xs">
              <Keyboard className="w-4 h-4" /> Teclado no PC / Desktop
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">
                  A / ←
                </strong>
                <span>Mudar para a pista esquerda</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">
                  D / →
                </strong>
                <span>Mudar para a pista direita</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">
                  W / Espaço
                </strong>
                <span>Pular trens e barreiras</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">
                  S / ↓
                </strong>
                <span>Rolar / Agachar / Queda rápida</span>
              </div>
              <div className="col-span-2 bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/40 flex items-center justify-between">
                <div>
                  <strong className="text-cyan-300 font-mono bg-slate-800 px-2 py-0.5 rounded mr-2">
                    SHIFT
                  </strong>
                  <span className="font-bold text-white">Ativar Prancha Hoverboard</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold">Anti-Morte 🛡️</span>
              </div>
            </div>
          </div>

          {/* TOUCH / MOBILE CONTROLS */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl space-y-2">
            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase text-xs">
              <Smartphone className="w-4 h-4" /> Gestos no Celular / Touch
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-white">Deslizar Esquerda/Direita</span>: Troca de pista
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-white">Deslizar para Cima</span>: Pular
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-white">Deslizar para Baixo</span>: Rolar / Descer
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-white">Toque Duplo (2x Tap)</span>: Ativar Prancha
              </div>
            </div>
          </div>

          {/* 8000HZ INFO */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl space-y-1.5">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-xs">
              <Cpu className="w-4 h-4" /> Teclados Magnéticos (8000Hz / Rapid Trigger)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              O pipeline de entrada deste jogo utiliza listener em fase de captura de hardware sem atraso de repetição do sistema operacional. Ele responde à atuação física imediata do seu switch magnético com transição de pista interpolada a taxa ultrarrápida.
            </p>
          </div>

          {/* HOVERBOARD & REVIVE */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl space-y-1.5">
            <h4 className="font-bold text-rose-400 flex items-center gap-1.5 uppercase text-xs">
              <ShieldCheck className="w-4 h-4" /> Prancha & Sistema Save Me
            </h4>
            <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
              <li>
                <strong>Prancha (Hoverboard)</strong>: Protege você de 1 impacto mortal. A prancha quebra, destrói o obstáculo e concede 2s de escudo!
              </li>
              <li>
                <strong>Renascimento (Save Me)</strong>: Quando você bate sem prancha, pode gastar uma Ficha de Renascimento ou moedas para continuar de onde parou.
              </li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl transition-transform active:scale-95 cursor-pointer text-sm"
        >
          ENTENDI, VAMOS CORRER!
        </button>
      </div>
    </div>
  );
};
