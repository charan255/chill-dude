const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { analyzeEmotion } = require('../utils/emotion');
const { getChatbotReply } = require('../utils/chatbot');
const { summarizeText } = require('../utils/summarize');

// POST /api/chat/message
router.post('/message', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const emotionResult = analyzeEmotion(message);
        const reply = getChatbotReply(message);

        res.json({
            reply,
            mood: emotionResult.mood,
            emojis: emotionResult.emojis
        });
    } catch (error) {
        console.error('Chat Message Error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// POST /api/chat/end
router.post('/end', async (req, res) => {
    try {
        const { messages } = req.body; // Array of { role, text }
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        // Extract only user messages
        const userMessages = messages
            .filter(m => m.role === 'user')
            .map(m => m.text)
            .join(' ');

        if (!userMessages) {
            return res.status(400).json({ error: 'No user messages found' });
        }

        const emotionResult = analyzeEmotion(userMessages);
        const summary = summarizeText(userMessages);

        const journalEntry = await prisma.journal.create({
            data: {
                text: userMessages,
                mood: emotionResult.mood,
                emojis: emotionResult.emojis,
                summary: summary,
                source: 'chat'
            }
        });

        res.status(201).json(journalEntry);
    } catch (error) {
        console.error('Chat End Error:', error);
        res.status(500).json({ error: 'Failed to save chat summary' });
    }
});

module.exports = router;
