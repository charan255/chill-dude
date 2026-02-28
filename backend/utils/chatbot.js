const chatbotReplies = {
    academic_stress: [
        "I get it, exams can be tough. Take a deep breath! 📚",
        "One step at a time, you've got this! Don't let the deadlines get to you. 💪",
        "Remember to take short breaks. You're more than just your grades! ✨"
    ],
    exhaustion: [
        "Sounds like you've had a long day. Time for some rest? 😴",
        "Rest is productive too! Go grab some water and chill for a bit. 🥤",
        "You're working hard, but don't forget to recharge. 🔋"
    ],
    empathy: [
        "I'm here for you. It's okay to feel sad sometimes. 🫂",
        "Sending you a virtual hug. Want to talk more about it? ❤️",
        "Things will get better. You're not alone in this. 🌟"
    ],
    encouragement: [
        "That's awesome! Keep that energy going! 🎉",
        "I'm so happy for you! High five! 👋",
        "Love the positive vibes! You're crushing it! ✨"
    ],
    default: [
        "Tell me more about that. I'm listening. 👂",
        "I see. How does that make you feel? 🤔",
        "That's interesting! Chill Dude is always here to chat. 😎"
    ]
};

const getChatbotReply = (message) => {
    const msg = message.toLowerCase();
    let category = 'default';

    if (msg.includes('exam') || msg.includes('deadline')) {
        category = 'academic_stress';
    } else if (msg.includes('tired') || msg.includes('exhausted')) {
        category = 'exhaustion';
    } else if (msg.includes('sad') || msg.includes('unhappy')) {
        category = 'empathy';
    } else if (msg.includes('happy') || msg.includes('great') || msg.includes('good')) {
        category = 'encouragement';
    }

    const replies = chatbotReplies[category];
    return replies[Math.floor(Math.random() * replies.length)];
};

module.exports = { getChatbotReply };
