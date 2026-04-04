"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Graph from './components/Graph';
import Formulas from './components/Formulas';
import { parseEquation, ParsedEquation } from './utils/parser';

const COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];

const DEFAULT_EQUATIONS = [
  {
    id: '1',
    text: 'y = sin(x)',
    color: COLORS[0],
    visible: true,
    ...parseEquation('y = sin(x)')
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'graph' | 'formulas'>('graph');
  const [equations, setEquations] = useState<ParsedEquation[]>(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const decoded = decodeURIComponent(hash);
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((eq: any, i: number) => ({
            id: eq.id || String(Date.now() + i),
            text: eq.text || '',
            color: eq.color || COLORS[i % COLORS.length],
            visible: eq.visible !== false,
            ...parseEquation(eq.text || '')
          }));
        }
      }
    } catch (e) {
      console.error("Failed to parse equations from URL", e);
    }
    return DEFAULT_EQUATIONS;
  });

  const [variableValues, setVariableValues] = useState<Record<string, number>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToast({ message, id });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3000);
  }, []);

  // Sync to URL
  useEffect(() => {
    const toSave = equations.map(eq => ({
      id: eq.id,
      text: eq.text,
      color: eq.color,
      visible: eq.visible
    }));
    window.history.replaceState(null, '', '#' + encodeURIComponent(JSON.stringify(toSave)));
  }, [equations]);

  // Extract all unique variables
  const allVariables = Array.from(new Set<string>(equations.flatMap(eq => eq.variables || [])));

  const handleAddVariable = (name: string) => {
    setVariableValues(prev => ({ ...prev, [name]: 1 }));
  };

  const handleAddEquation = (initialText: string = '') => {
    const id = Date.now().toString();
    const color = COLORS[equations.length % COLORS.length];
    const parsed = initialText ? parseEquation(initialText) : { variables: [] };
    setEquations([...equations, { id, text: initialText, color, visible: true, ...parsed }]);
  };

  const handleUpdateEquation = (id: string, text: string) => {
    setEquations(prev => prev.map(eq => {
      if (eq.id === id) {
        const parsed = parseEquation(text);
        return { ...eq, text, ...parsed };
      }
      return eq;
    }));
  };

  const handleRemoveEquation = (id: string) => {
    setEquations(prev => prev.filter(eq => eq.id !== id));
  };

  const handleToggleVisibility = (id: string) => {
    setEquations(prev => prev.map(eq => eq.id === id ? { ...eq, visible: !eq.visible } : eq));
  };

  const handleUpdateVariable = (name: string, value: number) => {
    setVariableValues(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={`relative h-screen w-full overflow-hidden font-sans ${isDarkMode ? 'dark bg-[#1a1a1a]' : 'bg-[#fdfcf8]'}`}>
      
      {/* Dynamic Island Navbar */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 rounded-full shadow-2xl backdrop-blur-xl border ${
          isDarkMode ? 'bg-[#222222]/85 border-[#444444]' : 'bg-[#f4f1ea]/85 border-[#e6e2d6]'
        }`}
      >
        <button 
          onClick={() => setActiveTab('graph')} 
          className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
            activeTab === 'graph' 
              ? (isDarkMode ? 'bg-white text-black shadow-sm' : 'bg-stone-800 text-white shadow-sm') 
              : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-stone-500 hover:text-stone-800')
          }`}
        >
          Graph
        </button>
        <button 
          onClick={() => setActiveTab('formulas')} 
          className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
            activeTab === 'formulas' 
              ? (isDarkMode ? 'bg-white text-black shadow-sm' : 'bg-stone-800 text-white shadow-sm') 
              : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-stone-500 hover:text-stone-800')
          }`}
        >
          Formulas
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'graph' ? (
          <motion.div 
            key="graph-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0">
              <Graph equations={equations} variables={variableValues} isDarkMode={isDarkMode} showToast={showToast} />
            </div>

            <AnimatePresence>
              {!isSidebarOpen && (
                <motion.button
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  onClick={() => setIsSidebarOpen(true)}
                  className={`absolute top-4 left-4 z-20 p-3 rounded-xl shadow-xl backdrop-blur-md border transition-all hover:scale-105 active:scale-95 ${
                    isDarkMode 
                      ? 'bg-[#222222]/85 border-[#444444] text-gray-200 hover:bg-[#333333]' 
                      : 'bg-[#f4f1ea]/85 border-[#e6e2d6] text-stone-800 hover:bg-[#e6e2d6]'
                  }`}
                  title="Open Sidebar"
                >
                  <Menu size={20} />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isSidebarOpen && (
                <Sidebar
                  equations={equations}
                  variables={allVariables}
                  variableValues={variableValues}
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                  onAddEquation={handleAddEquation}
                  onUpdateEquation={handleUpdateEquation}
                  onRemoveEquation={handleRemoveEquation}
                  onToggleVisibility={handleToggleVisibility}
                  onUpdateVariable={handleUpdateVariable}
                  onAddVariable={handleAddVariable}
                  onClose={() => setIsSidebarOpen(false)}
                  showToast={showToast}
                />
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="formulas-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Formulas isDarkMode={isDarkMode} showToast={showToast} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-50 px-6 py-3 rounded-full shadow-2xl text-sm font-medium backdrop-blur-md ${
              isDarkMode 
                ? 'bg-[#333333]/90 text-white border border-[#444444]' 
                : 'bg-white/90 text-stone-800 border border-[#e6e2d6]'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
