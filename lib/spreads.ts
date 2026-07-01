export type TarotSpread = {
  id: string;
  name: string;
  description: string;

  // How many cards to draw
  cardCount: number;

  // Position names shown in the UI
  positions: string[];

  // Whether the cards should be interpreted as a whole
  holistic: boolean;

  // Instructions for the AI
  interpretationGuide: string;
};

export const tarotSpreads: TarotSpread[] = [
  {
    id: "intuitive-three",
    name: "Intuitive Three-Card Reading",
    description:
      "A holistic three-card reading without fixed past, present, or future positions.",

    cardCount: 3,
    positions: ["Card 1", "Card 2", "Card 3"],

    holistic: true,

    interpretationGuide:
      "Interpret all three cards as one unified message. Focus on the relationships between the cards, recurring themes, and practical guidance. Do not assign the cards to past, present, or future.",
  },

  {
    id: "relationship",
    name: "Relationship Insight",
    description:
      "Explore the dynamics between two people and the direction of the relationship.",

    cardCount: 5,
    positions: [
      "You",
      "Them",
      "Connection",
      "Challenge",
      "Guidance",
    ],

    holistic: false,

    interpretationGuide:
      "Interpret each card according to its position while also considering the overall relationship dynamic. Focus on emotions, communication, obstacles, and guidance.",
  },

  {
    id: "decision",
    name: "Decision Guidance",
    description:
      "Gain clarity when choosing between different paths or opportunities.",

    cardCount: 4,
    positions: [
      "Current Situation",
      "Option A",
      "Option B",
      "Guidance",
    ],

    holistic: false,

    interpretationGuide:
      "Compare the available options objectively. Explain the strengths, risks, and likely outcomes of each option before providing practical guidance.",
  },
];