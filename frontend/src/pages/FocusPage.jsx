import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import {
    ArrowLeft, CheckCircle2, Circle, Clock, Flame, Lock, PlayCircle,
    Shield, Headset, CloudRain, Library, ListTodo, Activity, AlertTriangle,
    BatteryMedium, TrendingUp, Pause, Play, RotateCcw, Music, Edit2, Check, X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';

// --- MOCK DATA FOR SOUNDS & UI GLOBALS --- //
const pieColors = ['#3B82F6', '#1E293B'];

const sounds = [
    { id: 1, name: 'Binaural Beats', icon: <Activity className="w-5 h-5" />, rec: true, videoId: 'qkXoR8nS3iI' },
    { id: 2, name: 'White Noise', icon: <Headset className="w-5 h-5" />, rec: false, videoId: 'nMfPqeZjc2c' },
    { id: 3, name: 'Rain Sound', icon: <CloudRain className="w-5 h-5" />, rec: false, videoId: 'mPZkdNFkNps' },
    { id: 4, name: 'Library Ambience', icon: <Library className="w-5 h-5" />, rec: true, videoId: '8xTgwNOoWe4' },
];

const FocusPage = () => {
    const navigate = useNavigate();

    // Focus API States
    const [priorityTasks, setPriorityTasks] = useState([]);
    const [urgencyData, setUrgencyData] = useState({ dueToday: [], dueTomorrow: [], dueThisWeek: [] });
    const [adaptivePlan, setAdaptivePlan] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);

    const [activeSound, setActiveSound] = useState(null);

    const [currentTime, setCurrentTime] = useState(new Date());

    // Pomodoro State
    const [focusDuration, setFocusDuration] = useState(25);
    const [isEditingTimer, setIsEditingTimer] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [notifications, setNotifications] = useState(true);

    // Extra Features State
    const [blockerActive, setBlockerActive] = useState(false);
    const [lockMode, setLockMode] = useState(false);

    // Fetch Focus Data
    const fetchFocusData = async () => {
        try {
            const [tasksRes, urgencyRes, planRes, weeklyRes] = await Promise.all([
                fetch('/api/focus/priority-tasks'),
                fetch('/api/focus/urgency'),
                fetch('/api/focus/adaptive-plan'),
                fetch('/api/focus/weekly-productivity')
            ]);

            if (tasksRes.ok) setPriorityTasks(await tasksRes.json());
            if (urgencyRes.ok) setUrgencyData(await urgencyRes.json());
            if (planRes.ok) setAdaptivePlan(await planRes.json());
            if (weeklyRes.ok) setWeeklyData(await weeklyRes.json());
        } catch (error) {
            console.error('Error fetching focus data:', error);
        }
    };

    // Fetch on Mount
    useEffect(() => {
        fetchFocusData();
    }, []);

    // Time formatting
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Pomodoro Logic
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            if (notifications) alert(isBreak ? "Break is over! Time to focus." : "Focus session complete! Take a 5 min break.");
            setIsBreak(!isBreak);
            setTimeLeft(isBreak ? focusDuration * 60 : 5 * 60);
            setIsActive(false);
            setActiveSound(null);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, isBreak, notifications, focusDuration]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(isBreak ? 5 * 60 : focusDuration * 60);
    };
    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const toggleTask = async (id, currentStatus) => {
        try {
            // Optimistic Toggle locally for immediate UI response
            setPriorityTasks(priorityTasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));

            // Push to backend
            const res = await fetch(`/api/assignments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus })
            });

            if (res.ok) {
                // Background refresh to securely sync Priority, Urgency bounds, and Tasks
                fetchFocusData();
            }
        } catch (error) {
            console.error('Failed toggling task:', error);
        }
    };

    return (
        <div className={`min-h-screen relative font-sans transition-all duration-500 ${lockMode ? 'bg-[#0F172A] text-slate-300' : 'bg-slate-50 text-slate-800'}`}>

            {/* Background Grid Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            {/* Absolute Brand Logo (Hidden in Lock Mode to reduce distractions) */}
            {!lockMode && (
                <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
                    <Logo />
                </div>
            )}

            <div className="relative z-10 p-4 md:p-8 pt-24 md:pt-28 max-w-7xl mx-auto space-y-6">

                {/* --- TOP SECTION --- */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        {!lockMode && (
                            <button onClick={() => navigate('/dashboard')} className="p-3 bg-white rounded-xl shadow-sm hover:bg-slate-50 transition-colors border border-slate-200 text-slate-600">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight ${lockMode ? 'text-white' : 'text-slate-900'}`}>Focus Mode</h1>
                            <p className={lockMode ? 'text-slate-400' : 'text-slate-500'}>Let’s get things done.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className={`text-right ${lockMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            <div className="text-xl font-semibold font-mono tracking-tighter">{formatTime(currentTime)}</div>
                            <div className="text-sm">{formatDate(currentTime)}</div>
                        </div>

                        {/* Extras: Streak */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${lockMode ? 'bg-slate-800 border-slate-700' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="font-bold">12 Days</span>
                        </div>
                    </div>
                </header>

                {/* --- MAIN GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* LEFT COLUMN: Tasks, Plan, Radar, Energy */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Lock Mode / Distraction Toggle */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setLockMode(!lockMode)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${lockMode ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                            >
                                <Lock className="w-4 h-4" />
                                {lockMode ? 'Unlock Focus Mode' : 'Lock Focus Mode'}
                            </button>
                            <button
                                onClick={() => setBlockerActive(!blockerActive)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all border ${blockerActive ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Shield className={`w-4 h-4 ${blockerActive ? 'text-emerald-500' : ''}`} />
                                {blockerActive ? 'Distractions Blocked' : 'Enable Blocker'}
                            </button>
                        </div>

                        {/* SECTION 7: Energy-Aware Adjustment */}
                        <div className={`p-4 rounded-xl border flex items-start gap-4 ${lockMode ? 'bg-slate-800/50 border-slate-700/50 text-slate-300' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                            <BatteryMedium className={`w-6 h-6 shrink-0 mt-0.5 ${lockMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            <div>
                                <h3 className="font-semibold mb-1">Energy-Aware Suggestion</h3>
                                <p className="text-sm opacity-90">You seem tired. Recommended session length is reduced to 25 minutes with longer 10-minute breaks to avoid burnout.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* SECTION 1: Today's Tasks */}
                            <section className={`p-6 rounded-[2rem] border shadow-sm ${lockMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center gap-2 mb-6">
                                    <ListTodo className="w-5 h-5 text-blue-500" />
                                    <h2 className={`text-lg font-bold ${lockMode ? 'text-white' : 'text-slate-900'}`}>Priority Tasks</h2>
                                </div>
                                <div className="space-y-3">
                                    {priorityTasks.map(task => (
                                        <div key={task.id} className={`p-4 rounded-2xl border transition-all ${task.completed ? 'opacity-50 grayscale' : ''} ${task.isUrgent && !task.completed ? (lockMode ? 'border-red-900/50 bg-red-900/10' : 'border-red-200 bg-red-50') : (lockMode ? 'border-slate-700 bg-slate-800/80' : 'border-slate-100 bg-slate-50')}`}>
                                            <div className="flex items-start gap-3">
                                                <button onClick={() => toggleTask(task.id, task.completed)} className="mt-1 shrink-0">
                                                    {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-400" />}
                                                </button>
                                                <div className="flex-1">
                                                    <h3 className={`font-semibold ${lockMode ? 'text-white' : 'text-slate-900'} ${task.completed ? 'line-through opacity-70' : ''}`}>{task.title}</h3>
                                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                                        <span className="px-2 py-0.5 bg-white/50 rounded-md font-medium text-slate-700">{task.subject.name}</span>
                                                        <span className="flex items-center gap-1 opacity-70"><Clock className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {priorityTasks.length === 0 && (
                                        <div className="text-center py-6 text-sm text-slate-500 italic">No priority tasks! Everything is cleared out.</div>
                                    )}
                                </div>
                            </section>

                            {/* SECTION 2: Smart Study Plan */}
                            <section className={`p-6 rounded-[2rem] border shadow-sm flex flex-col ${lockMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center gap-2 mb-6">
                                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                                    <h2 className={`text-lg font-bold ${lockMode ? 'text-white' : 'text-slate-900'}`}>Adaptive Plan</h2>
                                </div>
                                <div className="relative flex-1">
                                    {/* Vertical Line */}
                                    <div className={`absolute left-[15px] top-2 bottom-2 w-0.5 ${lockMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

                                    <div className="space-y-6 relative">
                                        {adaptivePlan.map((planStep, idx) => (
                                            <div key={idx} className="flex gap-4 relative z-10 transition-transform hover:translate-x-1">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm text-xs font-bold ${planStep.type === 'study' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-slate-900'}`}>{planStep.step}</div>
                                                <div className="pt-1.5 flex-1">
                                                    <h4 className={`font-semibold text-sm ${lockMode ? 'text-white' : 'text-slate-900'}`}>{planStep.type === 'study' ? planStep.subject : 'Break'}</h4>
                                                    <p className={`text-xs mt-1 ${lockMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {planStep.duration}m {planStep.type === 'study' ? `focus • ${planStep.task}` : ' • Rest & Recharge'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {adaptivePlan.length === 0 && (
                                            <div className="text-center py-6 text-sm text-slate-500 italic relative z-10">No adaptive plan generated—add some chapters!</div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* SECTION 6: Urgency Overview (Redesigned) */}
                        <section className={`p-6 rounded-[2rem] border shadow-sm ${lockMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                    <h2 className={`text-xl font-bold ${lockMode ? 'text-white' : 'text-slate-900'}`}>Urgency Overview</h2>
                                </div>
                                <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 flex items-center gap-1.5 shrink-0">
                                    <Flame className="w-4 h-4" />
                                    {urgencyData.dueToday.length + urgencyData.dueTomorrow.length} tasks due soon
                                </span>
                            </div>

                            <div className="space-y-4">
                                {urgencyData.dueToday.map(task => (
                                    <div key={task.id} className={`p-4 rounded-2xl border transition-colors ${lockMode ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-800' : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50'}`}>
                                        <div className="flex justify-between items-center mb-3 gap-2">
                                            <h3 className={`font-semibold truncate ${lockMode ? 'text-white' : 'text-slate-900'}`}>{task.title}</h3>
                                            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-md shrink-0">Due Today</span>
                                        </div>
                                        <div className={`h-2.5 w-full rounded-full overflow-hidden ${lockMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                            <div className="h-full bg-red-500 w-[95%] rounded-full relative">
                                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {urgencyData.dueTomorrow.map(task => (
                                    <div key={task.id} className={`p-4 rounded-2xl border transition-colors ${lockMode ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-800' : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50'}`}>
                                        <div className="flex justify-between items-center mb-3 gap-2">
                                            <h3 className={`font-semibold truncate ${lockMode ? 'text-white' : 'text-slate-900'}`}>{task.title}</h3>
                                            <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-md shrink-0">Due Tomorrow</span>
                                        </div>
                                        <div className={`h-2.5 w-full rounded-full overflow-hidden ${lockMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                            <div className="h-full bg-orange-500 w-[70%] rounded-full"></div>
                                        </div>
                                    </div>
                                ))}

                                {urgencyData.dueThisWeek.map(task => (
                                    <div key={task.id} className={`p-4 rounded-2xl border transition-colors ${lockMode ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-800' : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50'}`}>
                                        <div className="flex justify-between items-center mb-3 gap-2">
                                            <h3 className={`font-semibold truncate ${lockMode ? 'text-white' : 'text-slate-900'}`}>{task.title}</h3>
                                            <span className="text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-100 px-2.5 py-1 rounded-md shrink-0">Due This Week</span>
                                        </div>
                                        <div className={`h-2.5 w-full rounded-full overflow-hidden ${lockMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                            <div className="h-full bg-yellow-400 w-[30%] rounded-full"></div>
                                        </div>
                                    </div>
                                ))}

                                {/* Empty state catch */}
                                {urgencyData.dueToday.length === 0 && urgencyData.dueTomorrow.length === 0 && urgencyData.dueThisWeek.length === 0 && (
                                    <div className="text-center py-6 text-sm text-slate-500 italic">No urgent tasks due in the next week.</div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: Pomodoro, Visuals, Sounds */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* SECTION 5: Pomodoro Timer (Redesigned) */}
                        <section className={`p-8 rounded-[2.5rem] border shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden ${lockMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                            {isActive && <div className="absolute inset-0 bg-blue-500/10 blur-3xl animate-pulse rounded-full scale-150"></div>}

                            <div className="relative z-10 w-full flex flex-col items-center">
                                <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold mb-10 shadow-sm border ${lockMode ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    {isBreak ? 'Break Time' : 'Deep Focus'}
                                </div>

                                {/* Circular Progress Ring + Timer */}
                                <div className="relative w-64 h-64 flex items-center justify-center mb-10 group">
                                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                        <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className={lockMode ? "text-slate-700" : "text-slate-100"} />
                                        <circle
                                            cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent"
                                            className={`transition-all duration-1000 ease-linear ${isBreak ? 'text-emerald-500' : 'text-blue-500'}`}
                                            strokeDasharray="754"
                                            strokeDashoffset={754 - (754 * (timeLeft / (isBreak ? 5 * 60 : focusDuration * 60)))}
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    {isEditingTimer && !isActive && !isBreak ? (
                                        <div className="flex flex-col items-center z-10">
                                            <input
                                                type="number"
                                                min="1" max="180"
                                                value={focusDuration}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 25;
                                                    setFocusDuration(val);
                                                    setTimeLeft(val * 60);
                                                }}
                                                className={`text-5xl font-black font-mono tracking-tighter tabular-nums w-32 text-center bg-transparent outline-none border-b-2 ${lockMode ? 'text-white border-white/30 focus:border-blue-400' : 'text-slate-900 border-slate-300 focus:border-blue-500'}`}
                                            />
                                            <button
                                                onClick={() => setIsEditingTimer(false)}
                                                className={`mt-4 p-2 rounded-full transition-colors ${lockMode ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center z-10 relative">
                                            <div className={`text-6xl md:text-7xl font-black font-mono tracking-tighter tabular-nums ${lockMode ? 'text-white drop-shadow-2xl' : 'text-slate-900 drop-shadow-md'}`}>
                                                {formatTimer(timeLeft)}
                                            </div>
                                            {!isActive && !isBreak && (
                                                <button
                                                    onClick={() => setIsEditingTimer(true)}
                                                    className={`absolute -bottom-12 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full ${lockMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                    title="Edit Duration"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-4 w-full max-w-xs">
                                    <button
                                        onClick={toggleTimer}
                                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg ${isActive ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30'}`}
                                    >
                                        {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                                        {isActive ? 'Pause' : 'Start'}
                                    </button>
                                    <button onClick={resetTimer} className={`p-4 rounded-2xl transition-colors border ${lockMode ? 'bg-white/10 hover:bg-white/20 border-white/10 text-slate-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`} title="Reset Timer">
                                        <RotateCcw className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className={`mt-8 flex items-center gap-3 text-sm font-medium px-4 py-2 rounded-xl border ${lockMode ? 'bg-white/5 opacity-80' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                    <input
                                        type="checkbox"
                                        id="notif"
                                        checked={notifications}
                                        onChange={() => setNotifications(!notifications)}
                                        className={`w-4 h-4 rounded focus:ring-blue-500 focus:ring-offset-0 ${lockMode ? 'border-white/30 bg-transparent' : 'border-slate-300 bg-white'}`}
                                    />
                                    <label htmlFor="notif" className="cursor-pointer select-none">Sound notifications</label>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 3: Progress Visuals (Redesigned) */}
                        <section className={`p-8 rounded-[2rem] border shadow-sm ${lockMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                            <div className="mb-6">
                                <h2 className={`text-xl font-bold mb-1 ${lockMode ? 'text-white' : 'text-slate-900'}`}>Weekly Productivity Trend</h2>
                                <p className={`text-sm font-medium ${lockMode ? 'text-emerald-400' : 'text-emerald-600'}`}>↑ You are improving compared to last week.</p>
                            </div>

                            {/* Fixed height container for Recharts */}
                            <div className="h-64 w-full mb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={lockMode ? 0.3 : 0.2} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={lockMode ? '#334155' : '#E2E8F0'} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: lockMode ? '#94A3B8' : '#64748B', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: lockMode ? '#94A3B8' : '#64748B', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: lockMode ? '1px solid #334155' : '1px solid #E2E8F0', backgroundColor: lockMode ? '#1E293B' : '#fff', color: lockMode ? '#fff' : '#000', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="top" height={36} iconType="circle" formatter={(value) => <span style={{ color: lockMode ? '#CBD5E1' : '#475569', fontWeight: 500 }}>Focus Hours</span>} />
                                        <Area type="monotone" name="Focus Hours" dataKey="focus" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorFocus)" activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex items-center gap-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="h-20 w-20 shrink-0">
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={[{ name: 'Pending', value: priorityTasks.length || 1 }]} innerRadius={28} outerRadius={38} paddingAngle={4} dataKey="value" stroke="none">
                                                <Cell fill={pieColors[1]} />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold opacity-70 mb-1 text-slate-500">Tasks Pending</div>
                                    <div className={`text-3xl font-black font-mono ${lockMode ? 'text-white' : 'text-slate-900'}`}>{priorityTasks.length}</div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 4: Focus Sounds */}
                        <section className={`p-6 rounded-[2rem] border shadow-sm flex flex-col transition-all duration-500 ${lockMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <Music className="w-5 h-5 text-indigo-500" />
                                <h2 className={`text-lg font-bold ${lockMode ? 'text-white' : 'text-slate-900'}`}>Soundscapes</h2>
                            </div>
                            <div className={`grid grid-cols-2 gap-3 ${activeSound ? 'mb-4' : ''}`}>
                                {sounds.map(sound => {
                                    const isActiveSound = activeSound?.id === sound.id;
                                    return (
                                        <div
                                            key={sound.id}
                                            onClick={() => setActiveSound(isActiveSound ? null : sound)}
                                            className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all hover:-translate-y-1 ${isActiveSound ? (lockMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50') : (lockMode ? 'bg-slate-800 border-slate-600 hover:border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:shadow-md')}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className={`p-2 rounded-lg transition-colors ${isActiveSound ? 'bg-blue-500 text-white' : (lockMode ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-600 shadow-sm')}`}>
                                                    {sound.icon}
                                                </div>
                                                {isActiveSound ? (
                                                    <span className="flex h-2 w-2 relative mt-1 mr-1">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                    </span>
                                                ) : (
                                                    sound.rec && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 mr-1"></span>
                                                )}
                                            </div>
                                            <h3 className={`text-sm font-semibold leading-tight ${lockMode ? 'text-white' : 'text-slate-900'}`}>{sound.name}</h3>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Active Player */}
                            {activeSound && (
                                <div className={`p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-bottom-2 ${lockMode ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2 max-w-[80%]">
                                            <Activity className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />
                                            <span className={`text-sm font-semibold truncate ${lockMode ? 'text-white' : 'text-slate-800'}`}>Now Playing: {activeSound.name}</span>
                                        </div>
                                        <button onClick={() => setActiveSound(null)} className={`p-1.5 rounded-full transition-colors ${lockMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="relative w-full rounded-lg overflow-hidden flex items-center justify-center bg-transparent aspect-[21/9]">
                                        <iframe
                                            className="w-full h-full"
                                            src={`https://www.youtube.com/embed/${activeSound.videoId}?autoplay=1&loop=1&playlist=${activeSound.videoId}&controls=1&modestbranding=1&rel=0`}
                                            title={activeSound.name}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                </div>
                            )}
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocusPage;
