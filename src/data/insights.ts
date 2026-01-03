export const DEFAULT_STRATEGIES: Record<string, string> = {
    'Push': "Focus on chest, shoulders, and triceps using compound pressing movements followed by isolation work.",
    'Pull': "Prioritize back width and thickness, finishing with rear delts and biceps.",
    'Legs': "Heavy compound movements for lower body power, with accessory work for quads and hamstrings.",
    'Chest': "Specialized focus on pectoral development with varying angles and contraction types.",
    'Back': "Maximize lat engagement and mid-back thickness with controlled pulls.",
    'Shoulders': "Build width with overhead stability and controlled lateral movements.",
    'Arms': "High volume isolation work for biceps peaks and triceps development.",
    'Bodyweight': "Focus on perfect form, time under tension, and stability."
};

/**
 * Returns a clean, direct insight string for the given split and focus.
 * Removes repetitive prefixes like "Standard X Session:".
 */
export const getStaticInsight = (split: string, focus: string): string => {
    // If focus is specific (not Default/Standard), prioritize it
    const key = (focus && focus !== 'Default') ? focus : split;

    const advice = DEFAULT_STRATEGIES[key] || "Maintain intensity and focus on progressive overload.";

    return advice;
};
