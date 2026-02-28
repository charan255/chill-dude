const Sentiment = require('sentiment');
const sentiment = new Sentiment();

const analyzeEmotion = (text) => {
  const result = sentiment.analyze(text);
  const score = result.score;

  let mood = '';
  let emojis = [];

  if (score > 3) {
    mood = 'very positive';
    emojis = ['🤩', '🔥', '✨'];
  } else if (score > 0) {
    mood = 'positive';
    emojis = ['😊', '👍'];
  } else if (score === 0) {
    mood = 'neutral';
    emojis = ['😐', '😶'];
  } else if (score > -3) {
    mood = 'negative';
    emojis = ['😔', '😕'];
  } else {
    mood = 'very negative';
    emojis = ['😭', '💔', '😠'];
  }

  return {
    mood,
    emojis,
    score
  };
};

module.exports = { analyzeEmotion };
