'use client';

import React from "react";
import { useEffect, useRef , useState } from "react";
import { Download , X } from "lucide-react";
import { motion , AnimatePresence } from "motion/react";
import { ParsedEquation } from "../utils/parser";

interface GraphProps {
    equations: ParsedEquation[];
    variables: Record<string,number>;
    isDarkMode: boolean;
    showToast: (message: string) => void;
}

export default function Graph ({equations,variables,isDarkMode,showToast}: GraphProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [view,setView] = useState({x:0 , y:0 , scale:50});
    const [isDragging,setIsDragging] = useState(false);
    const [lastMouse,setLastMouse] = useState({x:0,y:0});

    const [showExportModal,setShowExportModal] = useState(false);
    const [exportFilename,setExportFileName] = useState('eqvision-graph');

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
        return() => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        draw();
    }, [equations,variables,view,isDarkMode]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        //Fill background
        ctx.fillStyle = isDarkMode ? '#1a1a1a' : '#fdfcf8';
        ctx.fillRect(0,0,width,height);

        //Draw Grid
        ctx.strokeStyle = isDarkMode ? '#333333' : '#e6e2d6';
        ctx.lineWidth = 1;
        ctx.font = '10px Inter,sanas-serif';
        ctx.fillStyle = isDarkMode? '#777777' : '#a8a29e';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const {x:centerX,y:centerY,scale} = view;

        //Calculate visible range
        const startX = centerX - (width / 2) / scale;
        const endX = centerX + (width/2) / scale;
        const startY = centerY - (height/2) / scale;
        const endY = centerY + (height/2) / scale;

        //Determine gird step
        let step = 1;
        if (scale < 10) step = 10;
        if (scale < 2) step = 50;
        if (scale > 100) step = 0.5;
        if (scale > 200) step = 0.1;

        ctx.beginPath();

        //Vertical Lines
        for (let x = Math.floor(startX/step) *step; x <= endX; x += step){
            const canvasX = (x-centerX) * scale + width/2;
            ctx.moveTo(canvasX,0);
            ctx.lineTo(canvasX,height);

            //Draw number
            if (Math.abs(x) > 0.01){
                const textY = Math.max(0,Math.min(height-15,height/2 + centerY * scale + 5));
                ctx.fillText(Number(X.toFixed(2)).toString(),canvasX,textY);
            }
        }

        //Horizontal lines
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let y = Math.floor(startY / step ) * step; y<= endY; y+= step){
            const canvasY = height / 2 -(y-centerY)*scale;
            ctx.moveTo(0,canvasY);
            ctx.lineTo(width,canvasY);

            // Draw number
            if (Math.abs(y) > 0.001){
                const textX = Math.max(20,Math.min(width -5,-centerX * scale + width/2 -5));
                ctx.fillText(Number(y.toFixed(2)).toString(),textX,canvasY);
            }
        }
        ctx.stroke();

        //Draw axes
        ctx.strokeStyle = isDarkMode ? '#555555' : '#a8a29e';
        ctx.lineWidth = 2;
        ctx.beginPath();

        //Y Axis
        const originX = -centerX * scale + width/2;
        if (originX >= 0 && originX <=width){
            ctx.moveTo(originX,0);
            ctx.lineTo(originX,height);
        }

        //X-axis
        const originY = height/2 + centerY * scale;
        if (originY >=0 && originY <= height){
            ctx.moveTo(0,originY);
            ctx.lineTo(width,originY);
        }
        ctx.stroke();

        //Draw Equations
        equations.forEach(eq => {
            if (!eq.visible || !eq.compiled || eq.error)return;

            ctx.strokeStyle = eq.color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            let isFirst = true;
            const pixelStep = 1; //1 pixel per step for smooth curves

            if (eq.isXFunction){
                // Plot x = f(y)
                let prevPx: number | null = null;
                let prevPy: number | null = null;
                let prevMathX: number | null = null;
                let prevMathY: number | null = null;

                for (let py = 0; py <= height; py+= pixelStep){
                    const mathY = centerY - (py - height / 2) /scale;

                    try{
                        const mathX = eq.compiled.evaluate({y: mathY, ...variables});

                        if (typeof mathX !== 'number' || isNaN(mathX) || !isFinite(mathX)){
                            isFirst = true;
                            prevPx = null;
                            continue;
                        }

                        const px = (mathX - centerX)*scale + width/2;

                        //handle horizontal asymptotes
                        if (!isFirst && prevPx !== null && prevMathX !== null && prevMathY !== null){
                            if (Math.abs(px - prevPx) > 20){
                                const midY = (prevMathY + mathY) /2;
                                const midX = eq.compiled.evaluate({y:midY, ...variables});
                                const minMathX = Math.min(prevMathX,mathX);
                                const maxMathX = Math.max(prevMathX,mathX);
                                const isContinuous = midX >= minMathX - 0.001 && midX <= maxMathX + 0.001;

                                if (!isContinuous || isNaN(midX) || !isFinite(midX)){
                                    isFirst = true;
                                }
                            }
                        }

                        if (isFirst){
                            ctx.moveTo(px,py);
                            isFirst = false;
                        } else {
                            ctx.lineTo(px,py);
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
                //Plot y = f(x)
                let prevPx: number | null = null;
                let prevPy: number | null = null;
                let prevMathX: number | null = null;
                let prevMathY: number | null = null;

                for (let px = 0; px <= width; px += pixelStep){
                    const mathX = (px-width/2)/scale + centerX;

                    try{
                        const mathY = eq.compiled.evaluate({x:mathX,...variables});

                        if  (typeof mathY !== 'number' || isNaN(mathY) || !isFinite(mathY)){
                            isFirst = true;
                            prevPy = null;
                            continue;
                        }

                        const py = height/2 - (mathY - centerY)*scale;

                        //Handle vertical
                        if (!isFirst && prevPx !==null && prevMathX !== null && prevMathY !== null){
                            if (Math.abs(px - prevPx) > 20){
                                const midX = (prevMathY + mathY) / 2;
                                const midY = eq.compiled.evaluate({x:midX,...variables});
                                const minMathY = Math.min(prevMathY,mathY);
                                const maxMathY = Math.max(prevMathY,mathY);
                                const isContinuous = midY >= minMathY - 0.001 && midY <= maxMathY + 0.001;

                                if (!isContinuous || isNaN(midY) || !isFinite(midY)){
                                    isFirst = true;
                                }
                            }
                        }
                        
                        if (isFirst){
                            ctx.moveTo(px,py);
                            isFirst = false;
                        } else {
                            ctx.lineTo(px,py);
                        }

                        prevPx = px;
                        prevPy = py;
                        prevMathX = mathX;
                        prevMathY = mathY;
                    } catch(e) {
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
        setLastMouse({x: e.clientX,y:e.clientY});
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;

        setView(prev => ({
            ...prev,
            x: prev.x - dx / prev.scale,
            y: prev.y + dy / prev.scale,
        }));

        setLastMouse({x:e.clientX,y:e.clientY});
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const direction = e.deltaY > 0 ? -1 : 1;

        setView(prev => {
            let newScale = prev.scale * Math.pow(zoomFactor,direction);
            newScale = Math.max(1,Math.min(newScale,1000)); //Clamp scale
            return {...prev,scale:newScale};
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

        showToast(`Downloading ${exportFileName}.png...`)

        const link = document.createElement('a');
        link.download = `${exportFilename}.png`;
    }
}