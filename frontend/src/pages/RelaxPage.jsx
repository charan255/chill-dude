import React, { useState, useEffect, useRef } from 'react';
import {
    Headphones, Moon, Coffee, Users, Gamepad2, Puzzle, Dices,
    MonitorPlay, Music, PlayCircle, ArrowLeft, Flame, Clock, Zap,
    Trophy, TrendingUp, Sparkles, Ghost, Target, X, Activity, CloudRain, Library, Headset
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { GameModal } from '../components/RelaxGames';

const categories = [
    { id: 'social', name: 'Social', icon: <Users size={16} /> },
    { id: 'games', name: 'Games', icon: <Gamepad2 size={16} /> },
    { id: 'music', name: 'Soundscapes', icon: <Music size={16} /> },
    { id: 'mind', name: 'Mind', icon: <Sparkles size={16} /> },
    { id: 'watch', name: 'Watch', icon: <MonitorPlay size={16} /> },
    { id: 'night', name: 'Night', icon: <Moon size={16} /> },
];

const voiceRooms = [
    { id: 'room_1', name: 'Exam Stress Room', icon: <Headphones className="w-6 h-6" />, participants: 12, color: 'bg-blue-100 text-blue-600' },
    { id: 'room_2', name: 'Late Night Chill', icon: <Moon className="w-6 h-6" />, participants: 8, color: 'bg-indigo-100 text-indigo-600' },
    { id: 'room_3', name: 'Burnout Support', icon: <Coffee className="w-6 h-6" />, participants: 15, color: 'bg-rose-100 text-rose-600' },
    { id: 'room_4', name: 'Casual Hangout', icon: <Users className="w-6 h-6" />, participants: 24, color: 'bg-emerald-100 text-emerald-600' },
];

const miniGames = [
    { id: 'memory', name: 'Memory Quest', icon: <Target className="w-8 h-8" />, type: 'Match pairs', color: 'text-blue-500' },
    { id: 'word', name: 'Space Word', icon: <Gamepad2 className="w-8 h-8" />, type: 'Unscramble', color: 'text-emerald-500' },
    { id: 'reaction', name: 'Reaction Tap', icon: <Zap className="w-8 h-8" />, type: 'Reflex', color: 'text-orange-500' },
    { id: 'sudoku', name: 'Mini Sudoku', icon: <Puzzle className="w-8 h-8" />, type: 'Logic', color: 'text-indigo-500' },
];

const moodSuggestions = [
    { id: 'Stressed', title: '2 Min Breathing', type: 'timer', duration: 2, color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { id: 'Bored', title: 'Zen Blocks', type: 'game', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'Creative', title: 'Sketching / Notes', type: 'action', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'Tired', title: '5 Min Tea Break', type: 'timer', duration: 5, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
];

const sounds = [
    { id: 'snd_1', name: 'Binaural Beats', icon: <Activity className="w-5 h-5" />, rec: true, videoId: 'qkXoR8nS3iI' },
    { id: 'snd_2', name: 'White Noise', icon: <Headset className="w-5 h-5" />, rec: false, videoId: 'nMfPqeZjc2c' },
    { id: 'snd_3', name: 'Rain Sound', icon: <CloudRain className="w-5 h-5" />, rec: false, videoId: 'mPZkdNFkNps' },
    { id: 'snd_4', name: 'Library Ambience', icon: <Library className="w-5 h-5" />, rec: true, videoId: '8xTgwNOoWe4' },
];

const microBreaks = [
    { id: 1, name: '2 min Breathing', duration: 2, icon: <CloudRain className="w-5 h-5" /> },
    { id: 2, name: '5 min Stretch', duration: 5, icon: <Activity className="w-5 h-5" /> },
    { id: 3, name: '10 min Walk', duration: 10, icon: <Coffee className="w-5 h-5" /> }
];

const RelaxPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('social');

    // Data State
    const [stats, setStats] = useState({ totalMinutes: 0, currentStreak: 0, xp: 0, todayMinutes: 0 });
    const [analytics, setAnalytics] = useState({ relaxMinutes: 0, focusMinutes: 0, ratio: 1.0, mostUsedActivity: 'None', moodFrequency: {}, overdueAssignments: 0 });
    const [reflections, setReflections] = useState([]);

    // Tracker States
    const [lastMood, setLastMood] = useState(localStorage.getItem('avinya_last_mood') || null);

    // Media & Active Activities
    const [activeSound, setActiveSound] = useState(null);
    const [activeRoom, setActiveRoom] = useState(null); // { id, name, joinTime }
    const [activeGame, setActiveGame] = useState(null);

    // Timer State
    const [timerActive, setTimerActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerConfig, setTimerConfig] = useState(null); // { duration, title, type }
    const timerRef = useRef(null);

    // Reflection Inputs
    const [gratitudeText, setGratitudeText] = useState('');
    const [reflectionText, setReflectionText] = useState('');

    // --- DATA FETCHING ---
    const fetchRelaxData = async () => {
        try {
            const [st, an, ref] = await Promise.all([
                fetch('/api/relax/stats').then(r => r.json()),
                fetch('/api/relax/analytics').then(r => r.json()),
                fetch('/api/relax/reflections').then(r => r.json())
            ]);
            setStats(st);
            setAnalytics(an);
            setReflections(ref);
        } catch (error) {
            console.error('Failed fetching relax data', error);
        }
    };

    useEffect(() => {
        fetchRelaxData();
        return () => handleCleanupActivities();
    }, []);

    // Cleanup logic when unmounting or switching heavy features
    const handleCleanupActivities = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (activeRoom) {
            const minutesSpent = Math.max(1, Math.floor((new Date() - activeRoom.joinTime) / 60000));
            logSession('room', minutesSpent, activeRoom.name);
        }
    };

    // --- API LOGGING ---
    const logSession = async (type, duration, activity, completedTimer = false) => {
        if (duration <= 0) return;
        try {
            await fetch('/api/relax/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, duration, activity, completedTimer })
            });
            fetchRelaxData();
        } catch (e) { console.error('Error logging session:', e); }
    };

    const submitReflection = async () => {
        if (!gratitudeText.trim() && !reflectionText.trim()) return;
        try {
            await fetch('/api/relax/reflection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gratitude: gratitudeText, reflection: reflectionText })
            });
            setGratitudeText('');
            setReflectionText('');
            fetchRelaxData();
        } catch (e) { console.error('Error saving reflection', e); }
    };

    // --- TIMERS ---
    const startTimer = (durationMinutes, title, type) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimerConfig({ duration: durationMinutes, title, type });
        setTimeLeft(durationMinutes * 60);
        setTimerActive(true);

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setTimerActive(false);
                    // auto log when finishing
                    logSession(type || 'timer', durationMinutes, title, true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const cancelTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimerActive(false);
        const elapsedMinutes = Math.floor(((timerConfig.duration * 60) - timeLeft) / 60);
        if (elapsedMinutes > 0) {
            logSession(timerConfig.type || 'timer', elapsedMinutes, timerConfig.title, false);
        }
        setTimerConfig(null);
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // --- INTERACTION LOGIC ---
    const handleMoodClick = (mood) => {
        setLastMood(mood.id);
        localStorage.setItem('avinya_last_mood', mood.id);
        logSession('mood', 1, mood.id); // log briefly for analytics

        if (mood.type === 'timer') {
            startTimer(mood.duration, mood.title, 'mood_timer');
        }
    };

    const handleRoomToggle = (room) => {
        if (activeRoom && activeRoom.id === room.id) {
            // Leave room
            const minutesSpent = Math.max(1, Math.floor((new Date() - activeRoom.joinTime) / 60000));
            logSession('room', minutesSpent, activeRoom.name);
            setActiveRoom(null);
        } else {
            // Switch or Join
            if (activeRoom) {
                const minutesSpent = Math.max(1, Math.floor((new Date() - activeRoom.joinTime) / 60000));
                logSession('room', minutesSpent, activeRoom.name);
            }
            setActiveRoom({ ...room, joinTime: new Date() });
        }
    };

    // Derived flags
    const isBurnoutRisk = analytics.focusMinutes > 90 || analytics.overdueAssignments > 3;

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-lavender-50 via-white to-blue-50 p-4 md:p-8 pt-20 md:pt-24 font-sans text-slate-800 pb-20">

            {/* Absolute Brand Logo */}
            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
                <Logo />
            </div>

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6 flex flex-col items-center relative">
                <div className="flex items-center w-full relative mb-8">
                    <button onClick={() => navigate('/dashboard')} className="p-3 rounded-full bg-white/60 hover:bg-white shadow-sm border border-slate-100 transition-all active:scale-95 absolute left-0">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <div className="text-center w-full">
                        <h1 className="text-4xl font-bold text-slate-800 tracking-tight font-serif mb-2">Relax Mode</h1>
                        <p className="text-slate-500">Take a break. Recharge your mind.</p>
                    </div>
                </div>

                {/* Burnout Banner */}
                {isBurnoutRisk && !timerActive && (
                    <div className="w-full max-w-2xl bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between mb-6 shadow-sm">
                        <div className="flex items-center gap-3 text-rose-700">
                            <Zap className="w-5 h-5 text-rose-500" />
                            <span className="font-semibold text-sm">You've been pushing hard. Take a short reset to avoid burnout.</span>
                        </div>
                        <button onClick={() => startTimer(5, 'Burnout Reset', 'timer')} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95">
                            Reset Now
                        </button>
                    </div>
                )}

                {/* Category Tabs */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-4 no-scrollbar max-w-full px-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-300 ${activeTab === cat.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100 scale-105' : 'bg-white/60 text-slate-500 hover:bg-white border border-transparent hover:border-indigo-100'}`}
                        >
                            {cat.icon}
                            <span className="font-semibold text-sm">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column */}
                <div className="lg:col-span-8 space-y-8">

                    {/* DYNAMIC TAB RENDERING */}

                    {activeTab === 'social' && (
                        <section className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/50 transition-all duration-500">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <Headphones className="w-6 h-6 text-indigo-400" />
                                    <h2 className="text-xl font-bold text-slate-800">Simulated Voice Chat Rooms</h2>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {voiceRooms.map(room => {
                                    const isActive = activeRoom?.id === room.id;
                                    return (
                                        <div key={room.id} onClick={() => handleRoomToggle(room)} className={`group p-5 rounded-3xl border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between cursor-pointer ${isActive ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500 ring-opacity-50' : 'bg-white border-slate-100'}`}>
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-4 rounded-2xl ${room.color} group-hover:rotate-6 transition-all duration-300`}>
                                                    {room.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-700">{room.name}</h3>
                                                    <p className="text-sm text-slate-400 flex items-center font-medium">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                                                        {room.participants + (isActive ? 1 : 0)} listening
                                                    </p>
                                                </div>
                                            </div>
                                            <button className={`p-3 text-sm font-bold rounded-2xl transition-all active:scale-90 ${isActive ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-indigo-500 hover:text-white'}`}>
                                                {isActive ? 'Leave' : 'Join'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {activeRoom && (
                                <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-full animate-pulse"><Headphones className="w-5 h-5 text-indigo-600" /></div>
                                        <span className="font-semibold text-indigo-900">You are in: <span className="font-bold">{activeRoom.name}</span></span>
                                    </div>
                                    <div className="text-xs font-mono font-bold text-indigo-500 bg-white px-3 py-1.5 rounded-lg">Tracker Active</div>
                                </div>
                            )}
                        </section>
                    )}

                    {(activeTab === 'games' || activeTab === 'night') && (
                        <section className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/50 overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <Gamepad2 className="w-6 h-6 text-emerald-400" />
                                    <h2 className="text-xl font-bold text-slate-800">Quick Games Zone</h2>
                                </div>
                            </div>
                            <div className="flex overflow-x-auto space-x-5 pb-4 no-scrollbar -mx-2 px-2 scroll-smooth">
                                {miniGames.map(game => (
                                    <div key={game.id} onClick={() => setActiveGame(game)} className="min-w-[140px] sm:min-w-[160px] group p-7 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer">
                                        <div className={`mb-4 p-4 rounded-3xl bg-slate-50 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${game.color}`}>
                                            {game.icon}
                                        </div>
                                        <h3 className="font-bold text-slate-700 mb-1 text-sm">{game.name}</h3>
                                        <span className="text-[10px] px-2 py-1 bg-slate-50 text-slate-400 font-bold rounded-lg uppercase tracking-tight">{game.type}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-2 text-center italic">Take a short mental break. Games auto-close after 5 minutes.</p>
                        </section>
                    )}

                    {activeTab === 'music' && (
                        <section className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/50 transition-all duration-500">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <Music className="w-6 h-6 text-indigo-400" />
                                    <h2 className="text-xl font-bold text-slate-800">Relaxing Soundscapes</h2>
                                </div>
                            </div>

                            <div className={`grid grid-cols-2 gap-4 ${activeSound ? 'mb-6' : ''}`}>
                                {sounds.map(sound => {
                                    const isActiveSound = activeSound?.id === sound.id;
                                    return (
                                        <div key={sound.id} onClick={() => setActiveSound(isActiveSound ? null : sound)}
                                            className={`p-4 rounded-2xl border flex flex-col cursor-pointer transition-all hover:-translate-y-1 ${isActiveSound ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-500 ring-opacity-30' : 'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-md'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`p-3 rounded-xl transition-colors ${isActiveSound ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-600'}`}>
                                                    {sound.icon}
                                                </div>
                                                {isActiveSound && (
                                                    <span className="flex h-2 w-2 relative mt-2 mr-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className={`font-bold leading-tight ${isActiveSound ? 'text-indigo-900' : 'text-slate-800'}`}>{sound.name}</h3>
                                        </div>
                                    );
                                })}
                            </div>

                            {activeSound && (
                                <div className={`p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-bottom-2 bg-slate-800 border-slate-700`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2 max-w-[80%]">
                                            <Activity className="w-5 h-5 text-indigo-400 animate-pulse shrink-0" />
                                            <span className={`text-sm font-semibold truncate text-white`}>Now Playing: {activeSound.name}</span>
                                        </div>
                                        <button onClick={() => setActiveSound(null)} className={`p-2 rounded-full transition-colors hover:bg-slate-700 text-slate-400`}>
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="relative w-full rounded-xl overflow-hidden shadow-inner flex items-center justify-center bg-black aspect-[21/9]">
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
                    )}

                    {activeTab === 'mind' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Night Reflection Mini Tool */}
                            <section className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/50">
                                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                    <Moon className="w-5 h-5 text-indigo-500" /> Night Reflection
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Today I am grateful for...</label>
                                        <input
                                            value={gratitudeText} onChange={(e) => setGratitudeText(e.target.value)}
                                            placeholder="A warm cup of coffee..."
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">General thoughts</label>
                                        <textarea
                                            value={reflectionText} onChange={(e) => setReflectionText(e.target.value)}
                                            placeholder="Write anything on your mind. Let it out." rows="3"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-medium"
                                        ></textarea>
                                    </div>
                                    <button onClick={submitReflection} className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95">
                                        Save Reflection
                                    </button>
                                </div>
                            </section>

                            <section className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/50 overflow-hidden h-full">
                                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                    <Library className="w-5 h-5 text-indigo-500" /> Past Thoughts
                                </h2>
                                <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 no-scrollbar">
                                    {reflections.length === 0 ? (
                                        <p className="text-slate-400 text-sm italic">No reflections saved yet.</p>
                                    ) : (
                                        reflections.map((ref, i) => (
                                            <div key={i} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm">
                                                <div className="text-xs font-bold text-indigo-400 mb-2">{new Date(ref.date).toLocaleDateString()}</div>
                                                {ref.gratitude && <p className="font-semibold text-slate-700 mb-1">🙏 {ref.gratitude}</p>}
                                                {ref.reflection && <p className="text-slate-500">{ref.reflection}</p>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>
                    )}


                    {/* GENERAL MICRO BREAK TIMERS (Bottom of left col) */}
                    <section className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <Clock className="w-6 h-6 text-orange-400" />
                            <h2 className="text-xl font-bold text-slate-800">Quick Micro Breaks</h2>
                        </div>

                        {timerActive ? (
                            <div className="bg-slate-800 text-white rounded-3xl p-8 flex flex-col items-center justify-center relative shadow-lg">
                                <h3 className="text-xl font-bold opacity-80 mb-6">{timerConfig.title}</h3>
                                <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-700" />
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent"
                                            className="text-emerald-500 transition-all duration-1000 ease-linear" strokeDasharray="553"
                                            strokeDashoffset={553 - (553 * (timeLeft / (timerConfig.duration * 60)))} strokeLinecap="round" />
                                    </svg>
                                    <div className="text-5xl font-black font-mono tracking-tighter tabular-nums drop-shadow-md">
                                        {formatTime(timeLeft)}
                                    </div>
                                </div>
                                <button onClick={cancelTimer} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10">
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {microBreaks.map(brk => (
                                    <div key={brk.id} onClick={() => startTimer(brk.duration, brk.name, 'timer')} className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-300 shadow-sm cursor-pointer transition-all hover:-translate-y-1 group">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-600 mb-3 mx-auto transition-colors">
                                            {brk.icon}
                                        </div>
                                        <h3 className="font-bold text-slate-700 text-center text-sm">{brk.name}</h3>
                                    </div>
                                ))}

                                {/* Mood Smart Integration Card */}
                                <div className="col-span-2 sm:col-span-4 mt-2 border-t pt-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">How are you feeling?</label>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                        {moodSuggestions.map(mood => (
                                            <button
                                                key={mood.id}
                                                onClick={() => handleMoodClick(mood)}
                                                className={`px-4 py-2 text-sm font-bold border rounded-xl shrink-0 transition-all hover:scale-105 active:scale-95 ${lastMood === mood.id ? mood.color + ' ring-2 ring-offset-1' : 'bg-white border-slate-200 text-slate-600'}`}
                                            >
                                                {mood.id}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-8">

                    {/* RELAX XP PANEL */}
                    <section className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 border border-indigo-400">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-indigo-100 text-sm uppercase tracking-widest mb-1">Relax Profile</h3>
                                <div className="text-3xl font-black">{stats.xp} <span className="text-lg text-indigo-200">XP</span></div>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner"><Trophy className="w-6 h-6 text-yellow-300" /></div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-black/20 rounded-2xl p-4 flex justify-between items-center backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-indigo-200" />
                                    <span className="font-medium text-sm">Today's Rest</span>
                                </div>
                                <span className="font-black">{stats.todayMinutes} <span className="text-xs font-medium text-indigo-200">mins</span></span>
                            </div>

                            <div className="bg-black/20 rounded-2xl p-4 flex justify-between items-center backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <Flame className="w-5 h-5 text-orange-400" />
                                    <span className="font-medium text-sm">Daily Streak</span>
                                </div>
                                <span className="font-black text-orange-400">{stats.currentStreak} <span className="text-xs font-medium text-orange-200">days</span></span>
                            </div>
                        </div>
                    </section>

                    {/* ANALYTICS DASHBOARD */}
                    <section className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-sm border border-white/50 space-y-5">
                        <div className="flex items-center space-x-3 mb-2">
                            <Activity className="w-5 h-5 text-slate-400" />
                            <h2 className="text-xl font-bold text-slate-800">Relax Analytics</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Ratio (F:R)</div>
                                <div className="text-lg font-black text-slate-700">{analytics.ratio}</div>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Top Activity</div>
                                <div className="text-md font-bold text-indigo-600 truncate">{analytics.mostUsedActivity || 'N/A'}</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Mood Frequency (7 Days)</div>
                            {Object.keys(analytics.moodFrequency).length === 0 ? (
                                <p className="text-sm italic text-slate-400">No moods logged recently.</p>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(analytics.moodFrequency).map(([mood, count]) => {
                                        const total = Object.values(analytics.moodFrequency).reduce((a, b) => a + b, 0);
                                        const pct = (count / total) * 100;
                                        return (
                                            <div key={mood}>
                                                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                                                    <span>{mood}</span><span>{count}x</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Micro-Game Modal Overlay */}
            {activeGame && (
                <GameModal
                    game={activeGame}
                    onClose={() => setActiveGame(null)}
                    onLogGame={(gameName, minsSpent, bonusXpTrackerObj) => {
                        // Normally API awards XP sequentially based on duration. 
                        // Our hook here handles special XP mapping.
                        logSession('game', minsSpent, gameName, true); // true = triggers bonus XP route logic
                    }}
                />
            )}
        </div>
    );
};

export default RelaxPage;
