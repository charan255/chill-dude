const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_USER_ID = 1;

// 1. Priority Tasks
// Return upcoming assignments sorted by due date.
const getPriorityTasks = async (req, res) => {
    try {
        const assignments = await prisma.assignment.findMany({
            where: {
                subject: { userId: DEFAULT_USER_ID },
                completed: false
            },
            include: { subject: { select: { name: true } } },
            orderBy: { dueDate: 'asc' },
            take: 5
        });

        const now = new Date();
        const formatted = assignments.map(a => {
            const timeDiff = new Date(a.dueDate).getTime() - now.getTime();
            const hoursDiff = timeDiff / (1000 * 3600);
            return {
                id: a.id,
                title: a.title,
                subject: a.subject,
                dueDate: a.dueDate,
                isUrgent: hoursDiff <= 48
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching priority tasks:', error);
        res.status(500).json({ error: 'Failed to fetch priority tasks' });
    }
};

// 2. Urgency
// Return assignments grouped by urgency (dueToday, dueTomorrow, dueThisWeek)
const getUrgency = async (req, res) => {
    try {
        const assignments = await prisma.assignment.findMany({
            where: {
                subject: { userId: DEFAULT_USER_ID },
                completed: false
            },
            include: { subject: { select: { name: true } } }
        });

        const now = new Date();
        // Reset time for accurate day comparisons
        now.setHours(0, 0, 0, 0);

        const dueToday = [];
        const dueTomorrow = [];
        const dueThisWeek = [];

        assignments.forEach(a => {
            const dueDate = new Date(a.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = dueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                dueToday.push(a);
            } else if (diffDays === 1) {
                dueTomorrow.push(a);
            } else if (diffDays > 1 && diffDays <= 7) {
                dueThisWeek.push(a);
            }
        });

        res.json({ dueToday, dueTomorrow, dueThisWeek });
    } catch (error) {
        console.error('Error fetching urgency data:', error);
        res.status(500).json({ error: 'Failed to fetch urgency data' });
    }
};

// 3. Adaptive Plan
// Generate a basic structured study plan from incomplete syllabus chapters & upcoming assignments
const getAdaptivePlan = async (req, res) => {
    try {
        const chapters = await prisma.syllabusChapter.findMany({
            where: {
                subject: { userId: DEFAULT_USER_ID },
                completed: false
            },
            include: { subject: { select: { name: true } } },
            take: 2 // Keep it short
        });

        const assignments = await prisma.assignment.findMany({
            where: {
                subject: { userId: DEFAULT_USER_ID },
                completed: false
            },
            include: { subject: { select: { name: true } } },
            orderBy: { dueDate: 'asc' },
            take: 1
        });

        const plan = [];
        let stepCount = 1;

        if (assignments.length > 0) {
            plan.push({
                step: stepCount++,
                type: 'study',
                subject: assignments[0].subject.name,
                task: `Complete: ${assignments[0].title}`,
                duration: 45
            });
            plan.push({ step: stepCount++, type: 'break', duration: 10 });
        }

        chapters.forEach(chapter => {
            plan.push({
                step: stepCount++,
                type: 'study',
                subject: chapter.subject.name,
                task: `Study: ${chapter.title}`,
                duration: 25
            });
            plan.push({ step: stepCount++, type: 'break', duration: 5 });
        });

        res.json(plan);
    } catch (error) {
        console.error('Error fetching adaptive plan:', error);
        res.status(500).json({ error: 'Failed to generate adaptive plan' });
    }
};

// 4. Weekly Productivity
// Return last 7 days focus session durations.
const getWeeklyProductivity = async (req, res) => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const sessions = await prisma.focusSession.findMany({
            where: {
                userId: DEFAULT_USER_ID,
                date: {
                    gte: sevenDaysAgo,
                    lte: now
                }
            }
        });

        // Initialize last 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyData = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            weeklyData.push({
                day: days[d.getDay()],
                minutes: 0,
                dateStr: d.toDateString()
            });
        }

        sessions.forEach(session => {
            const sessionDate = new Date(session.date).toDateString();
            const dayObj = weeklyData.find(d => d.dateStr === sessionDate);
            if (dayObj) {
                dayObj.minutes += session.durationMinutes;
            }
        });

        // Strip the dateStr for the frontend
        const formattedData = weeklyData.map(({ day, minutes }) => ({ day, minutes }));

        res.json(formattedData);
    } catch (error) {
        console.error('Error fetching weekly productivity:', error);
        res.status(500).json({ error: 'Failed to fetch weekly productivity' });
    }
};

module.exports = {
    getPriorityTasks,
    getUrgency,
    getAdaptivePlan,
    getWeeklyProductivity
};
