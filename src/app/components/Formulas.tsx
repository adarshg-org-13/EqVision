"use client";

import React from "react";
import { useRef } from "react";
import { motion } from "motion/react";
import { Download } from "lucide-react";
import Graph from "./Graph";
import { parseEquation } from "../utils/parser";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

interface formulasProps {
    isDarkMode: boolean;
    showToast: (message: string) => void;
}

const FORMULA_DATA = [
    {
        title:'Linear Function',
        category:'Algebra',
        description:'A Straight line with a const slope.',
        equation:'y = 2x + 1',
        color:'#3b82f6',
        hasGraph:true,
    },
];

export default function formuals({isDarkMode,showToast} : formulasProps){
    const contentRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
        if (!contentRef.current) return;
        showToast('Generating PDF.....');

        try {
            const dataUrl = await toPng(contentRef.current, {
                quality:0.98,
                pixelRatio:2,
                backgroundColor: isDarkMode ? '#1a1a1a' : '#fdfcf8',
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit:'mm',
                format:'a4',
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();

            const imgProps = pdf.getImageProperties(dataUrl);
            const margin = 10;
            const availableWidth = pdfWidth - (margin*2);
            
        }
    }
}