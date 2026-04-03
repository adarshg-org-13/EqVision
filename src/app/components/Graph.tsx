import React, { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ParsedEquation } from '../utils/parser';

interface GraphProps {
  equations: ParsedEquation[];
  variables: Record<string, number>;
  isDarkMode: boolean;
  showToast: (message: string) => void;
}

export default function Graph({ equations, variables, isDarkMode, showToast }: GraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [view, setView] = useState({ x: 0, y: 0, scale: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFileName, setExportFileName] = useState('eqvision-graph');

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    draw();
  }, [equations, variables, view, isDarkMode]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Fill background
    ctx.fillStyle = isDarkMode ? '#1a1a1a' : '#fdfcf8';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = isDarkMode ? '#333333' : '#e6e2d6';
    ctx.lineWidth = 1;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = isDarkMode ? '#777777' : '#a8a29e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const { x: centerX, y: centerY, scale } = view;

    // Calculate visible range
    const startX = centerX - (width / 2) / scale;
    const endX = centerX + (width / 2) / scale;
    const startY = centerY - (height / 2) / scale;
    const endY = centerY + (height / 2) / scale;

    // Determine grid step
    let step = 1;
    if (scale < 10) step = 10;
    if (scale < 2) step = 50;
    if (scale > 100) step = 0.5;
    if (scale > 200) step = 0.1;

    ctx.beginPath();
    // Vertical lines
    for (let x = Math.floor(startX / step) * step; x <= endX; x += step) {
      const canvasX = (x - centerX) * scale + width / 2;
      ctx.moveTo(canvasX, 0);
      ctx.lineTo(canvasX, height);
      
      // Draw number
      if (Math.abs(x) > 0.001) {
        const textY = Math.max(0, Math.min(height - 15, height / 2 + centerY * scale + 5));
        ctx.fillText(Number(x.toFixed(2)).toString(), canvasX, textY); // Fixed: was X.toFixed
      }
    }
    // Horizontal lines
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.floor(startY / step) * step; y <= endY; y += step) {
      const canvasY = height / 2 - (y - centerY) * scale;
      ctx.moveTo(0, canvasY);
      ctx.lineTo(width, canvasY);
      
      // Draw number
      if (Math.abs(y) > 0.001) {
        const textX = Math.max(20, Math.min(width - 5, -centerX * scale + width / 2 - 5));
        ctx.fillText(Number(y.toFixed(2)).toString(), textX, canvasY);
      }
    }
    ctx.stroke();

    // Draw axes
    ctx.strokeStyle = isDarkMode ? '#555555' : '#a8a29e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Y-axis
    const originX = -centerX * scale + width / 2;
    if (originX >= 0 && originX <= width) {
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, height);
    }
    
    // X-axis
    const originY = height / 2 + centerY * scale;
    if (originY >= 0 && originY <= height) {
      ctx.moveTo(0, originY);
      ctx.lineTo(width, originY);
    }
    ctx.stroke();

    // Draw equations
    equations.forEach(eq => {
      if (!eq.visible || !eq.compiled || eq.error) return;

      ctx.strokeStyle = eq.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      let isFirst = true;
      const pixelStep = 1; // 1 pixel per step for smooth curves

      if (eq.isXFunction) {
        // Plot x = f(y)
        let prevPx: number | null = null;
        let prevPy: number | null = null;
        let prevMathX: number | null = null;
        let prevMathY: number | null = null;

        for (let py = 0; py <= height; py += pixelStep) {
          const mathY = centerY - (py - height / 2) / scale;
          
          try {
            const mathX = eq.compiled.evaluate({ y: mathY, ...variables });
            
            if (typeof mathX !== 'number' || isNaN(mathX) || !isFinite(mathX)) {
              isFirst = true;
              prevPx = null;
              continue;
            }

            const px = (mathX - centerX) * scale + width / 2;

            // Handle horizontal asymptotes
            if (!isFirst && prevPx !== null && prevMathX !== null && prevMathY !== null) {
              if (Math.abs(px - prevPx) > 20) {
                const midY = (prevMathY + mathY) / 2;
                const midX = eq.compiled.evaluate({ y: midY, ...variables });
                const minMathX = Math.min(prevMathX, mathX);
                const maxMathX = Math.max(prevMathX, mathX);
                const isContinuous = midX >= minMathX - 0.001 && midX <= maxMathX + 0.001;
                
                if (!isContinuous || isNaN(midX) || !isFinite(midX)) {
                  isFirst = true;
                }
              }
            }

            if (isFirst) {
              ctx.moveTo(px, py);
              isFirst = false;
            } else {
              ctx.lineTo(px, py);
            }
            
            prevPx = px;
            prevPy = py;
            prevMathX = mathX;
            prevMathY = mathY;
          } catch (e) {
            isFirst = true;
            prevPx = null;
          }
        }
      } else {
        // Plot y = f(x)
        let prevPx: number | null = null;
        let prevPy: number | null = null;
        let prevMathX: number | null = null;
        let prevMathY: number | null = null;

        for (let px = 0; px <= width; px += pixelStep) {
          const mathX = (px - width / 2) / scale + centerX;
          
          try {
            const mathY = eq.compiled.evaluate({ x: mathX, ...variables });
            
            if (typeof mathY !== 'number' || isNaN(mathY) || !isFinite(mathY)) {
              isFirst = true;
              prevPy = null;
              continue;
            }

            const py = height / 2 - (mathY - centerY) * scale;

            // Handle vertical asymptotes (e.g., tan(x))
            if (!isFirst && prevPy !== null && prevMathX !== null && prevMathY !== null) {
              if (Math.abs(py - prevPy) > 20) {
                const midX = (prevMathX + mathX) / 2;
                const midY = eq.compiled.evaluate({ x: midX, ...variables });
                const minMathY = Math.min(prevMathY, mathY);
                const maxMathY = Math.max(prevMathY, mathY);
                const isContinuous = midY >= minMathY - 0.001 && midY <= maxMathY + 0.001;
                
                if (!isContinuous || isNaN(midY) || !isFinite(midY)) {
                  isFirst = true;
                }
              }
            }

            if (isFirst) {
              ctx.moveTo(px, py);
              isFirst = false;
            } else {
              ctx.lineTo(px, py);
            }
            
            prevPx = px;
            prevPy = py;
            prevMathX = mathX;
            prevMathY = mathY;
          } catch (e) {
            isFirst = true;
            prevPy = null;
          }
        }
      }
      ctx.stroke();
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    
    setView(prev => ({
      ...prev,
      x: prev.x - dx / prev.scale,
      y: prev.y + dy / prev.scale
    }));
    
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    
    setView(prev => {
      let newScale = prev.scale * Math.pow(zoomFactor, direction);
      newScale = Math.max(1, Math.min(newScale, 1000)); // Clamp scale
      return { ...prev, scale: newScale };
    });
  };

  const handleExportClick = () => {
    setExportFileName('eqvision-graph');
    setShowExportModal(true);
  };

  const confirmExport = (e: React.FormEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    showToast(`Downloading ${exportFileName}.png...`);
    
    const link = document.createElement('a');
    link.download = `${exportFileName}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportModal(false);
  };

  return (
    <div className="relative w-full h-full">
      <div 
        ref={containerRef} 
        className={`w-full h-full cursor-grab active:cursor-grabbing overflow-hidden ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#fdfcf8]'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="block" />
      </div>
      <div className="absolute bottom-6 right-6 flex items-center gap-3">
        <button
          onClick={handleExportClick}
          className={`flex items-center gap-2 border shadow-lg px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-out active:scale-95 hover:scale-105 ${
            isDarkMode 
              ? 'bg-[#222222]/85 backdrop-blur-md border-[#444444] text-gray-300 hover:bg-[#333333] hover:text-white' 
              : 'bg-[#fdfcf8]/85 backdrop-blur-md border-[#e6e2d6] text-stone-600 hover:bg-[#f4f1ea] hover:text-stone-900'
          }`}
          title="Export as PNG"
        >
          <Download size={16} />
          <span>Export</span>
        </button>
        <button
          onClick={() => setView({ x: 0, y: 0, scale: 50 })}
          className={`border shadow-lg px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-out active:scale-95 hover:scale-105 ${
            isDarkMode 
              ? 'bg-[#222222]/85 backdrop-blur-md border-[#444444] text-gray-300 hover:bg-[#333333] hover:text-white' 
              : 'bg-[#fdfcf8]/85 backdrop-blur-md border-[#e6e2d6] text-stone-600 hover:bg-[#f4f1ea] hover:text-stone-900'
          }`}
        >
          Reset View
        </button>
      </div>

      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowExportModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-sm p-6 rounded-2xl shadow-2xl ${
                isDarkMode ? 'bg-[#222222] border border-[#444444] text-gray-200' : 'bg-[#fdfcf8] border border-[#e6e2d6] text-stone-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Export Graph</h3>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className={`p-1 rounded-md transition-all active:scale-90 ${isDarkMode ? 'hover:bg-[#333333] text-gray-400 hover:text-white' : 'hover:bg-[#e6e2d6] text-stone-500 hover:text-stone-900'}`}
                >
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={confirmExport}>
                <div className="mb-6">
                  <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-stone-500'}`}>
                    File Name
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={exportFileName}
                      onChange={(e) => setExportFileName(e.target.value)}
                      autoFocus
                      className={`flex-1 px-3 py-2 rounded-l-lg border-y border-l outline-none text-sm font-mono transition-colors ${
                        isDarkMode 
                          ? 'bg-[#1a1a1a] border-[#444444] text-gray-200 focus:border-blue-500' 
                          : 'bg-white border-[#e6e2d6] text-stone-800 focus:border-blue-500'
                      }`}
                    />
                    <span className={`px-3 py-2 rounded-r-lg border text-sm font-mono ${
                      isDarkMode ? 'bg-[#333333] border-[#444444] text-gray-400' : 'bg-[#e6e2d6] border-[#e6e2d6] text-stone-500'
                    }`}>
                      .png
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                      isDarkMode ? 'hover:bg-[#333333] text-gray-400 hover:text-white' : 'hover:bg-[#e6e2d6] text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95 shadow-md shadow-blue-500/20"
                  >
                    Download
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}