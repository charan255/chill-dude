const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_USER_ID = 1;

// Helper to get or create stats
const getOrCreateStats = async (userId) => {
    let stats = await prisma.relaxStat.findUnique({ where: { userId } });
    if (!stats) {
        stats = await prisma.relaxStat.create({ data: { userId } });
    }
    return stats;
};

// 1. Get Stats
const getStats = async (req, res) => {
    try {
        const stats = await getOrCreateStats(DEFAULT_USER_ID);

        // Calculate today's minutes
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todaysSessions = await prisma.relaxSession.findMany({
            where: {
                userId: DEFAULT_USER_ID,
                date: { gte: startOfDay }
            }
        });

        const todayMinutes = todaysSessions.reduce((acc, curr) => acc + curr.duration, 0);

        res.json({
            ...stats,
            todayMinutes
        });
    } catch (error) {
        console.error('Error fetching relax stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

// 2. Add Session (Timer, Mood, Room, Sound)
const addSession = async (req, res) => {
    try {
        const { type, duration, activity, completedTimer } = req.body;

        // Create session
        const session = await prisma.relaxSession.create({
            data: {
                userId: DEFAULT_USER_ID,
                type,
                duration,
                activity
            }
        });

        const stats = await getOrCreateStats(DEFAULT_USER_ID);

        // Calculate Streak logic
        let newStreak = stats.currentStreak;
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        if (!stats.lastRelaxDate || stats.lastRelaxDate < startOfYesterday) {
            // Missed a day, reset streak to 1
            newStreak = 1;
        } else if (stats.lastRelaxDate >= startOfYesterday && stats.lastRelaxDate < startOfToday) {
            // New day, increment streak
            newStreak += 1;
        }

        // Calculate XP
        let gainedXP = Math.floor(duration); // 1 XP per minute
        if (type === 'timer' && completedTimer) {
            gainedXP += 5; // +5 Bonus
        }

        // Update stats
        const updatedStats = await prisma.relaxStat.update({
            where: { userId: DEFAULT_USER_ID },
            data: {
                totalMinutes: stats.totalMinutes + duration,
                xp: stats.xp + gainedXP,
                currentStreak: newStreak,
                lastRelaxDate: now
            }
        });

        res.json({ session, updatedStats });
    } catch (error) {
        console.error('Error adding relax session:', error);
        res.status(500).json({ error: 'Failed to add session' });
    }
};

// 3. Get Analytics
const getAnalytics = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Relax minutes today
        const todaysRelax = await prisma.relaxSession.aggregate({
            where: { userId: DEFAULT_USER_ID, date: { gte: startOfDay } },
            _sum: { duration: true }
        });
        const relaxMinutes = todaysRelax._sum.duration || 0;

        // Focus minutes today
        const todaysFocus = await prisma.focusSession.aggregate({
            where: { userId: DEFAULT_USER_ID, date: { gte: startOfDay } },
            _sum: { durationMinutes: true }
        });
        const focusMinutes = todaysFocus._sum.durationMinutes || 0;

        // Most used activity (all time)
        const sessions = await prisma.relaxSession.findMany({
            where: { userId: DEFAULT_USER_ID }
        });

        const activityCount = {};
        let mostUsedActivity = 'None yet';
        let maxCount = 0;

        sessions.forEach(s => {
            if (s.activity) {
                activityCount[s.activity] = (activityCount[s.activity] || 0) + 1;
                if (activityCount[s.activity] > maxCount) {
                    maxCount = activityCount[s.activity];
                    mostUsedActivity = s.activity;
                }
            }
        });

        // Mood frequency last 7 days
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const recentMoods = await prisma.relaxSession.findMany({
            where: { userId: DEFAULT_USER_ID, type: 'mood', date: { gte: last7Days } }
        });

        const moodFrequency = {};
        recentMoods.forEach(m => {
            if (m.activity) {
                moodFrequency[m.activity] = (moodFrequency[m.activity] || 0) + 1;
            }
        });

        // Overdue assignments
        const overdueQuery = await prisma.assignment.count({
            where: {
                subject: { userId: DEFAULT_USER_ID },
                completed: false,
                dueDate: { lt: new Date() }
            }
        });

        res.json({
            relaxMinutes,
            focusMinutes,
            ratio: focusMinutes > 0 ? parseFloat((relaxMinutes / focusMinutes).toFixed(2)) : 1.00,
            mostUsedActivity,
            moodFrequency,
            overdueAssignments: overdueQuery
        });
    } catch (error) {
        console.error('Error fetching relax analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

// 4. Reflections
const getReflections = async (req, res) => {
    try {
        const reflections = await prisma.relaxReflection.findMany({
            where: { userId: DEFAULT_USER_ID },
            orderBy: { date: 'desc' },
            take: 10
        });
        res.json(reflections);
    } catch (error) {
        console.error('Error fetching reflections:', error);
        res.status(500).json({ error: 'Failed to fetch reflections' });
    }
}

const addReflection = async (req, res) => {
    try {
        const { gratitude, reflection } = req.body;
        const entry = await prisma.relaxReflection.create({
            data: {
                userId: DEFAULT_USER_ID,
                gratitude: gratitude || '',
                reflection: reflection || ''
            }
        });
        res.json(entry);
    } catch (error) {
        console.error('Error adding reflection:', error);
        res.status(500).json({ error: 'Failed to add reflection' });
    }
}

module.exports = { getStats, addSession, getAnalytics, getReflections, addReflection };
