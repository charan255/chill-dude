import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Send, Zap, Coffee, Book, User, Moon, Battery, Brain, Activity, TrendingUp, Sparkles, ChevronDown } from 'lucide-react';

const mockChartData = [
    { day: 'Mon', mood: 4 },
    { day: 'Tue', mood: 3 },
    { day: 'Wed', mood: 5 },
    { day: 'Thu', mood: 2 },
    { day: 'Fri', mood: 4 },
    { day: 'Sat', mood: 3 },
    { day: 'Sun', mood: 2 },
];

import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { DynamicMoodAnalysis } from '../components/DynamicMoodAnalysis';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { text: "Hey… how was your day?", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [userMsgCount, setUserMsgCount] = useState(0);
    const [journalEntries, setJournalEntries] = useState([]);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input;
        const newMessages = [...messages, { text: userText, sender: 'user' }];
        setMessages(newMessages);
        setInput('');
        const newCount = userMsgCount + 1;
        setUserMsgCount(newCount);

        try {
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
            } else {
                setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting to my brain right now.", sender: 'bot' }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { text: "Network error. Please try again.", sender: 'bot' }]);
        }
    };

    const handleEndChat = async () => {
        if (messages.length === 0) return;

        // Convert messages to the format expected by the backend
        const formattedMessages = messages.map(msg => ({
            role: msg.sender,
            text: msg.text
        }));

        try {
            const response = await fetch('/api/chat/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: formattedMessages })
            });

            if (response.ok) {
                const entry = await response.json();
                setJournalEntries(prev => [...prev, entry.summary]);
                // Clear chat after saving
                setMessages([{ text: "Session saved to journal. How else can I help you?", sender: 'bot' }]);
                setUserMsgCount(0);
            }
        } catch (error) {
            console.error("End chat error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Logo />
                    <p className="text-blue-500/70 mt-1 pl-1">Welcome back, Human.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/journal')}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-blue-50 text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-colors font-semibold active:scale-95"
                    >
                        <Book size={18} />
                        <span className="hidden sm:inline">Journal</span>
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-blue-50 hover:bg-blue-50 hover:border-blue-100 transition-colors active:scale-95"
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <User size={20} />
                        </div>
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left Side: Mood Analysis */}
                <div className="space-y-6 flex flex-col">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-blue-50 flex-1 flex flex-col">

                        <DynamicMoodAnalysis />

                        {/* Mini Insight Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50 text-center transition-colors hover:bg-slate-100">
                                <TrendingUp className="w-5 h-5 text-rose-400 mx-auto mb-1.5" />
                                <div className="text-xs text-slate-500 font-medium mb-0.5">Stress</div>
                                <div className="text-sm font-bold text-slate-700">+12%</div>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50 text-center transition-colors hover:bg-slate-100">
                                <Moon className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
                                <div className="text-xs text-slate-500 font-medium mb-0.5">Sleep Qual.</div>
                                <div className="text-sm font-bold text-slate-700">Poor</div>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50 text-center transition-colors hover:bg-slate-100">
                                <Activity className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                                <div className="text-xs text-slate-500 font-medium mb-0.5">Productivity</div>
                                <div className="text-sm font-bold text-slate-700">Good</div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-blue-900 tracking-tight">Weekly Mood Trend</h3>
                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Last 7 Days</span>
                            </div>
                            <div className="h-64 w-full pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} domain={[0, 5]} hide />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', backgroundColor: '#ffffff' }}
                                            formatter={(value) => [`${value} / 5`, 'Mood Score']}
                                            labelStyle={{ color: '#0F172A', fontWeight: 'bold', marginBottom: '4px' }}
                                            itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="mood"
                                            stroke="#3B82F6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorMood)"
                                            activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                                            dot={(props) => {
                                                const { cx, cy, payload } = props;
                                                // Highlight Today (e.g., 'Thu')
                                                if (payload.day === 'Thu') {
                                                    return (
                                                        <circle cx={cx} cy={cy} r={6} fill="#3B82F6" stroke="#fff" strokeWidth={2} key={`dot-${payload.day}`} className="animate-pulse" />
                                                    );
                                                }
                                                return <circle cx={cx} cy={cy} r={4} fill="#93C5FD" stroke="none" key={`dot-${payload.day}`} />;
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* AI Insight Below Graph */}
                            <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl flex items-start gap-4 border border-blue-100/50 transition-colors hover:bg-blue-50/80">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <p className="text-sm text-blue-900/80 font-medium leading-relaxed">
                                    Your mood improves mid-week but dips after low sleep days. Consider a relaxed evening today to recharge.
                                </p>
                            </div>
                        </div>

                        {/* SECTION: Recommended Mode (Redesigned) */}
                        <div className="mt-8">
                            <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] rounded-[2rem] p-6 sm:p-8 border border-indigo-100/50 relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
                                {/* Decorative Large Icon Background */}
                                <div className="absolute -right-6 -top-6 text-indigo-300/30 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 pointer-events-none">
                                    <Coffee size={140} strokeWidth={1.5} />
                                </div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-3 py-1.5 bg-white/60 backdrop-blur-sm shadow-sm rounded-full text-indigo-600 text-xs font-bold tracking-wide uppercase border border-indigo-100">
                                            AI Recommendation
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                            <Coffee size={24} className="animate-pulse" />
                                        </div>
                                        <h4 className="text-2xl font-black text-indigo-950 tracking-tight">Relax Mode</h4>
                                    </div>

                                    <p className="text-indigo-900/70 text-sm mb-8 max-w-[85%] font-medium leading-relaxed">
                                        Based on <strong className="text-indigo-900 border-b border-indigo-200">high stress</strong> and <strong className="text-indigo-900 border-b border-indigo-200">low sleep</strong>, we highly suggest taking a break.
                                    </p>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
                                        <button
                                            onClick={() => navigate('/relax')}
                                            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                            <span className="relative z-10">Start Relaxing</span>
                                        </button>
                                        <button className="text-sm font-bold text-indigo-500 flex items-center justify-center gap-1.5 hover:text-indigo-700 transition-colors bg-white/40 hover:bg-white/60 px-4 py-2 rounded-xl backdrop-blur-sm">
                                            Why this? <ChevronDown size={14} className="mt-0.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Chatbot Panel */}
                <div className="flex flex-col space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-blue-50 flex flex-col flex-1 overflow-hidden min-h-[500px]">
                        <div className="p-6 border-b border-blue-50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                                <h2 className="font-semibold text-blue-900">Buddy Bot</h2>
                            </div>
                            <button
                                onClick={handleEndChat}
                                disabled={messages.length === 0}
                                className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                End Chat & Save
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-5 py-3 rounded-2xl ${msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-blue-50 text-blue-900 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {userMsgCount >= 3 && journalEntries.length > 0 && (
                                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-yellow-800 text-sm italic shadow-inner animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Book size={14} />
                                        <span className="font-bold">Mood Summary</span>
                                    </div>
                                    {journalEntries[journalEntries.length - 1]}
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSend} className="p-6 border-t border-blue-50">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full pl-6 pr-14 py-4 bg-blue-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-blue-900 placeholder-blue-300 transition-all"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Journal Section Preview */}
                    {journalEntries.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-50 animate-in fade-in duration-700">
                            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                                <Book size={16} />
                                <span>Recent Journal</span>
                            </h3>
                            <div className="space-y-3">
                                {journalEntries.slice(-2).reverse().map((entry, idx) => (
                                    <div key={idx} className="p-3 bg-blue-50/50 rounded-xl text-sm text-blue-800 border-l-4 border-blue-400">
                                        {entry}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <button
                    onClick={() => navigate('/focus')}
                    className="flex items-center justify-center space-x-4 py-8 bg-red-500 text-white rounded-3xl text-3xl font-bold shadow-2xl shadow-red-200 hover:bg-red-600 hover:-translate-y-2 transition-all active:scale-95 group"
                >
                    <Zap size={40} className="group-hover:animate-pulse" />
                    <span>FOCUS</span>
                </button>
                <button
                    onClick={() => navigate('/relax')}
                    className="flex items-center justify-center space-x-4 py-8 bg-blue-600 text-white rounded-3xl text-3xl font-bold shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-2 transition-all active:scale-95 group relative overflow-hidden border-4 border-blue-400"
                >
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                    <Coffee size={40} className="group-hover:rotate-12 transition-transform" />
                    <span>RELAX</span>
                    <div className="absolute top-4 right-8 bg-white text-blue-600 text-xs px-3 py-1 rounded-full font-black tracking-tighter shadow-sm animate-bounce">
                        RECOMMENDED
                    </div>
                </button>
            </div>
        </div>
    );
};

export default DashboardPage;
