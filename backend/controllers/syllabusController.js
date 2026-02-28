const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_USER_ID = 1;

// Helper to calculate completion percentage for a subject's chapters
const getCompletionPercentage = (chapters) => {
    if (!chapters || chapters.length === 0) return 0;
    const completed = chapters.filter(c => c.completed).length;
    return Math.round((completed / chapters.length) * 100);
};

// 1 & 2. Weak Subject Detection
const getWeakSubjects = async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany({
            where: { userId: DEFAULT_USER_ID },
            include: { chapters: true }
        });

        const analyzedSubjects = subjects.map(subject => ({
            id: subject.id,
            name: subject.name,
            completionPercentage: getCompletionPercentage(subject.chapters),
            totalChapters: subject.chapters.length,
            completedChapters: subject.chapters.filter(c => c.completed).length
        }));

        // Rank from lowest completion to highest
        analyzedSubjects.sort((a, b) => a.completionPercentage - b.completionPercentage);

        res.json(analyzedSubjects);
    } catch (error) {
        console.error('Error fetching weak subjects:', error);
        res.status(500).json({ error: 'Failed to fetch weak subjects' });
    }
};

// 3. Adaptive Focus Bias
const getFocusRecommendation = async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany({
            where: { userId: DEFAULT_USER_ID },
            include: {
                chapters: true,
                assignments: {
                    where: { completed: false }
                }
            }
        });

        if (subjects.length === 0) {
            return res.json({ recommendation: 'No subjects found', reason: 'Add subjects to generate a focus plan.' });
        }

        const now = new Date();

        // Evaluate "Need Score" for each subject
        // High score = High priority to focus on
        const evaluatedSubjects = subjects.map(subject => {
            let focusScore = 0;
            const completion = getCompletionPercentage(subject.chapters);

            // Bias 1: Low Completion (Max 50 points if 0%, 0 points if 100%)
            focusScore += (100 - completion) * 0.5;

            // Bias 2: Upcoming Deadlines
            let pendingAssignmentCount = subject.assignments.length;
            let hasUrgentDeadline = false;

            subject.assignments.forEach(assignment => {
                const daysRemaining = (new Date(assignment.dueDate) - now) / (1000 * 60 * 60 * 24);
                if (daysRemaining <= 2) {
                    focusScore += 30; // Highly urgent
                    hasUrgentDeadline = true;
                } else if (daysRemaining <= 7) {
                    focusScore += 10;
                }
            });

            return {
                subjectId: subject.id,
                name: subject.name,
                completionPercentage: completion,
                focusScore,
                pendingAssignments: pendingAssignmentCount,
                hasUrgentDeadline
            };
        });

        evaluatedSubjects.sort((a, b) => b.focusScore - a.focusScore);
        const topFocus = evaluatedSubjects[0];

        // Determine suggestion reason string
        let reason = `Your completion is currently at ${topFocus.completionPercentage}%.`;
        if (topFocus.hasUrgentDeadline) {
            reason += ' You also have an urgent assignment due very soon!';
        } else if (topFocus.pendingAssignments > 0) {
            reason += ` You have ${topFocus.pendingAssignments} pending assignment(s) coming up.`;
        }

        res.json({
            subjectId: topFocus.subjectId,
            name: topFocus.name,
            focusScore: topFocus.focusScore,
            reason
        });

    } catch (error) {
        console.error('Error fetching focus recommendation:', error);
        res.status(500).json({ error: 'Failed to fetch focus recommendation' });
    }
};

// 4. Smart Chapter Planning
const getSmartChapterPlan = async (req, res) => {
    try {
        const { subjectId } = req.params;

        const subject = await prisma.subject.findUnique({
            where: { id: parseInt(subjectId) },
            include: {
                chapters: true,
                assignments: {
                    where: { completed: false },
                    orderBy: { dueDate: 'asc' },
                    take: 1 // Find the soonest deadline
                }
            }
        });

        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const completion = getCompletionPercentage(subject.chapters);
        const remainingChapters = subject.chapters.filter(c => !c.completed).length;

        // Only generate an active "crunch plan" if completion < 40% and there's a deadline
        // Otherwise return a relaxed suggestion
        let plan = {};
        if (completion < 40 && subject.assignments.length > 0) {
            const nextDeadline = new Date(subject.assignments[0].dueDate);
            const now = new Date();
            let daysRemaining = Math.max(1, Math.floor((nextDeadline - now) / (1000 * 60 * 60 * 24))); // minimum 1 day to prevent infinity

            // Leave 1 day buffer for revision
            const workingDays = Math.max(1, daysRemaining - 1);
            const chaptersPerDay = Math.ceil(remainingChapters / workingDays);

            plan = {
                status: 'Crunch Mode',
                remainingChapters,
                targetDeadline: nextDeadline,
                daysUntilDeadline: daysRemaining,
                recommendedChaptersPerDay: chaptersPerDay,
                estimatedCompletionDate: new Date(now.getTime() + (workingDays * 24 * 60 * 60 * 1000)),
                message: `Read ${chaptersPerDay} chapter(s) every day to finish before your assignment.`
            };
        } else {
            plan = {
                status: 'On Track',
                remainingChapters,
                recommendedChaptersPerDay: 1, // Steady pace
                message: 'No immediate urgent deadlines or completion is high enough. One chapter a day keeps stress away.'
            };
        }

        res.json({
            subjectId: subject.id,
            name: subject.name,
            completionPercentage: completion,
            plan
        });

    } catch (error) {
        console.error('Error fetching smart plan:', error);
        res.status(500).json({ error: 'Failed to fetch smart chapter plan' });
    }
};

// 5. Progress Trend Tracking
const getProgressTrend = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch chapters for the user's subjects completed in the last 7 days
        const recentCompletions = await prisma.syllabusChapter.findMany({
            where: {
                completed: true,
                updatedAt: { gte: sevenDaysAgo },
                subject: { userId: DEFAULT_USER_ID }
            }
        });

        const chaptersCompletedLast7Days = recentCompletions.length;
        let momentum = 'Low';

        if (chaptersCompletedLast7Days >= 5) momentum = 'Strong';
        else if (chaptersCompletedLast7Days >= 2) momentum = 'Moderate';

        res.json({
            chaptersCompletedLast7Days,
            momentum,
            message: `You've completed ${chaptersCompletedLast7Days} chapters in the past week.`
        });

    } catch (error) {
        console.error('Error fetching progress trend:', error);
        res.status(500).json({ error: 'Failed to fetch progress trend' });
    }
};

module.exports = {
    getWeakSubjects,
    getFocusRecommendation,
    getSmartChapterPlan,
    getProgressTrend
};
