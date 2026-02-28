import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SCAN_PHASES = [
    { text: "Detecting facial landmarks...", duration: 800 },
    { text: "Reading micro-expressions...", duration: 1000 },
    { text: "Analyzing stress markers...", duration: 1200 },
    { text: "Finalizing mood profile...", duration: 1000 }
];

const TOTAL_DURATION = SCAN_PHASES.reduce((acc, phase) => acc + phase.duration, 0); // 4000ms

const MoodScanPage = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [streamActive, setStreamActive] = useState(false);

    useEffect(() => {
        let stream = null;
        let progressInterval = null;
        let phaseTimers = [];

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setStreamActive(true);
                }
            } catch (err) {
                console.error("Error accessing webcam:", err);
            }
        };

        startCamera();

        // 1. Progress Bar Logic
        const startTime = Date.now();
        progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const percentage = Math.min(100, Math.floor((elapsed / TOTAL_DURATION) * 100));
            setProgress(percentage);

            if (percentage === 100) {
                clearInterval(progressInterval);
                finishScan(stream);
            }
        }, 50); // smooth 50ms updates

        // 2. Phased Text Logic
        let cumulativeTime = 0;
        SCAN_PHASES.forEach((phase, index) => {
            if (index === 0) return; // already set to 0 initially
            cumulativeTime += SCAN_PHASES[index - 1].duration;
            const timer = setTimeout(() => {
                setPhaseIndex(index);
            }, cumulativeTime);
            phaseTimers.push(timer);
        });

        const finishScan = (activeStream) => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
            // Small delay at 100% before transition
            setTimeout(() => navigate('/dashboard'), 400);
        };

        return () => {
            clearInterval(progressInterval);
            phaseTimers.forEach(clearTimeout);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [navigate]);

    return (
        <div className="relative h-screen w-screen bg-black overflow-hidden flex flex-col items-center justify-center">
            {/* Background Camera */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${streamActive ? 'opacity-40' : 'opacity-0'}`}
            />

            {/* Immersive Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950 pointer-events-none" />

            {/* Main Center UI */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">

                {/* 1. Animated Scanner Ring */}
                <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 border-[3px] border-indigo-500/20 rounded-full animate-pulse" />

                    {/* Rotating Dashed Ring */}
                    <div className="absolute inset-[-10px] border-[2px] border-dashed border-indigo-400/40 rounded-full animate-[spin_8s_linear_infinite]" />
                    <div className="absolute inset-[-20px] border-[1px] border-dashed border-blue-400/20 rounded-full animate-[spin_12s_linear_infinite_reverse]" />

                    {/* Inner core ring */}
                    <div className="w-48 h-48 border-2 border-indigo-300/30 rounded-full flex items-center justify-center overflow-hidden relative backdrop-blur-sm bg-indigo-500/5 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
                        {/* Scanning Sweep Line */}
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)] animate-[scan_2s_ease-in-out_infinite]" />

                        {/* Center % Readout */}
                        <div className="text-4xl font-black text-white font-mono tracking-tighter drop-shadow-md">
                            {progress}<span className="text-indigo-400 text-2xl">%</span>
                        </div>
                    </div>
                </div>

                {/* 2. Text Feedback Area */}
                <div className="text-center w-full min-h-[80px]">
                    <h2 className="text-sm font-bold text-indigo-400 tracking-[0.2em] uppercase mb-4 opacity-80">
                        Biometric Analysis
                    </h2>

                    {/* Animated Phase Text */}
                    <div className="relative h-6 overflow-hidden w-full flex justify-center">
                        <div
                            className="absolute transition-transform duration-500 ease-out flex flex-col font-medium text-slate-200 text-lg tracking-wide"
                            style={{ transform: `translateY(-${phaseIndex * 24}px)` }}
                        >
                            {SCAN_PHASES.map((phase, idx) => (
                                <div key={idx} className="h-[24px] flex items-center justify-center whitespace-nowrap opacity-90 drop-shadow-md">
                                    {phase.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Scan CSS logic added to standard Tailwind */}
            <style jsx>{`
                @keyframes scan {
                    0% { top: -10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default MoodScanPage;
