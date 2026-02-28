const summarizeText = (text) => {
    if (!text) return "";

    // Get first 1-2 sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let summary = sentences.slice(0, 2).join(" ").trim();

    // If text is long, trim to 150 characters
    if (summary.length > 150) {
        summary = summary.substring(0, 147) + "...";
    }

    return summary;
};

module.exports = { summarizeText };
