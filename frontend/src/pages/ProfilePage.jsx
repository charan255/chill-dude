import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User as UserIcon, Mail, Phone, BookOpen, GraduationCap,
    Upload, Calendar, Plus, Heart, Activity, AlertCircle, Trash2, Check, Smartphone, Moon, Loader, Edit2, X, ChevronDown, ChevronUp
} from 'lucide-react';
import Logo from '../components/Logo';

const ProfilePage = () => {
    const navigate = useNavigate();

    // Profile Data State
    const [profileData, setProfileData] = useState({
        fullName: '',
        email: '',
        course: '',
        yearOfStudy: '',
        collegeName: ''
    });

    // Academic Data States
    const [subjects, setSubjects] = useState([]);
    const [timetable, setTimetable] = useState([]);

    // Form Input States
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newAssignment, setNewAssignment] = useState({ subjectId: '', title: '', dueDate: '' });
    const [newTimetable, setNewTimetable] = useState({ dayOfWeek: 'Monday', subjectName: '', startTime: '', endTime: '' });

    // Editing States
    const [editingTimetable, setEditingTimetable] = useState(null);
    const [editingTimetableData, setEditingTimetableData] = useState({});

    const [editingSubject, setEditingSubject] = useState(null);
    const [editingSubjectName, setEditingSubjectName] = useState('');

    const [editingAssignment, setEditingAssignment] = useState(null);
    const [editingAssignmentData, setEditingAssignmentData] = useState({});

    // Syllabus UI States
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [newChapterTitles, setNewChapterTitles] = useState({});
    const [chapterHours, setChapterHours] = useState({}); // Local state for estimated hours

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);

    // Mock states for UI interactivity
    const [allowCrisisAlerts, setAllowCrisisAlerts] = useState(true);
    const [enableHealthMood, setEnableHealthMood] = useState(true);
    const [contacts, setContacts] = useState([
        { id: 1, name: 'Mom', phone: '+1 234 567 8900', relation: 'Parent' },
        { id: 2, name: 'Alex', phone: '+1 987 654 3210', relation: 'Friend' }
    ]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [profRes, subRes, timeRes] = await Promise.all([
                    fetch('/api/profile'),
                    fetch('/api/subjects'),
                    fetch('/api/timetable')
                ]);

                if (profRes.ok) {
                    const data = await profRes.json();
                    setProfileData({
                        fullName: data.fullName || '',
                        email: data.email || '',
                        course: data.course || '',
                        yearOfStudy: data.yearOfStudy || '',
                        collegeName: data.collegeName || ''
                    });
                }

                if (subRes.ok) {
                    setSubjects(await subRes.json());
                }

                if (timeRes.ok) {
                    setTimetable(await timeRes.json());
                }
            } catch (error) {
                console.error("Failed to fetch initial profile data:", error);
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchAllData();
    }, []);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });

            if (response.ok) {
                const updatedData = await response.json();
                setProfileData({
                    fullName: updatedData.fullName || '',
                    email: updatedData.email || '',
                    course: updatedData.course || '',
                    yearOfStudy: updatedData.yearOfStudy || '',
                    collegeName: updatedData.collegeName || ''
                });
            } else {
                console.error("Failed to save profile.");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setSavingProfile(false);
        }
    };

    // --- Action Handlers ---
    const reloadData = async () => {
        try {
            const [subRes, timeRes] = await Promise.all([
                fetch('/api/subjects'),
                fetch('/api/timetable')
            ]);
            if (subRes.ok) setSubjects(await subRes.json());
            if (timeRes.ok) setTimetable(await timeRes.json());
        } catch (error) { console.error('Error reloading:', error); }
    };

    const handleDeleteTimetable = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/timetable/${id}`, { method: 'DELETE' });
            if (res.ok) reloadData();
        } catch (error) { console.error('Error deleting timetable:', error); }
    };

    const handleEditTimetableSave = async (id) => {
        try {
            const payload = {
                day: editingTimetableData.day,
                subject: editingTimetableData.subject,
                startTime: editingTimetableData.startTime,
                endTime: editingTimetableData.endTime
            };
            const res = await fetch(`http://localhost:5000/api/timetable/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setEditingTimetable(null);
                reloadData();
            } else {
                console.error("Failed to update timetable entry API response:", res.status);
            }
        } catch (error) {
            console.error('Error updating timetable:', error);
        }
    };

    const handleDeleteSubject = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/subjects/${id}`, { method: 'DELETE' });
            if (res.ok) reloadData();
        } catch (error) { console.error('Error deleting subject:', error); }
    };

    const handleEditSubjectSave = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/subjects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingSubjectName })
            });
            if (res.ok) {
                setEditingSubject(null);
                reloadData();
            } else {
                console.error("Failed to update subject API response:", res.status);
            }
        } catch (error) {
            console.error('Error updating subject:', error);
        }
    };

    const handleToggleChapter = async (id, currentStatus) => {
        try {
            const res = await fetch(`/api/chapters/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus })
            });
            if (res.ok) reloadData();
        } catch (error) { console.error('Error toggling chapter:', error); }
    };
    const handleDeleteChapter = async (id) => {
        try {
            const res = await fetch(`/api/chapters/${id}`, { method: 'DELETE' });
            if (res.ok) reloadData();
        } catch (error) { console.error('Error deleting chapter:', error); }
    };

    const handleDeleteAssignment = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/assignments/${id}`, { method: 'DELETE' });
            if (res.ok) reloadData();
        } catch (error) { console.error('Error deleting assignment:', error); }
    };

    const handleEditAssignmentSave = async (id) => {
        try {
            const payload = {
                title: editingAssignmentData.title,
                dueDate: editingAssignmentData.dueDate
            };
            const res = await fetch(`http://localhost:5000/api/assignments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setEditingAssignment(null);
                reloadData();
            } else {
                console.error("Failed to update assignment API response:", res.status);
            }
        } catch (error) {
            console.error('Error updating assignment:', error);
        }
    };
    const handleToggleAssignmentComplete = async (id, currentStatus) => {
        try {
            const res = await fetch(`/api/assignments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus })
            });
            if (res.ok) reloadData();
        } catch (error) { console.error('Error toggling assignment:', error); }
    };

    const handleAddSubject = async () => {
        if (!newSubjectName.trim()) return;
        try {
            const res = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newSubjectName })
            });
            if (res.ok) {
                // Refresh Subjects
                const updatedRes = await fetch('/api/subjects');
                setSubjects(await updatedRes.json());
                setNewSubjectName('');
            }
        } catch (error) {
            console.error('Error adding subject:', error);
        }
    };

    const toggleSubjectExpansion = (id) => {
        setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddChapter = async (subjectId) => {
        const title = newChapterTitles[subjectId];
        if (!title || !title.trim()) return;
        try {
            const res = await fetch(`/api/subjects/${subjectId}/chapters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            if (res.ok) {
                const updatedRes = await fetch('/api/subjects');
                setSubjects(await updatedRes.json());
                setNewChapterTitles(prev => ({ ...prev, [subjectId]: '' }));
            }
        } catch (error) { console.error('Error adding chapter:', error); }
    };

    const handleAddAssignment = async () => {
        if (!newAssignment.subjectId || !newAssignment.title || !newAssignment.dueDate) return;
        try {
            const res = await fetch(`/api/subjects/${newAssignment.subjectId}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newAssignment.title, dueDate: newAssignment.dueDate })
            });
            if (res.ok) {
                // Refresh Subjects to get updated nested assignments
                const updatedRes = await fetch('/api/subjects');
                setSubjects(await updatedRes.json());
                setNewAssignment({ subjectId: '', title: '', dueDate: '' });
            }
        } catch (error) {
            console.error('Error adding assignment:', error);
        }
    };

    const handleAddTimetable = async () => {
        if (!newTimetable.subjectName || !newTimetable.startTime || !newTimetable.endTime) return;
        try {
            const res = await fetch('/api/timetable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTimetable)
            });
            if (res.ok) {
                // Refresh Timetable
                const updatedRes = await fetch('/api/timetable');
                setTimetable(await updatedRes.json());
                setNewTimetable({ dayOfWeek: 'Monday', subjectName: '', startTime: '', endTime: '' });
            }
        } catch (error) {
            console.error('Error adding timetable entry:', error);
        }
    };

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 md:p-8 pt-20 md:pt-24 font-sans text-slate-800">
            {/* Logo */}
            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
                <Logo />
            </div>

            {/* Header */}
            <div className="max-w-4xl mx-auto mb-10 flex items-center relative">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-3 rounded-full bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95 absolute left-0"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </button>
                <div className="text-center w-full">
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tight font-serif mb-2">Profile & Settings</h1>
                    <p className="text-slate-500">Manage your personalized experience.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">

                {/* 1) PERSONAL INFORMATION */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative">
                    {loadingProfile && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl">
                            <Loader className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    )}
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <UserIcon className="w-6 h-6 text-blue-500" />
                        Personal Information
                    </h2>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Profile Photo Upload */}
                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <div className="w-32 h-32 rounded-full bg-blue-50 border-4 border-white shadow-md flex items-center justify-center relative overflow-hidden group border-dashed border-blue-200">
                                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-blue-600" />
                                </div>
                                <UserIcon className="w-16 h-16 text-blue-200" />
                            </div>
                            <button className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                                Upload Photo
                            </button>
                        </div>

                        {/* Fields */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                                <input name="fullName" type="text" value={profileData.fullName} onChange={handleProfileChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                                <input name="email" type="email" value={profileData.email} onChange={handleProfileChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Course / Branch</label>
                                <input name="course" type="text" value={profileData.course} onChange={handleProfileChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Year of Study</label>
                                <input name="yearOfStudy" type="text" value={profileData.yearOfStudy} onChange={handleProfileChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">College Name</label>
                                <input name="collegeName" type="text" value={profileData.collegeName} onChange={handleProfileChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2) ACADEMIC SETUP */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <GraduationCap className="w-6 h-6 text-indigo-500" />
                            Academic Setup
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-6 font-medium">This information helps generate your personalized focus plan.</p>

                    <div className="space-y-6">
                        {/* A) Timetable Setup */}
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Timetable Setup</h3>
                            <div className="space-y-3">
                                {timetable.map((entry) => (
                                    <div key={entry.id} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100">
                                        {editingTimetable === entry.id ? (
                                            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                                <select
                                                    value={editingTimetableData.day}
                                                    onChange={e => setEditingTimetableData({ ...editingTimetableData, day: e.target.value })}
                                                    className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none"
                                                >
                                                    <option value="Monday">Monday</option>
                                                    <option value="Tuesday">Tuesday</option>
                                                    <option value="Wednesday">Wednesday</option>
                                                    <option value="Thursday">Thursday</option>
                                                    <option value="Friday">Friday</option>
                                                    <option value="Saturday">Saturday</option>
                                                    <option value="Sunday">Sunday</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={editingTimetableData.subject}
                                                    onChange={e => setEditingTimetableData({ ...editingTimetableData, subject: e.target.value })}
                                                    className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none"
                                                />
                                                <input
                                                    type="time"
                                                    value={editingTimetableData.startTime}
                                                    onChange={e => setEditingTimetableData({ ...editingTimetableData, startTime: e.target.value })}
                                                    className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none"
                                                />
                                                <input
                                                    type="time"
                                                    value={editingTimetableData.endTime}
                                                    onChange={e => setEditingTimetableData({ ...editingTimetableData, endTime: e.target.value })}
                                                    className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-800">{entry.subjectName}</div>
                                                <div className="text-xs text-slate-500 mt-1">{entry.dayOfWeek} • {entry.startTime} - {entry.endTime}</div>
                                            </div>
                                        )}

                                        <div className="flex gap-1 shrink-0">
                                            {editingTimetable === entry.id ? (
                                                <>
                                                    <button onClick={() => handleEditTimetableSave(entry.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingTimetable(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => {
                                                        setEditingTimetable(entry.id);
                                                        setEditingTimetableData({ day: entry.dayOfWeek, subject: entry.subjectName, startTime: entry.startTime, endTime: entry.endTime });
                                                    }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteTimetable(entry.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="flex flex-col sm:flex-row gap-3 items-center mt-4">
                                    <select
                                        value={newTimetable.dayOfWeek}
                                        onChange={(e) => setNewTimetable({ ...newTimetable, dayOfWeek: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none w-full sm:w-40 text-sm"
                                    >
                                        <option value="Monday">Monday</option>
                                        <option value="Tuesday">Tuesday</option>
                                        <option value="Wednesday">Wednesday</option>
                                        <option value="Thursday">Thursday</option>
                                        <option value="Friday">Friday</option>
                                        <option value="Saturday">Saturday</option>
                                        <option value="Sunday">Sunday</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Class / Subject"
                                        value={newTimetable.subjectName}
                                        onChange={(e) => setNewTimetable({ ...newTimetable, subjectName: e.target.value })}
                                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm w-full"
                                    />
                                    <input
                                        type="time"
                                        value={newTimetable.startTime}
                                        onChange={(e) => setNewTimetable({ ...newTimetable, startTime: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm w-full sm:w-auto"
                                    />
                                    <input
                                        type="time"
                                        value={newTimetable.endTime}
                                        onChange={(e) => setNewTimetable({ ...newTimetable, endTime: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm w-full sm:w-auto"
                                    />
                                </div>
                                <button onClick={handleAddTimetable} className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100/50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                    <Plus className="w-4 h-4" /> Add Timetable
                                </button>
                            </div>
                        </div>

                        {/* B) Syllabus Setup */}
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Syllabus Setup</h3>
                            <div className="space-y-3">
                                {subjects.map((subject) => {
                                    const totalChapters = subject.chapters?.length || 0;
                                    const completedChapters = subject.chapters?.filter(c => c.completed).length || 0;
                                    const remainingChapters = totalChapters - completedChapters;

                                    // Calculate total remaining estimated hours
                                    const estimatedRemainingHours = subject.chapters?.filter(c => !c.completed)
                                        .reduce((sum, c) => sum + (chapterHours[c.id] || 2), 0) || 0;

                                    return (
                                        <div key={subject.id} className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-slate-100 transition-all hover:border-slate-200 shadow-sm">
                                            {/* Collapsed Header */}
                                            <div
                                                className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-2 rounded-lg -mx-2 -mt-2 transition-colors"
                                                onClick={() => toggleSubjectExpansion(subject.id)}
                                            >
                                                <div className="flex-1">
                                                    {editingSubject === subject.id ? (
                                                        <input
                                                            type="text"
                                                            value={editingSubjectName}
                                                            onChange={e => setEditingSubjectName(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold mb-1 focus:outline-none"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                                                            {expandedSubjects[subject.id] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                            {subject.name}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-slate-500 mt-1 pl-6 font-medium">
                                                        {completedChapters} of {totalChapters} Chapters Completed
                                                    </div>
                                                </div>

                                                <div className="w-24 sm:w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${subject.completionPercentage || 0}%` }}></div>
                                                </div>

                                                <div className="flex gap-1 shrink-0 px-2">
                                                    {editingSubject === subject.id ? (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); handleEditSubjectSave(subject.id); }} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Check className="w-4 h-4" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); setEditingSubject(null); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingSubject(subject.id);
                                                                setEditingSubjectName(subject.name);
                                                            }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expanded Chapters View */}
                                            {expandedSubjects[subject.id] && (
                                                <div className="mt-2 pt-3 border-t border-slate-100">
                                                    {/* Stats Block */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100 hidden sm:grid">
                                                        <div className="text-center">
                                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</div>
                                                            <div className="text-lg font-black text-slate-700">{totalChapters}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</div>
                                                            <div className="text-lg font-black text-emerald-600">{completedChapters}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining</div>
                                                            <div className="text-lg font-black text-rose-500">{remainingChapters}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Hours</div>
                                                            <div className="text-lg font-black text-indigo-500">{estimatedRemainingHours}<span className="text-xs ml-1 font-semibold text-indigo-400">hr</span></div>
                                                        </div>
                                                    </div>

                                                    {/* Chapter List */}
                                                    <div className="space-y-2 mb-3">
                                                        {subject.chapters?.map(chapter => (
                                                            <div key={chapter.id} className="flex items-center gap-3 group p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                                                                <button
                                                                    onClick={() => handleToggleChapter(chapter.id, chapter.completed)}
                                                                    className={`p-1.5 rounded flex items-center justify-center shrink-0 border transition-colors ${chapter.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-slate-300 text-transparent hover:border-emerald-400 bg-white'}`}
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <span className={`text-sm flex-1 font-medium transition-colors ${chapter.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                                    {chapter.title}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-md px-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={chapterHours[chapter.id] || 2}
                                                                            onChange={(e) => setChapterHours(prev => ({ ...prev, [chapter.id]: parseInt(e.target.value) || 0 }))}
                                                                            className="w-10 py-1 text-xs font-bold text-slate-600 text-center outline-none"
                                                                        />
                                                                        <span className="text-xs text-slate-400 font-medium select-none pr-1">hr</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleDeleteChapter(chapter.id)}
                                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 md:group-hover:opacity-100 transition-all"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {(!subject.chapters || subject.chapters.length === 0) && (
                                                            <div className="text-center py-4 text-sm text-slate-400 italic">No chapters added yet.</div>
                                                        )}
                                                    </div>

                                                    {/* Add Chapter Row */}
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="New Chapter Title"
                                                            value={newChapterTitles[subject.id] || ''}
                                                            onChange={(e) => setNewChapterTitles(prev => ({ ...prev, [subject.id]: e.target.value }))}
                                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none text-sm transition-all focus:border-indigo-400"
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddChapter(subject.id)}
                                                        />
                                                        <button
                                                            onClick={() => handleAddChapter(subject.id)}
                                                            disabled={!newChapterTitles[subject.id]?.trim()}
                                                            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Add Row
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <div className="flex items-center gap-3 mt-4">
                                    <input
                                        type="text"
                                        placeholder="New Subject Name"
                                        value={newSubjectName}
                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm"
                                    />
                                </div>
                                <button onClick={handleAddSubject} className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100/50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                    <Plus className="w-4 h-4" /> Add Subject
                                </button>
                            </div>
                        </div>

                        {/* C) Assignments Manager */}
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Assignments Manager</h3>
                            <div className="space-y-3">
                                {subjects.flatMap(s => s.assignments?.map(a => ({ ...a, subjectName: s.name, subjectId: s.id })) || []).map((assignment) => (
                                    <div key={assignment.id} className="flex flex-col sm:flex-row gap-2 items-center p-3 bg-white rounded-xl border border-slate-100 text-left">
                                        {editingAssignment === assignment.id ? (
                                            <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
                                                <input
                                                    type="text"
                                                    value={editingAssignmentData.title}
                                                    onChange={e => setEditingAssignmentData({ ...editingAssignmentData, title: e.target.value })}
                                                    className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none"
                                                />
                                                <input
                                                    type="date"
                                                    value={editingAssignmentData.dueDate}
                                                    onChange={e => setEditingAssignmentData({ ...editingAssignmentData, dueDate: e.target.value })}
                                                    className="w-full sm:w-auto px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none"
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="px-3 py-1 bg-slate-100 rounded-lg text-sm text-slate-600 font-medium whitespace-nowrap">
                                                    {assignment.subjectName}
                                                </div>
                                                <div className="flex-1 font-semibold text-slate-800 text-sm line-clamp-1">
                                                    {assignment.title}
                                                </div>
                                                <div className="text-sm text-slate-500 border border-slate-200 rounded-lg px-3 py-1 bg-slate-50 whitespace-nowrap">
                                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                </div>
                                                <button
                                                    onClick={() => handleToggleAssignmentComplete(assignment.id, assignment.completed)}
                                                    className={`p-1.5 rounded-full border shrink-0 transition-colors ${assignment.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-400'}`}
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}

                                        <div className="flex gap-1 shrink-0 sm:ml-auto">
                                            {editingAssignment === assignment.id ? (
                                                <>
                                                    <button onClick={() => handleEditAssignmentSave(assignment.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingAssignment(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => {
                                                        setEditingAssignment(assignment.id);
                                                        setEditingAssignmentData({ title: assignment.title, dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '' });
                                                    }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteAssignment(assignment.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="flex flex-col sm:flex-row gap-3 items-center mt-4">
                                    <select
                                        value={newAssignment.subjectId}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none w-full sm:w-40 text-sm"
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(subject => (
                                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Assignment Title"
                                        value={newAssignment.title}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm w-full"
                                    />
                                    <input
                                        type="date"
                                        value={newAssignment.dueDate}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                        className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm w-full sm:w-auto"
                                    />
                                </div>
                                <button onClick={handleAddAssignment} className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100/50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                    <Plus className="w-4 h-4" /> Add Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3) TRUSTED CONTACTS */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Phone className="w-6 h-6 text-emerald-500" />
                        Trusted Contacts
                    </h2>

                    <div className="space-y-4">
                        {contacts.map((contact) => (
                            <div key={contact.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                <div>
                                    <h4 className="font-bold text-slate-800">{contact.name} <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md ml-2 border border-emerald-100">{contact.relation}</span></h4>
                                    <p className="text-sm text-slate-500 mt-1">{contact.phone}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="px-3 py-1.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-slate-700">Edit</button>
                                    <button className="p-1.5 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}

                        <button className="w-full py-3 border-2 border-dashed border-slate-200 text-emerald-600 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                            <Plus className="w-4 h-4" /> Add New Contact
                        </button>
                    </div>

                    <div className="mt-6 flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                        <div className="flex gap-3 items-center">
                            <AlertCircle className="w-5 h-5 text-emerald-500" />
                            <div>
                                <h4 className="font-semibold text-emerald-900">Allow Crisis Alerts</h4>
                                <p className="text-xs text-emerald-700 opacity-80 mt-0.5">Notify trusted contacts if extreme stress is detected.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setAllowCrisisAlerts(!allowCrisisAlerts)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${allowCrisisAlerts ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${allowCrisisAlerts ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </button>
                    </div>
                </section>

                {/* 4) HEALTH INTEGRATION */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Heart className="w-6 h-6 text-rose-500" />
                        Health Integration
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Connect Button */}
                        <div className="sm:w-1/3 flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl bg-slate-50 text-center">
                            <Smartphone className="w-10 h-10 text-rose-400 mb-3" />
                            <h3 className="font-bold text-slate-700 mb-2">Google Fit Sync</h3>
                            <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                                <Activity className="w-4 h-4" /> Connected
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                                <div className="text-indigo-400 mb-1"><Moon className="w-5 h-5" /></div>
                                <div className="text-2xl font-black text-indigo-900">6.5<span className="text-sm font-semibold opacity-60">h</span></div>
                                <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mt-1">Avg Sleep</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                                <div className="text-emerald-400 mb-1"><Activity className="w-5 h-5" /></div>
                                <div className="text-2xl font-black text-emerald-900">8.2<span className="text-sm font-semibold opacity-60">k</span></div>
                                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mt-1">Daily Steps</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 col-span-2 lg:col-span-1">
                                <div className="text-rose-400 mb-1"><Heart className="w-5 h-5" /></div>
                                <div className="text-2xl font-black text-rose-900">68<span className="text-sm font-semibold opacity-60">bpm</span></div>
                                <div className="text-xs font-semibold text-rose-700 uppercase tracking-wide mt-1">Resting HR</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                        <div className="flex gap-3 items-center">
                            <Activity className="w-5 h-5 text-rose-500" />
                            <div>
                                <h4 className="font-semibold text-rose-900">Health-Based Mood Analysis</h4>
                                <p className="text-xs text-rose-700 opacity-80 mt-0.5">Allow AI to use health data to improve focus suggestions.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEnableHealthMood(!enableHealthMood)}
                            className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${enableHealthMood ? 'bg-rose-500' : 'bg-slate-300'}`}
                        >
                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${enableHealthMood ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </button>
                    </div>
                </section>

                {/* Save Changes Bottom */}
                <div className="flex justify-end pt-4 mb-16">
                    <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className={`px-8 py-3.5 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2
                            ${savingProfile ? 'bg-blue-400 cursor-not-allowed shadow-blue-100' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5'}
                        `}
                    >
                        {savingProfile ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ProfilePage;
