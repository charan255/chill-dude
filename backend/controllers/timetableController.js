const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_USER_ID = 1;

const getTimetable = async (req, res) => {
    try {
        const entries = await prisma.timetableEntry.findMany({
            where: { userId: DEFAULT_USER_ID }
        });
        res.json(entries);
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ error: 'Failed to fetch timetable' });
    }
};

const createTimetableEntry = async (req, res) => {
    try {
        const { dayOfWeek, subjectName, startTime, endTime } = req.body;

        if (!dayOfWeek || !subjectName || !startTime || !endTime) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newEntry = await prisma.timetableEntry.create({
            data: {
                dayOfWeek,
                subjectName,
                startTime,
                endTime,
                userId: DEFAULT_USER_ID
            }
        });

        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Error creating timetable entry:', error);
        res.status(500).json({ error: 'Failed to create timetable entry' });
    }
};

const deleteTimetableEntry = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.timetableEntry.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting timetable entry:', error);
        res.status(500).json({ error: 'Failed to delete timetable entry' });
    }
};

const updateTimetableEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, subject, startTime, endTime } = req.body;

        // Note: frontend sends 'day' and 'subject', but schema uses 'dayOfWeek' and 'subjectName'
        const updatedEntry = await prisma.timetableEntry.update({
            where: { id: parseInt(id) },
            data: {
                dayOfWeek: day,
                subjectName: subject,
                startTime,
                endTime
            }
        });

        res.json(updatedEntry);
    } catch (error) {
        console.error('Error updating timetable entry:', error);
        if (error.code === 'P2025') { // Prisma RecordNotFound error code
            return res.status(404).json({ message: "Timetable entry not found" });
        }
        res.status(500).json({ error: 'Failed to update timetable entry' });
    }
};

// --- INTELLIGENCE FEATURES ---

// Helper to convert time "HH:MM" to minutes for easier math
const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper to convert minutes back to "HH:MM"
const minutesToTime = (mins) => {
    const hours = Math.floor(mins / 60).toString().padStart(2, '0');
    const minutes = (mins % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const getAvailableSlots = async (req, res) => {
    try {
        const { dayOfWeek, mood } = req.query;
        if (!dayOfWeek) return res.status(400).json({ error: 'dayOfWeek query parameter is required' });

        const entries = await prisma.timetableEntry.findMany({
            where: { userId: DEFAULT_USER_ID, dayOfWeek: dayOfWeek }
        });

        // Sort entries by start time strictly
        entries.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        const DAY_START = timeToMinutes('08:00');
        const DAY_END = timeToMinutes('22:00');

        let freeSlots = [];
        let currentTime = DAY_START;

        for (const entry of entries) {
            const entryStart = timeToMinutes(entry.startTime);
            const entryEnd = timeToMinutes(entry.endTime);

            // Calculate gap before this class
            if (entryStart > currentTime) {
                const gapDuration = entryStart - currentTime;
                if (gapDuration >= 30) { // Only suggest slots >= 30 mins
                    freeSlots.push({
                        start: minutesToTime(currentTime),
                        end: entry.startTime,
                        durationMins: gapDuration
                    });
                }
            }

            // Smart Buffer Planning: If class is 3+ hours, enforce a 30m break afterwards
            const classDuration = entryEnd - entryStart;
            currentTime = entryEnd;
            if (classDuration >= 180) { // 3 hours
                currentTime += 30; // Push currentTime forward 30 mins to act as a buffer break
            }
        }

        // Add remaining time after last class until DAY_END
        if (DAY_END > currentTime) {
            const gapDuration = DAY_END - currentTime;
            if (gapDuration >= 30) {
                freeSlots.push({
                    start: minutesToTime(currentTime),
                    end: minutesToTime(DAY_END),
                    durationMins: gapDuration
                });
            }
        }

        // Auto Focus Suggestions based on Mood
        let recommendation = '';
        if (mood) {
            if (mood.toLowerCase() === 'low') {
                recommendation = 'Energy is low. Stick to short 25-minute Pomodoro sessions in these slots.';
            } else if (mood.toLowerCase() === 'high') {
                recommendation = 'Energy is high! Utilize longer continuous blocks (60-90mins) for deep work.';
            } else {
                recommendation = 'Maintain a steady pace with 45-minute focus, 15-minute break cycles.';
            }
        } else {
            recommendation = 'Break large slots into 50-minute blocks with 10-minute breaks.';
        }

        res.json({
            day: dayOfWeek,
            totalFreeSlots: freeSlots.length,
            slots: freeSlots,
            focusRecommendation: recommendation
        });

    } catch (error) {
        console.error('Error calculating available slots:', error);
        res.status(500).json({ error: 'Failed to calculate available slots' });
    }
};

const getWeeklyHeatmap = async (req, res) => {
    try {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const heatmap = [];

        // We fetch all timetable entries
        const timetable = await prisma.timetableEntry.findMany({
            where: { userId: DEFAULT_USER_ID }
        });

        // We fetch all assignments
        const assignments = await prisma.assignment.findMany({
            where: {
                subject: { userId: DEFAULT_USER_ID },
                completed: false
            }
        });

        days.forEach(day => {
            const classesOnDay = timetable.filter(t => t.dayOfWeek === day).length;

            // For a production app, matching "Monday" to dates is complex. 
            // We'll use a heuristic: Find any assignment due within the *upcoming* generic matching dayOfWeek.
            // A simple implementation maps JS Date.getDay() (0=Sun, 1=Mon) to our string array.

            let assignmentsDue = 0;
            const jsDayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
            const targetJsDay = jsDayMap[day];

            assignments.forEach(a => {
                const aDate = new Date(a.dueDate);
                if (aDate.getDay() === targetJsDay) {
                    // To ensure it's "this week", check if the date is within the next 7 days
                    const now = new Date();
                    const diffDays = (aDate - now) / (1000 * 60 * 60 * 24);
                    if (diffDays >= 0 && diffDays <= 7) {
                        assignmentsDue++;
                    }
                }
            });

            // Intensity Formula: 1 class = 1 pt. 1 Assignment Due = 2 pts.
            const heatScore = classesOnDay + (assignmentsDue * 2);

            let heatLevel = 'Low';
            if (heatScore > 5) heatLevel = 'High';
            else if (heatScore >= 3) heatLevel = 'Medium';

            heatmap.push({
                day,
                classes: classesOnDay,
                assignmentsDue,
                heatScore,
                heatLevel
            });
        });

        res.json(heatmap);

    } catch (error) {
        console.error('Error generating heatmap:', error);
        res.status(500).json({ error: 'Failed to generate weekly heatmap' });
    }
};

const getConflicts = async (req, res) => {
    try {
        // We can reuse heatmap logic briefly just internally
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const timetable = await prisma.timetableEntry.findMany({
            where: { userId: DEFAULT_USER_ID }
        });
        const assignments = await prisma.assignment.findMany({
            where: { subject: { userId: DEFAULT_USER_ID }, completed: false }
        });

        const conflicts = [];

        days.forEach(day => {
            const classesOnDay = timetable.filter(t => t.dayOfWeek === day).length;

            const jsDayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
            const targetJsDay = jsDayMap[day];

            assignments.forEach(a => {
                const aDate = new Date(a.dueDate);
                const now = new Date();
                const diffDays = (aDate - now) / (1000 * 60 * 60 * 24);

                // Check if this assignment is due specifically this coming target day
                if (aDate.getDay() === targetJsDay && diffDays >= 0 && diffDays <= 7) {
                    // Conflict Condition: Assignment is due on a day with 4+ classes
                    if (classesOnDay >= 4) {
                        conflicts.push({
                            type: 'High Risk Day',
                            day: day,
                            assignmentTitle: a.title,
                            conflictReason: `Assignment due on heavily scheduled day (${classesOnDay} classes).`,
                            suggestion: 'Complete this assignment at least 1 day prior to avoid burnout.'
                        });
                    }
                }
            });
        });

        res.json({
            totalConflicts: conflicts.length,
            conflicts
        });

    } catch (error) {
        console.error('Error picking up conflicts:', error);
        res.status(500).json({ error: 'Failed to evaluate timetable conflicts' });
    }
};

module.exports = {
    getTimetable,
    createTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    getAvailableSlots,
    getWeeklyHeatmap,
    getConflicts
};
