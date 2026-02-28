const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_USER_ID = 1;

// --- SUBJECTS ---

const getSubjects = async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany({
            where: { userId: DEFAULT_USER_ID },
            include: {
                chapters: true,
                assignments: {
                    orderBy: {
                        dueDate: 'asc'
                    }
                }
            }
        });

        // Inject intelligence metrics into standard subject fetch
        const enhancedSubjects = subjects.map(subject => {
            const completedChapters = subject.chapters.filter(c => c.completed).length;
            const totalChapters = subject.chapters.length;
            const completionPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
            const pendingAssignmentsCount = subject.assignments.filter(a => !a.completed).length;

            return {
                ...subject,
                completionPercentage,
                pendingAssignmentsCount
            };
        });

        res.json(enhancedSubjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ error: 'Failed to fetch subjects' });
    }
};

const createSubject = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Subject name is required' });

        const newSubject = await prisma.subject.create({
            data: {
                name,
                userId: DEFAULT_USER_ID
            },
            include: {
                chapters: true,
                assignments: true
            }
        });

        res.status(201).json(newSubject);
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ error: 'Failed to create subject' });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.subject.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({ error: 'Failed to delete subject' });
    }
};

const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const updatedSubject = await prisma.subject.update({
            where: { id: parseInt(id) },
            data: { name }
        });

        res.json(updatedSubject);
    } catch (error) {
        console.error('Error updating subject:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Subject not found" });
        }
        res.status(500).json({ error: 'Failed to update subject' });
    }
};

// --- CHAPTERS ---

const createChapter = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { title } = req.body;
        if (!title) return res.status(400).json({ error: 'Chapter title is required' });

        const newChapter = await prisma.syllabusChapter.create({
            data: {
                title,
                subjectId: parseInt(subjectId)
            }
        });

        res.status(201).json(newChapter);
    } catch (error) {
        console.error('Error creating chapter:', error);
        res.status(500).json({ error: 'Failed to create chapter' });
    }
};

const updateChapter = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, completed } = req.body;

        const updatedChapter = await prisma.syllabusChapter.update({
            where: { id: parseInt(id) },
            data: {
                ...(title !== undefined && { title }),
                ...(completed !== undefined && { completed })
            }
        });

        res.json(updatedChapter);
    } catch (error) {
        console.error('Error updating chapter:', error);
        res.status(500).json({ error: 'Failed to update chapter' });
    }
};

const deleteChapter = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.syllabusChapter.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting chapter:', error);
        res.status(500).json({ error: 'Failed to delete chapter' });
    }
};

// --- ASSIGNMENTS ---

const createAssignment = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { title, dueDate } = req.body;

        if (!title || !dueDate) {
            return res.status(400).json({ error: 'Title and due date are required' });
        }

        const newAssignment = await prisma.assignment.create({
            data: {
                title,
                dueDate: new Date(dueDate),
                subjectId: parseInt(subjectId)
            }
        });

        res.status(201).json(newAssignment);
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({ error: 'Failed to create assignment' });
    }
};

module.exports = {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    createChapter,
    updateChapter,
    deleteChapter,
    createAssignment
};
