const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_USER_ID = 1;

// Helper function to calculate priority score
const calculatePriority = (daysRemaining, subjectCompletionPercentage, pendingInSubject) => {
    let score = 0;

    // 1. Days remaining weight
    if (daysRemaining <= 1) score += 50;
    else if (daysRemaining <= 3) score += 30;
    else if (daysRemaining <= 7) score += 15;
    else score += 5;

    // 2. Syllabus completion weight (lower completion = higher priority)
    if (subjectCompletionPercentage < 25) score += 20;
    else if (subjectCompletionPercentage < 50) score += 10;
    else if (subjectCompletionPercentage < 75) score += 5;

    // 3. Pending assignments in same subject
    score += (pendingInSubject * 5); // Add 5 points for every pending assignment in the same subject

    // Categorize
    if (score >= 60) return 'Critical';
    if (score >= 40) return 'High';
    if (score >= 20) return 'Medium';
    return 'Low';
};

// Helper for countdown string
const getCountdownString = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffHours = Math.floor((due - now) / (1000 * 60 * 60));

    if (diffHours < 0) return `Overdue by ${Math.abs(diffHours)} hours`;
    if (diffHours < 24) return `Due in ${diffHours} hours`;

    const diffDays = Math.floor(diffHours / 24);
    return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
};

// Helper for estimated study time
const getEstimatedStudyTime = (priorityLevel) => {
    switch (priorityLevel) {
        case 'Critical': return '3+ hours';
        case 'High': return '2-3 hours';
        case 'Medium': return '1-2 hours';
        case 'Low': return '< 1 hour';
        default: return '1-2 hours';
    }
};

const getPrioritizedAssignments = async (req, res) => {
    try {
        // Fetch all incomplete assignments for the user, including subject completion data
        const assignments = await prisma.assignment.findMany({
            where: {
                completed: false,
                subject: { userId: DEFAULT_USER_ID }
            },
            include: {
                subject: {
                    include: {
                        chapters: true,
                        assignments: { where: { completed: false } }
                    }
                }
            }
        });

        const now = new Date();
        let prioritizedList = assignments.map(assignment => {
            const dueDate = new Date(assignment.dueDate);
            const daysRemaining = Math.max(0, (dueDate - now) / (1000 * 60 * 60 * 24));

            // Calculate subject completion percentage
            const totalChapters = assignment.subject.chapters.length;
            const completedChapters = assignment.subject.chapters.filter(c => c.completed).length;
            const completionPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

            const pendingInSubject = assignment.subject.assignments.length;

            const priorityLevel = calculatePriority(daysRemaining, completionPercentage, pendingInSubject);

            return {
                id: assignment.id,
                title: assignment.title,
                subjectName: assignment.subject.name,
                dueDate: assignment.dueDate,
                daysRemaining: parseFloat(daysRemaining.toFixed(1)),
                countdown: getCountdownString(assignment.dueDate),
                priorityLevel,
                estimatedStudyTime: getEstimatedStudyTime(priorityLevel),
                riskFlag: null // Calculated later if multiple close deadlines
            };
        });

        // Risk Detection Loop
        const closeDeadlines = prioritizedList.filter(a => a.daysRemaining <= 2).length;
        prioritizedList = prioritizedList.map(a => {
            // If multiple assignments are due within 48h, mark them Overload Warning
            if (a.daysRemaining <= 2 && closeDeadlines > 1) {
                a.riskFlag = 'Overload Warning';
                // Basic heuristic: Critical assignments generally carry High Risk if they aren't Overload
            } else if (a.priorityLevel === 'Critical') {
                a.riskFlag = 'High Risk';
            }
            return a;
        });

        // Sort by priority logic (Critical first, then High...) handling tie breakers by due date
        const priorityValues = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        prioritizedList.sort((a, b) => {
            if (priorityValues[a.priorityLevel] !== priorityValues[b.priorityLevel]) {
                return priorityValues[b.priorityLevel] - priorityValues[a.priorityLevel];
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        res.json(prioritizedList);
    } catch (error) {
        console.error('Error fetching prioritized assignments:', error);
        res.status(500).json({ error: 'Failed to fetch prioritized assignments' });
    }
};

const getWorkloadSummary = async (req, res) => {
    try {
        const assignments = await prisma.assignment.findMany({
            where: {
                subject: { userId: DEFAULT_USER_ID },
                completed: false
            }
        });

        const now = new Date();
        let totalPending = assignments.length;
        let dueThisWeek = 0;
        let dueTomorrow = 0;
        let overdue = 0;

        assignments.forEach(a => {
            const dueDate = new Date(a.dueDate);
            const diffHours = (dueDate - now) / (1000 * 60 * 60);

            if (diffHours < 0) overdue++;
            if (diffHours >= 0 && diffHours <= 48) dueTomorrow++;
            if (diffHours >= 0 && diffHours <= (24 * 7)) dueThisWeek++;
        });

        res.json({
            totalPending,
            dueThisWeek,
            dueTomorrow,
            overdue
        });
    } catch (error) {
        console.error('Error fetching workload summary:', error);
        res.status(500).json({ error: 'Failed to fetch workload summary' });
    }
};

const getAssignmentChunks = async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await prisma.assignment.findUnique({
            where: { id: parseInt(id) }
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Auto-generate heuristic-based study chunks 
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        const daysRemaining = Math.max(0, (dueDate - now) / (1000 * 60 * 60 * 24));

        let totalMinutes = 120; // Default 2 hours
        if (daysRemaining <= 1) totalMinutes = 180; // Crunch time
        else if (daysRemaining > 7) totalMinutes = 90; // Early start

        const chunks = [
            { step: 1, title: 'Research & Gather Resources', duration: `${Math.floor(totalMinutes * 0.25)} mins`, type: 'Reading' },
            { step: 2, title: 'Initial Draft / Setup', duration: `${Math.floor(totalMinutes * 0.40)} mins`, type: 'Writing' },
            { step: 3, title: 'Core Practice & Problem Solving', duration: `${Math.floor(totalMinutes * 0.25)} mins`, type: 'Practice' },
            { step: 4, title: 'Final Review & Polish', duration: `${Math.floor(totalMinutes * 0.10)} mins`, type: 'Review' }
        ];

        res.json({
            assignmentId: assignment.id,
            title: assignment.title,
            chunks
        });
    } catch (error) {
        console.error('Error generating assignment chunks:', error);
        res.status(500).json({ error: 'Failed to generate assignment chunks' });
    }
};

// Moving the standard update and delete handlers here to consolidate Assignment routes
const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, dueDate, completed } = req.body;

        const updatedAssignment = await prisma.assignment.update({
            where: { id: parseInt(id) },
            data: {
                ...(title !== undefined && { title }),
                ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
                ...(completed !== undefined && { completed })
            }
        });

        res.json(updatedAssignment);
    } catch (error) {
        console.error('Error updating assignment:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Assignment not found" });
        }
        res.status(500).json({ error: 'Failed to update assignment' });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.assignment.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting assignment:', error);
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
};

module.exports = {
    getPrioritizedAssignments,
    getWorkloadSummary,
    getAssignmentChunks,
    updateAssignment,
    deleteAssignment
};
