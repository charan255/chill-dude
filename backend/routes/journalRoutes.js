const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { analyzeEmotion } = require('../utils/emotion');
const { summarizeText } = require('../utils/summarize');

// POST /api/journal
router.post('/', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const emotionResult = analyzeEmotion(text);
        const summary = summarizeText(text);

        const journalEntry = await prisma.journal.create({
            data: {
                text,
                mood: emotionResult.mood,
                emojis: emotionResult.emojis,
                summary,
                source: 'manual'
            }
        });

        res.status(201).json(journalEntry);
    } catch (error) {
        console.error('Journal Create Error:', error);
        res.status(500).json({ error: 'Failed to create journal entry' });
    }
});

// GET /api/journal
router.get('/', async (req, res) => {
    try {
        const entries = await prisma.journal.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(entries);
    } catch (error) {
        console.error('Journal Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
});

module.exports = router;
