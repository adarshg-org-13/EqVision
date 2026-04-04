"use client";

import React from "react";
import { useRef } from "react";
import { motion } from "motion/react";
import { Download } from "lucide-react";
import Graph from "./Graph";
import { parseEquation } from "../utils/parser";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { variance } from "mathjs";

interface formulasProps {
    isDarkMode: boolean;
    showToast: (message: string) => void;
}

const FORMULA_DATA = [
     {
      title:'Constant Function',
      category:'Algebra',
      descirption:'A constant straight line.',
      equation:'y = 1',
      color:'#ef4444',
      hasGraph:true,
    },
    {
        title:'Linear Function',
        category:'Algebra',
        description:'A Straight line with a const slope.',
        equation:'y = 2x + 1',
        color:'#3b82f6',
        hasGraph:true,
    },
    {
      title:'Square Root Graph',
      category:'Algebric',
      description:'Graph representing the sqrt of the number (always +ve)',
      equation:'y = sqrt(x)',
      color:'#10b981',
      hasGraph:true,
    },
    {
      title:'Quadratic Function',
      category:'Algebra',
      description:'A parabola, representing a polynomial of degree 2.',
      equation:'y = x^2 - 2',
      color:'#ef4444',
      hasGraph:true,
    },
    {
      title:'Cubic Function',
      category:'Algebra',
      description:'Cubic Curve representing a polynomial of degree 3.',
      equation:'x^3 - 1',
      color:'#10b981',
      hasGraph:true,
    },
    {
      title:'Sine Wave',
      category:'Trigonometry',
      description:'A smooth, periodic oscillation.',
      equation:'y = sin(x)',
      color:'#f59e0b',
      hasGraph:true,
    },
    {
      title:'Tan Wave',
      category:'Trigonometry',
      description:'tan graph, its range is from (0,infinity)',
      equation:'y = tan(x)',
      color:'#ef4444',
      hasGraph:true,
    },
    {
      title:'Cosine Wave',
      category:'Trigonometry',
      description:'A smooth, periodic ocillations with a period of 90 degree form the sin graph',
      equation:'y = cos(x)',
      color:'#10b981',
      hasGraph:true,
    },
    {
      title:'Log(x) graph',
      category:'Logarithm',
      description:'A logarithmic graph which grows exponentially.',
      equation:'y = logx + 0.2',
      color:'#f59e0b',
      hasGraph:true,
    },
    {
      title:'Trigo Identity',
      category:'Trigonometry',
      description:'A basic tirgonometry identity',
      equation:'sin² + cos² = 1',
      color:'#3b82f6',
      hasGraph:false,
    },
    {
      title:'Double angle formula',
      category:'Trigonometry',
      description:'Double angle formula to convert into normal angle',
      equation:'sin2x = 2sinxcosx',
      color:'#ef4444',
      hasGraph:false,
    },
    {
      title:'Number of elements in the Union of two sets A&B',
      category:'Set Theory',
      description:'The number of elements in the union of two sets.',
      equation:'n(A ∪ B) = n(A) + n(B) - n(A ∩ B)',
      color:'#8b5cf6',
      hasGraph:false,
    },
    {
      title:'Pythagorean Theorem',
      category:'Geometry',
      desciprtion:'Relates the length of the sides of a right triangle',
      equation:'a² + b² = c²',
      color:'#10b981',
      hasGraph:false,
    },
    {
      title:'Euler/`s Identity',
      category:'Complex Numbers',
      description:'A Beautiful equation connecting fundamental mathematical constants.',
      equation:'e^(iπ) + 1 = 0',
      color:'#ec4899',
      hasGraph:false,
    },
    {
      title:'Double angle (tan)',
      category:'Trigonometry',
      description:'Double angle formula to find its value',
      equation:'tan(x + y) = tan(x) + tan(y) / 1 - tan(x)tan(y)',
      color:'#f59e0b',
      hasGraph:false,
    }
];

export default function Formulas({ isDarkMode, showToast }: formulasProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    showToast('Generating PDF...');
    
    try {
      const dataUrl = await toPng(contentRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: isDarkMode ? '#1a1a1a' : '#fdfcf8',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const margin = 10;
      const availableWidth = pdfWidth - (margin * 2);
      const ratio = imgProps.width / imgProps.height;
      const imgHeight = availableWidth / ratio;

      pdf.addImage(dataUrl, 'PNG', margin, margin, availableWidth, imgHeight);
      pdf.save('math-formulas.pdf');
      
      showToast('PDF downloaded successfully!');
    } catch (error) {
      console.error('Failed to generate PDF', error);
      showToast('Failed to generate PDF');
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-[#ffffff]' : 'text-[#1c1917]'}`}>Formula Reference</h1>
            <p className={`mt-2 ${isDarkMode ? 'text-[#9ca3af]' : 'text-[#78716c]'}`}>A quick reference guide for common mathematical functions and formulas.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadPDF}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium shadow-sm transition-colors ${
              isDarkMode 
                ? 'bg-[#333333] hover:bg-[#444444] text-[#ffffff] border border-[#444444]' 
                : 'bg-[#ffffff] hover:bg-[#f9fafb] text-[#292524] border border-[#e6e2d6]'
            }`}
          >
            <Download size={18} />
            Download PDF
          </motion.button>
        </div>

        <div ref={contentRef} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 rounded-2xl ${isDarkMode ? 'bg-[#1a1a1a] text-[#ffffff]' : 'bg-[#fdfcf8] text-[#1c1917]'}`}>
          {FORMULA_DATA.map((item, idx) => {
            const parsed = item.hasGraph ? parseEquation(item.equation) : { variables: [] };
            const eqObj = {
              id: String(idx),
              text: item.equation,
              color: item.color,
              visible: true,
              ...parsed
            };

            return (
              <div 
                key={idx} 
                className={`flex flex-col rounded-2xl border overflow-hidden ${
                  isDarkMode ? 'bg-[#222222] border-[#444444]' : 'bg-[#ffffff] border-[#e6e2d6]'
                }`}
                style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              >
                <div className="h-48 relative border-b border-inherit bg-inherit flex items-center justify-center overflow-hidden">
                  {item.hasGraph ? (
                    <div className="absolute inset-0 pointer-events-none">
                      <Graph 
                        equations={[eqObj]} 
                        variables={{}} 
                        isDarkMode={isDarkMode} 
                        showToast={() => {}} 
                      />
                    </div>
                  ) : (
                    <>
                      <div 
                        className="absolute inset-0 opacity-10" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <div 
                        className="relative z-10 px-6 text-center font-serif text-2xl md:text-3xl tracking-wide"
                        style={{ color: item.color }}
                      >
                        {item.equation}
                      </div>
                    </>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-[#ffffff]' : 'text-[#292524]'}`}>{item.title}</h3>
                    <span 
                      className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full"
                      style={{ backgroundColor: item.color + '20', color: item.color }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <div className={`mt-1 font-mono text-sm font-medium`} style={{ color: item.color }}>
                    {item.equation}
                  </div>
                  <p className={`mt-3 text-sm leading-relaxed flex-1 ${isDarkMode ? 'text-[#9ca3af]' : 'text-[#57534e]'}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
