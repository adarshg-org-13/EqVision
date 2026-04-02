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
    }
}