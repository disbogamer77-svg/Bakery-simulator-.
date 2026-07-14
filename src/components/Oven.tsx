import React from 'react';
import { BakingItem } from './BakingItems';

interface OvenProps {
  temperature: number; // Target temperature set by user (100 - 500)
  isBaking: boolean;
  bakeProgress: number; // 0 - 100
  itemType: 'bread' | 'pizza' | 'croissant' | 'cake' | 'cookie' | 'pie' | 'dough' | 'hamburger';
  showSteam: boolean;
  addedIngredients?: string[];
}

export const Oven: React.FC<OvenProps> = ({
  temperature,
  isBaking,
  bakeProgress,
  itemType,
  showSteam,
  addedIngredients = [],
}) => {
  // Let's map oven heat level to color intensity of the heat coil
  const getCoilColor = () => {
    if (!isBaking) return '#374151'; // cool gray
    const ratio = (temperature - 100) / 400; // 0 to 1
    if (ratio < 0.3) return '#f97316'; // orange
    if (ratio < 0.7) return '#ef4444'; // strong red
    return '#f43f5e'; // glowing hot pink
  };

  return (
    <div className="relative w-full max-w-[480px] aspect-[4/3] rounded-3xl bg-gradient-to-b from-slate-800 to-slate-950 p-6 border-4 border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.2)] flex flex-col justify-between overflow-hidden">
      
      {/* 1. Metal brushed texture overlays */}
      <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      {/* 2. Top Control Panel of the Oven */}
      <div className="w-full flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-2 z-10 relative">
        {/* Left: Brand / Logo */}
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 font-mono">MAGIC OVEN V2</span>
          <div className="flex gap-1.5 mt-1">
            {/* Status indicator lights */}
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isBaking ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isBaking ? 'bg-amber-400' : 'bg-slate-600'}`} />
          </div>
        </div>

        {/* Center: Beautiful dynamic Digital Timer / Temp Gauge */}
        <div className="bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800/80 shadow-inner flex items-center gap-3 font-mono">
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-slate-500 font-bold uppercase">TEMP</span>
            <span className={`text-sm font-bold transition-all duration-300 ${isBaking ? 'text-orange-400 font-extrabold' : 'text-slate-400'}`}>
              {temperature}°C
            </span>
          </div>
          <div className="w-[1px] h-6 bg-slate-800" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-slate-500 font-bold uppercase">STAGE</span>
            <span className="text-xs font-bold text-cyan-400">
              {isBaking ? `${bakeProgress}%` : 'READY'}
            </span>
          </div>
        </div>

        {/* Right: Premium rotary dial visual */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col text-right">
            <span className="text-[8px] text-slate-500 font-bold">COOK MODE</span>
            <span className="text-[10px] text-slate-300 font-bold">AUTOMATIC</span>
          </div>
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-b from-slate-600 to-slate-800 border border-slate-950 shadow-md flex items-center justify-center">
            {/* Dial Tick indicator rotating with temperature */}
            <div 
              className="absolute w-1 h-3.5 bg-cyan-400 top-0.5 rounded-full origin-bottom transition-transform duration-500"
              style={{ transform: `rotate(${(temperature - 100) * 0.6}deg)` }}
            />
            <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 shadow-inner" />
          </div>
        </div>
      </div>

      {/* 3. The Baking Chamber (The Glass Window) */}
      <div className="relative flex-1 w-full bg-slate-950 rounded-2xl border-4 border-slate-900/95 overflow-hidden shadow-inner flex items-center justify-center">
        
        {/* Dynamic Incandescent chamber bulb light */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000 pointer-events-none mix-blend-screen"
          style={{
            background: isBaking
              ? `radial-gradient(circle, rgba(251,146,60,0.45) 0%, rgba(244,63,94,0.1) 70%, transparent 100%)`
              : 'radial-gradient(circle, rgba(148,163,184,0.1) 0%, transparent 80%)'
          }}
        />

        {/* Heat Coils glowing at the top */}
        <div className="absolute top-2 inset-x-4 h-1.5 flex justify-around px-4 pointer-events-none z-10">
          <div 
            className="w-[90%] h-1 rounded-full transition-all duration-1000 shadow-[0_0_15px_currentcolor]"
            style={{ 
              backgroundColor: getCoilColor(),
              boxShadow: isBaking ? `0 4px 12px ${getCoilColor()}` : 'none'
            }}
          />
        </div>

        {/* Internal metal rack lines */}
        <div className="absolute inset-x-3 top-1/2 h-[2px] bg-slate-800/80 border-b border-slate-900 pointer-events-none" />
        <div className="absolute inset-x-12 top-[60%] h-[1px] bg-slate-700/40 pointer-events-none" />

        {/* Interactive Steam clouds */}
        {isBaking && showSteam && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-70">
            {/* Left steam puff */}
            <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
            {/* Right steam puff */}
            <div className="absolute bottom-1/3 right-1/4 w-14 h-14 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDuration: '4s' }} />
          </div>
        )}

        {/* The Food Model Inside */}
        <div className="relative z-10 w-[72%] aspect-[3/2] flex items-center justify-center">
          <BakingItem
            type={itemType}
            bakeProgress={bakeProgress}
            isBaking={isBaking}
            addedIngredients={addedIngredients}
            className="w-full h-full transform scale-110"
          />
        </div>

        {/* Tempered Glass Reflection Overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-20" />
      </div>

      {/* 4. Bottom Heavy Handle Bar */}
      <div className="w-full mt-3 h-6 flex items-center justify-center z-10 relative">
        <div className="w-4/5 h-3 bg-gradient-to-b from-slate-600 to-slate-800 rounded-full border border-slate-950 shadow-[0_4px_6px_rgba(0,0,0,0.5)] flex items-center justify-between px-3">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        </div>
      </div>
    </div>
  );
};
