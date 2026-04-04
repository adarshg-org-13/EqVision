"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ParsedEquation } from '../utils/parser';
import { Trash2, Eye, EyeOff, Plus, Share2, Check, Moon, Sun, PanelLeftClose, ChevronDown } from 'lucide-react';

interface SidebarProps {
  equations: ParsedEquation[];
  variables: string[];
  variableValues: Record<string, number>;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onAddEquation: (initialText?: string) => void;
  onUpdateEquation: (id: string, text: string) => void;
  onRemoveEquation: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onUpdateVariable: (name: string, value: number) => void;
  onAddVariable: (name: string) => void;
  showToast: (message: string) => void;
  onClose: () => void;
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
  showToast,
  onClose
}: SidebarProps) {
  const [copied, setCopied] = useState(false);
  const [focusedEq, setFocusedEq] = useState<string | null>(null);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  const TEMPLATES = [
    { label: 'Linear', value: 'y = m*x + b' },
    { label: 'Quadratic', value: 'y = a*x^2 + b*x + c' },
    { label: 'Cubic', value: 'y = a*x^3 + b*x^2 + c*x + d' },
    { label: 'Trigonometric', value: 'y = a*sin(b*x + c) + d' },
    { label: 'Exponential', value: 'y = a*e^(b*x)' },
    { label: 'Logarithmic', value: 'y = log(x)' },
  ];

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
    <motion.div 
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className={`absolute top-4 left-4 bottom-4 w-80 flex flex-col rounded-2xl shadow-2xl z-10 transition-colors backdrop-blur-xl ${isDarkMode ? 'bg-[#222222]/85 border border-[#444444]' : 'bg-[#f4f1ea]/85 border border-[#e6e2d6]'}`}
    >
      <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-[#444444]' : 'border-[#e6e2d6]'}`}>
        <div className="flex items-start gap-3">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`mt-1 p-1 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#333333]' : 'text-stone-500 hover:text-stone-900 hover:bg-[#e6e2d6]'}`}
            title="Close Sidebar"
          >
            <PanelLeftClose size={18} />
          </motion.button>
          <div>
            <h1 className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-gray-100' : 'text-stone-800'}`}>EqVision</h1>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-stone-500'}`}>Equation Visualizer</p>
          </div>
        </div>
        <div className="flex gap-1">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleDarkMode}
            className={`p-2 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#333333]' : 'text-stone-500 hover:text-stone-900 hover:bg-[#e6e2d6]'}`}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className={`p-2 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#333333]' : 'text-stone-500 hover:text-stone-900 hover:bg-[#e6e2d6]'}`}
            title="Share Graph"
          >
            {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Equations Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-stone-600'}`}>Equations</h2>
            <div className="flex items-center gap-2 relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                className={`flex items-center gap-1 text-xs rounded-md px-2 py-1.5 outline-none cursor-pointer transition-colors ${isDarkMode ? 'bg-[#333333] text-gray-300 border border-[#444444] hover:bg-[#444444]' : 'bg-[#e6e2d6] text-stone-700 border border-[#d4cebd] hover:bg-[#d4cebd]'}`}
                title="Add from template"
              >
                + Template <ChevronDown size={12} className={`transition-transform ${isTemplateMenuOpen ? 'rotate-180' : ''}`} />
              </motion.button>
              
              <AnimatePresence>
                {isTemplateMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsTemplateMenuOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-8 top-full mt-1 w-40 py-1 rounded-xl shadow-xl border z-50 overflow-hidden ${isDarkMode ? 'bg-[#2a2a2a] border-[#444444]' : 'bg-[#fdfcf8] border-[#e6e2d6]'}`}
                    >
                      {TEMPLATES.map(t => (
                        <button
                          key={t.label}
                          onClick={() => {
                            onAddEquation(t.value);
                            setIsTemplateMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-[#3a3a3a] hover:text-white' : 'text-stone-700 hover:bg-[#e6e2d6] hover:text-stone-900'}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onAddEquation()}
                className={`p-1 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#333333]' : 'text-stone-500 hover:text-stone-800 hover:bg-[#e6e2d6]'}`}
                title="Add Blank Equation"
              >
                <Plus size={16} />
              </motion.button>
            </div>
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
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onToggleVisibility(eq.id)}
                    className={`p-1 rounded transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    {eq.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onRemoveEquation(eq.id)}
                    className="p-1 text-red-400 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </motion.button>
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
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        key={v}
                        onClick={() => onAddVariable(v)}
                        className={`px-2 py-0.5 rounded-md font-mono transition-colors ${
                          isDarkMode 
                            ? 'bg-[#333333] hover:bg-[#444444] text-blue-400' 
                            : 'bg-[#e6e2d6] hover:bg-[#d4cebd] text-blue-600'
                        }`}
                      >
                        {v}
                      </motion.button>
                    ))}
                    {eq.variables.filter(v => !(v in variableValues)).length > 1 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          eq.variables.filter(v => !(v in variableValues)).forEach(v => onAddVariable(v));
                        }}
                        className={`px-2 py-0.5 rounded-md transition-colors ${
                          isDarkMode 
                            ? 'bg-[#333333] hover:bg-[#444444] text-gray-300' 
                            : 'bg-[#e6e2d6] hover:bg-[#d4cebd] text-stone-700'
                        }`}
                      >
                        all
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Math Keypad */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {MATH_KEYS.map(key => (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={key}
                onClick={() => handleInsertMath(key)}
                className={`p-1.5 text-xs font-mono rounded-lg shadow-sm transition-colors ${isDarkMode ? 'bg-[#333333] hover:bg-[#444444] text-gray-200 border border-[#444444]' : 'bg-white hover:bg-gray-50 text-stone-700 border border-[#e6e2d6]'}`}
              >
                {key}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Variables Section */}
        {variables.filter(v => v in variableValues).length > 0 && (
          <div className={`space-y-3 pt-4 border-t ${isDarkMode ? 'border-[#444444]' : 'border-[#e6e2d6]'}`}>
            <h2 className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-stone-600'}`}>Variables</h2>
            <div className="space-y-4">
              {variables.filter(v => v in variableValues).map(v => (
                <div key={v} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className={`font-mono font-medium ${isDarkMode ? 'text-gray-300' : 'text-stone-700'}`}>{v}</span>
                    <span className={`font-mono ${isDarkMode ? 'text-gray-500' : 'text-stone-500'}`}>{variableValues[v]?.toFixed(2) || 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={variableValues[v] || 0}
                    onChange={(e) => onUpdateVariable(v, parseFloat(e.target.value))}
                    className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-[#444444] accent-gray-300' : 'bg-[#d4cebd] accent-stone-700'}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`p-4 border-t text-xs text-center ${isDarkMode ? 'border-[#444444] text-gray-500' : 'border-[#e6e2d6] text-stone-400'}`}>
        Eq Vision
      </div>
    </motion.div>
  );
}
