import React, { useState } from 'react';
import { ParsedEquation } from '../utils/parser';
import { Trash2, Eye, EyeOff, Plus, Share2, Check, Moon, Sun } from 'lucide-react';

interface SidebarProps {
  equations: ParsedEquation[];
  variables: string[];
  variableValues: Record<string, number>;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onAddEquation: () => void;
  onUpdateEquation: (id: string, text: string) => void;
  onRemoveEquation: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onUpdateVariable: (name: string, value: number) => void;
  onAddVariable: (name: string) => void;
  showToast: (message: string) => void;
}

export default function Sidebar({
  equations,
  variables,
  variableValues,
  isDarkMode,
  onToggleDarkMode,
  onAddEquation,
  onUpdateEquation,
  onRemoveEquation,
  onToggleVisibility,
  onUpdateVariable,
  onAddVariable,
  showToast
}: SidebarProps) {
  const [copied, setCopied] = useState(false);
  const [focusedEq, setFocusedEq] = useState<string | null>(null);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const MATH_KEYS = ['sin', 'cos', 'tan', 'log', '√', '^', 'π', 'e'];

  const handleInsertMath = (key: string) => {
    const targetId = focusedEq || equations[equations.length - 1]?.id;
    if (!targetId) return;
    
    const eq = equations.find(e => e.id === targetId);
    if (!eq) return;

    let insertText = key;
    if (['sin', 'cos', 'tan', 'log'].includes(key)) insertText = `${key}(x)`;
    if (key === '√') insertText = 'sqrt(x)';
    if (key === 'π') insertText = 'pi';
    if (key === '^') insertText = '^2';
    
    const newText = eq.text + (eq.text && !eq.text.endsWith(' ') ? ' ' : '') + insertText;
    onUpdateEquation(targetId, newText);
  };

  return (
    <div className={`absolute top-4 left-4 bottom-4 w-80 flex flex-col rounded-2xl shadow-2xl z-10 transition-colors backdrop-blur-xl ${isDarkMode ? 'bg-[#222222]/85 border border-[#444444]' : 'bg-[#f4f1ea]/85 border border-[#e6e2d6]'}`}>
      <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-[#444444]' : 'border-[#e6e2d6]'}`}>
        <div>
          <h1 className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-gray-100' : 'text-stone-800'}`}>EqVision</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-stone-500'}`}>Minimalist Equation Visualizer</p>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={onToggleDarkMode}
            className={`p-2 rounded-md transition-all duration-200 ease-out active:scale-90 hover:scale-105 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#333333]' : 'text-stone-500 hover:text-stone-900 hover:bg-[#e6e2d6]'}`}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={handleShare}
            className={`p-2 rounded-md transition-all duration-200 ease-out active:scale-90 hover:scale-105 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#333333]' : 'text-stone-500 hover:text-stone-900 hover:bg-[#e6e2d6]'}`}
            title="Share Graph"
          >
            {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Equations Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-stone-600'}`}>Equations</h2>
            <button 
              onClick={onAddEquation}
              className={`p-1 rounded-md transition-all duration-200 ease-out active:scale-90 hover:scale-110 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#333333]' : 'text-stone-500 hover:text-stone-800 hover:bg-[#e6e2d6]'}`}
              title="Add Equation"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {equations.map((eq, index) => (
              <div key={eq.id} className={`group relative flex flex-col rounded-xl border p-2 transition-all ${isDarkMode ? 'bg-[#1a1a1a]/60 border-[#444444] hover:border-[#666666]' : 'bg-[#fdfcf8]/60 border-[#e6e2d6] hover:border-[#d4cebd]'}`}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: eq.color, opacity: eq.visible ? 1 : 0.3 }}
                  />
                  <input
                    type="text"
                    value={eq.text}
                    onChange={(e) => onUpdateEquation(eq.id, e.target.value)}
                    onFocus={() => setFocusedEq(eq.id)}
                    placeholder="e.g. y = sin(x)"
                    className={`flex-1 bg-transparent border-none outline-none text-sm font-mono ${isDarkMode ? 'text-gray-200 placeholder-gray-600' : 'text-stone-800 placeholder-stone-400'}`}
                    spellCheck={false}
                  />
                  <button
                    onClick={() => onToggleVisibility(eq.id)}
                    className={`p-1 rounded transition-all duration-200 ease-out active:scale-90 hover:scale-110 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    {eq.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => onRemoveEquation(eq.id)}
                    className="p-1 text-red-400 hover:text-red-500 rounded transition-all duration-200 ease-out active:scale-90 hover:scale-110 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {eq.error && eq.text.trim() !== '' && (
                  <div className="mt-1 text-xs text-red-500 ml-5">
                    {eq.error}
                  </div>
                )}
                {eq.variables.filter(v => !(v in variableValues)).length > 0 && (
                  <div className="mt-2 ml-5 flex flex-wrap items-center gap-2 text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-stone-500'}>Add slider:</span>
                    {eq.variables.filter(v => !(v in variableValues)).map(v => (
                      <button
                        key={v}
                        onClick={() => onAddVariable(v)}
                        className={`px-2 py-0.5 rounded-md font-mono transition-all duration-200 ease-out active:scale-95 hover:scale-105 ${
                          isDarkMode 
                            ? 'bg-[#333333] hover:bg-[#444444] text-blue-400' 
                            : 'bg-[#e6e2d6] hover:bg-[#d4cebd] text-blue-600'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                    {eq.variables.filter(v => !(v in variableValues)).length > 1 && (
                      <button
                        onClick={() => {
                          eq.variables.filter(v => !(v in variableValues)).forEach(v => onAddVariable(v));
                        }}
                        className={`px-2 py-0.5 rounded-md transition-all duration-200 ease-out active:scale-95 hover:scale-105 ${
                          isDarkMode 
                            ? 'bg-[#333333] hover:bg-[#444444] text-gray-300' 
                            : 'bg-[#e6e2d6] hover:bg-[#d4cebd] text-stone-700'
                        }`}
                      >
                        all
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Math keypad */}
          <div className='grid grid-cols-4 gap-2 pt-2'>
            {MATH_KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => handleInsertMath(key)}
                  className={`p-1.5 text-xs font-mono rounded-lg shadow-sm acitve:scale-95 hover:scale-105 transition-all duration-200 ease-out ${isDarkMode ? 'bg-[#333333] hover:bg-[#444444] text-gray-200 border border-[#444444]' : 'bg-white hover:bg-gray-50 text-stone-700 border border-[#e6e2d6]'}`}
                >
                    {key}
                </button>
            ))}
          </div>
        </div>

        {/* Variables Section */}
        {variables.filter(v => v in variableValues)}