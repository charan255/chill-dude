import React, { useState, useEffect, useCallback } from 'react';
import { X, Trophy, Clock, AlertCircle } from 'lucide-react';

// --- CUSTOM HOOK ---
export const useGameTimer = (maxMinutes, onComplete) => {
    const [timeLeft, setTimeLeft] = useState(maxMinutes * 60);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete(true);
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    const formatTime = () => {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return { timeLeft, formatTime };
};

// --- GAME: MEMORY QUEST ---
const MEMORY_EMOJIS = ['🌟', '🌙', '🍄', '🍀', '💎', '🔮', '🛸', '🪐'];

const MemoryQuest = ({ onComplete }) => {
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [matched, setMatched] = useState([]);
    const [moves, setMoves] = useState(0);

    useEffect(() => {
        const deck = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS]
            .sort(() => Math.random() - 0.5)
            .map((emoji, idx) => ({ id: idx, emoji }));
        setCards(deck);
    }, []);

    const handleFlip = (idx) => {
        if (flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return;
        const newFlipped = [...flipped, idx];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
                const newMatched = [...matched, ...newFlipped];
                setMatched(newMatched);
                setFlipped([]);
                if (newMatched.length === cards.length) {
                    setTimeout(() => onComplete(5), 500); // Wait briefly then win
                }
            } else {
                setTimeout(() => setFlipped([]), 800);
            }
        }
    };

    if (matched.length === 16 && cards.length > 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center animate-in zoom-in">
                <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
                <h3 className="text-2xl font-bold text-slate-800">Quest Complete!</h3>
                <span className="text-slate-500">Took you {moves} moves. +5 XP awarded.</span>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">
                <span>Moves: {moves}</span>
                <span>Pairs: {matched.length / 2} / 8</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
                {cards.map((card, idx) => {
                    const isFlipped = flipped.includes(idx) || matched.includes(idx);
                    return (
                        <button
                            key={card.id}
                            onClick={() => handleFlip(idx)}
                            className={`aspect-square text-3xl flex items-center justify-center rounded-xl shadow-sm transition-all duration-300 transform ${isFlipped ? 'bg-indigo-50 border-2 border-indigo-200 rotate-y-180' : 'bg-slate-100 hover:bg-slate-200 active:scale-95'}`}
                        >
                            {isFlipped ? card.emoji : '?'}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

// --- GAME: SPACE WORD ---
const WORDS = ['RELAX', 'BREATHE', 'PEACE', 'CALM', 'OASIS'];

const SpaceWord = ({ onComplete }) => {
    const [wordIndex, setWordIndex] = useState(0);
    const [scrambled, setScrambled] = useState('');
    const [input, setInput] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    const [status, setStatus] = useState(null); // 'correct' | 'wrong'

    const initWord = useCallback(() => {
        if (wordIndex >= WORDS.length) return;
        const w = WORDS[wordIndex];
        let scr = w.split('').sort(() => Math.random() - 0.5).join('');
        while (scr === w) scr = w.split('').sort(() => Math.random() - 0.5).join('');
        setScrambled(scr);
    }, [wordIndex]);

    useEffect(() => { initWord(); }, [initWord]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const word = WORDS[wordIndex];
        if (input.toUpperCase() === word) {
            setStatus('correct');
            setCorrectCount(c => c + 1);
        } else {
            setStatus('wrong');
        }

        setTimeout(() => {
            setInput('');
            setStatus(null);
            if (wordIndex + 1 >= WORDS.length) {
                const finalCorrect = input.toUpperCase() === word ? correctCount + 1 : correctCount;
                onComplete(finalCorrect >= 3 ? 3 : 1); // 3 XP if mostly right
            } else {
                setWordIndex(i => i + 1);
            }
        }, 1000);
    };

    if (wordIndex >= WORDS.length) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in">
                <Trophy className={`w-16 h-16 ${correctCount >= 3 ? 'text-yellow-500' : 'text-slate-400'} mb-4`} />
                <h3 className="text-2xl font-bold text-slate-800">Scramble Finished!</h3>
                <span className="text-slate-500">Correct: {correctCount} / 5</span>
            </div>
        );
    }

    return (
        <div className="p-6 flex flex-col items-center">
            <div className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">
                Word {wordIndex + 1} of 5
            </div>

            <div className="text-4xl font-mono font-black tracking-[0.3em] text-indigo-900 mb-8 w-full text-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                {scrambled}
            </div>

            <form onSubmit={handleSubmit} className="w-full flex gap-3">
                <input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value.toUpperCase())}
                    className={`flex-1 border-2 text-xl font-bold font-mono tracking-widest text-center px-4 py-3 rounded-xl focus:outline-none focus:ring-4 transition-all uppercase ${status === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : status === 'wrong' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'}`}
                    placeholder="Unscramble"
                    disabled={status !== null}
                />
            </form>
        </div>
    );
};

// --- GAME: REACTION TAP ---
const ReactionTap = ({ onComplete }) => {
    const [state, setState] = useState('waiting'); // waiting, ready, done
    const [time, setTime] = useState(0);
    const [startTime, setStartTime] = useState(0);

    const startRun = () => {
        setState('waiting');
        setTime(0);
        const delay = Math.random() * 2000 + 1000;
        setTimeout(() => {
            setState('ready');
            setStartTime(Date.now());
        }, delay);
    };

    const handleTap = () => {
        if (state === 'waiting') {
            alert("Too early! Wait for Green.");
            startRun();
        } else if (state === 'ready') {
            setTime(Date.now() - startTime);
            setState('done');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 h-72">
            {state === 'done' ? (
                <div className="text-center animate-in zoom-in">
                    <div className="text-5xl font-black font-mono tracking-tighter text-indigo-600 mb-2">{time}ms</div>
                    <p className="text-slate-500 font-medium mb-6">Excellent reflex!</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={startRun} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Try Again</button>
                        <button onClick={() => onComplete(2)} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-md">Claim 2 XP</button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={state === 'waiting' ? undefined : handleTap}
                    onMouseDown={state === 'waiting' ? handleTap : undefined} // catch early clicks
                    className={`w-48 h-48 rounded-full shadow-lg transition-colors flex items-center justify-center text-white font-bold text-2xl tracking-wide ${state === 'waiting' ? 'bg-rose-500 cursor-not-allowed cursor-wait' : 'bg-emerald-500 active:scale-95 cursor-pointer'}`}
                >
                    {state === 'waiting' ? 'Wait...' : 'TAP NOW!'}
                </button>
            )}

            {state === 'waiting' && time === 0 && (
                <button onClick={startRun} className="mt-8 px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">Start Exercise</button>
            )}
        </div>
    );
};

// --- GAME: MINI SUDOKU ---
// Pre-defined simple 4x4 matrix
const SUDOKU_SOLUTION = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1]
];

// Pre-defined holes
const INITIAL_GRID = [
    [1, 0, 3, 0],
    [0, 4, 0, 2],
    [2, 0, 0, 3],
    [0, 3, 2, 0]
];

const MiniSudoku = ({ onComplete }) => {
    const [grid, setGrid] = useState(INITIAL_GRID.map(row => [...row]));
    const [error, setError] = useState(false);

    const handleChange = (r, c, val) => {
        if (INITIAL_GRID[r][c] !== 0) return; // locked
        const num = val === '' ? 0 : parseInt(val, 10);
        if (isNaN(num) || num < 0 || num > 4) return;

        const newGrid = grid.map(row => [...row]);
        newGrid[r][c] = num;
        setGrid(newGrid);
        setError(false);
    };

    const checkWin = () => {
        let isFull = true;
        let isCorrect = true;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (grid[r][c] === 0) isFull = false;
                if (grid[r][c] !== SUDOKU_SOLUTION[r][c]) {
                    isCorrect = false;
                }
            }
        }

        if (!isFull) return;

        if (isCorrect) {
            onComplete(5); // 5 XP
        } else {
            setError(true);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 h-full">
            <div className="bg-slate-900 p-2 rounded-2xl shadow-lg mb-6">
                <div className="grid grid-cols-4 gap-[2px] bg-slate-700 border-4 border-slate-900 rounded-xl overflow-hidden">
                    {grid.map((row, r) => row.map((val, c) => {
                        const isLocked = INITIAL_GRID[r][c] !== 0;
                        return (
                            <input
                                key={`${r}-${c}`}
                                type="text"
                                value={val === 0 ? '' : val}
                                onChange={(e) => handleChange(r, c, e.target.value)}
                                onBlur={checkWin}
                                readOnly={isLocked}
                                className={`w-14 h-14 text-center text-xl font-bold focus:outline-none focus:bg-indigo-100 transition-colors ${isLocked ? 'bg-slate-200 text-slate-500' : 'bg-white text-indigo-700'} ${(r === 1 || r === 3) && c < 4 ? 'border-b-2 border-slate-300' : ''} ${(c === 1 || c === 3) && r < 4 ? 'border-r-2 border-slate-300' : ''}`}
                            />
                        )
                    }))}
                </div>
            </div>

            {error && <div className="text-rose-500 font-bold text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Incorrect cell detected.</div>}
            <p className="text-xs text-slate-400 font-medium">Auto-validates when board is full.</p>
        </div>
    );
};

// --- MODAL CONTAINER ---
export const GameModal = ({ game, onClose, onLogGame }) => {
    // 5 Min Max Timer
    const { formatTime } = useGameTimer(5, (isTimeout) => {
        if (isTimeout) {
            // Give 1 generic XP and logs partial
            onLogGame(game.name, 5, 1);
            onClose();
        }
    });

    const handleComplete = (earnedXp) => {
        // Assume finishing usually takes ~2 minutes for logging, 
        // Or we can just log a base amount.
        onLogGame(game.name, 2, earnedXp);
        onClose();
    };

    const renderGame = () => {
        switch (game.id) {
            case 'memory': return <MemoryQuest onComplete={handleComplete} />;
            case 'word': return <SpaceWord onComplete={handleComplete} />;
            case 'reaction': return <ReactionTap onComplete={handleComplete} />;
            case 'sudoku': return <MiniSudoku onComplete={handleComplete} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in-95 duration-200 flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-slate-100 ${game.color}`}>{game.icon}</div>
                        <div>
                            <h2 className="font-bold text-slate-800 leading-tight">{game.name}</h2>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{game.type}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-mono font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime()}
                        </div>
                        <button onClick={() => { onLogGame(game.name, 1, 0); onClose(); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-8 relative min-h-[360px]">
                    {renderGame()}
                </div>
            </div>
        </div>
    );
};
