require('dotenv').config();
const express = require('express');
const cors = require('cors');

const chatRoutes = require('./routes/chatRoutes');
const journalRoutes = require('./routes/journalRoutes');
const profileRoutes = require('./routes/profileRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const chapterRoutes = require('./routes/chapterRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const contactRoutes = require('./routes/contactRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const focusRoutes = require('./routes/focusRoutes');
const relaxRoutes = require('./routes/relaxRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/relax', relaxRoutes);

// Base Route
app.get('/', (req, res) => {
    res.send('Chill Dude Backend Running');
});

// Error handling for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
