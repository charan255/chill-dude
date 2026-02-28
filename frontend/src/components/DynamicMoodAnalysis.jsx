import React, { useState, useEffect } from 'react';
import { Moon, Battery, Brain, Activity } from 'lucide-react';

const MOODS = [
    { id: 'happy', emoji: '🙂', label: 'Happy', color: 'from-green-200 to-emerald-200', text: 'You look happy today!' },
    { id: 'calm', emoji: '😌', label: 'Calm', color: 'from-blue-200 to-cyan-200', text: 'You look calm today.' },
    { id: 'neutral', emoji: '😐', label: 'Neutral', color: 'from-slate-200 to-gray-200', text: 'You seem neutral today.' },
    { id: 'stressed', emoji: '😫', label: 'Stressed', color: 'from-orange-200 to-rose-200', text: 'You look stressed today.' },
    { id: 'tired', emoji: '😴', label: 'Tired', color: 'from-indigo-200 to-purple-200', text: 'You look tired today.' }
];

export const DynamicMoodAnalysis = () => {
    // Simulated metrics
    const [metrics, setMetrics] = useState({
        sleep: 5,         // hours (0-12)
        energy: 30,       // % (0-100)
        stress: 85,       // % (0-100)
        productivity: 65  // % (0-100)
    });

    const [dominantMood, setDominantMood] = useState(MOODS[4]); // default tired
    const [confidence, setConfidence] = useState(0);

    // Calculate Mood
    useEffect(() => {
        const { sleep, energy, stress, productivity } = metrics;

        let scores = { happy: 0, calm: 0, neutral: 0, stressed: 0, tired: 0 };

        // Tired logic (Low sleep, low energy)
        if (sleep < 6) scores.tired += 40;
        if (energy < 40) scores.tired += 40;

        // Stressed logic (High stress)
        if (stress > 70) scores.stressed += 60;
        if (sleep < 6 && stress > 50) scores.stressed += 20;

        // Happy logic (Good sleep, good energy, good productivity)
        if (sleep >= 7) scores.happy += 30;
        if (energy > 70) scores.happy += 30;
        if (productivity > 70) scores.happy += 20;

        // Calm logic (Low stress, good sleep)
        if (stress < 40) scores.calm += 50;
        if (sleep >= 7) scores.calm += 30;

        // Neutral logic (Moderate everything)
        if (sleep >= 5 && sleep <= 7 && stress >= 40 && stress <= 60 && energy >= 40 && energy <= 60) {
            scores.neutral += 80;
        }

        // Find dominant
        let maxScore = -1;
        let topMoodId = 'neutral';

        Object.entries(scores).forEach(([id, score]) => {
            if (score > maxScore) {
                maxScore = score;
                topMoodId = id;
            }
        });

        const selectedMood = MOODS.find(m => m.id === topMoodId);

        // Calculate a fake confidence based on standard deviation/dominance
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
        const confidencePct = Math.min(99, Math.max(45, Math.floor((maxScore / totalScore) * 100) + 20)); // arbitrary boost for UX

        setDominantMood(selectedMood);
        setConfidence(confidencePct);

    }, [metrics]);

    const getInsightTooltip = (moodId) => {
        const { sleep, energy, stress, productivity } = metrics;
        switch (moodId) {
            case 'happy': return energy < 50 ? "Happy – low energy today" : "Happy";
            case 'calm': return stress > 60 ? "Calm – stress level too high" : "Calm";
            case 'neutral': return "Neutral";
            case 'stressed': return stress < 40 ? "Stressed – you seem relaxed" : "Stressed";
            case 'tired': return sleep >= 7 ? "Tired – you slept well" : "Tired";
            default: return "";
        }
    }


    return (
        <div className="flex flex-col flex-1 h-full">
            <h2 className="text-xl font-semibold text-blue-900 mb-6">Today's Mood Analysis</h2>

            <div className="flex flex-col items-center justify-center space-y-4 pt-4 pb-8 relative animate-in fade-in zoom-in duration-700">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-tr ${dominantMood.color} rounded-full blur-3xl opacity-40 transition-all duration-1000`}></div>

                {/* Main Emoji */}
                <div className="text-8xl animate-bounce-slow relative z-10 transition-transform duration-500 hover:scale-110 cursor-default">
                    {dominantMood.emoji}
                </div>

                {/* Main Text */}
                <div className="text-center relative z-10">
                    <p className="text-2xl font-medium text-blue-900/80 mb-1">{dominantMood.text}</p>
                    <p className="text-sm font-bold text-slate-400">Dominant mood: {dominantMood.label} ({confidence}% confidence)</p>
                </div>

                {/* Candidate Row */}
                <div className="flex items-center gap-3 mt-4 relative z-10 bg-white/50 px-4 py-2 rounded-2xl backdrop-blur-sm border border-slate-100/50">
                    {MOODS.map(m => {
                        const isDominant = m.id === dominantMood.id;
                        return (
                            <div key={m.id} className="group relative">
                                <div className={`text-2xl transition-all duration-500 cursor-help ${isDominant ? 'scale-125 saturate-100 drop-shadow-md brightness-110' : 'scale-90 opacity-40 hover:opacity-100 saturate-50 hover:scale-100'}`}>
                                    {m.emoji}
                                </div>
                                {/* Tooltip */}
                                {!isDominant && (
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        {getInsightTooltip(m.id)}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Mood Breakdown (Metrics) */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-8">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5"><Moon className="w-4 h-4 text-indigo-400" /> Sleep</span>
                        <span className="font-bold text-slate-700">{metrics.sleep}h</span>
                    </div>
                    <div className="w-full h-2 bg-indigo-50 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (metrics.sleep / 10) * 100)}%` }}></div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5"><Battery className="w-4 h-4 text-amber-500" /> Energy</span>
                        <span className="font-bold text-slate-700">{metrics.energy}%</span>
                    </div>
                    <div className="w-full h-2 bg-amber-50 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full relative transition-all duration-1000" style={{ width: `${metrics.energy}%` }}>
                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5"><Brain className="w-4 h-4 text-rose-400" /> Stress</span>
                        <span className="font-bold text-slate-700">{metrics.stress > 70 ? 'High' : metrics.stress > 40 ? 'Med' : 'Low'}</span>
                    </div>
                    <div className="w-full h-2 bg-rose-50 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400 rounded-full transition-all duration-1000" style={{ width: `${metrics.stress}%` }}></div>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5"><Activity className="w-4 h-4 text-blue-400" /> Productivity</span>
                        <span className="font-bold text-slate-700">{metrics.productivity}%</span>
                    </div>
                    <div className="w-full h-2 bg-blue-50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${metrics.productivity}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
