export type TarotSpread = {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  positions: string[];
  holistic?: boolean;
};

export const tarotSpreads: TarotSpread[] = [
  {
    id: "intuitive-three",
    name: "Intuitive Three-Card Reading",
    description: "A holistic three-card reading without past/present/future positions.",
    cardCount: 3,
    positions: ["Card 1", "Card 2", "Card 3"],
    holistic: true,
  },
  {
    id: "relationship",
    name: "Relationship Insight",
    description: "Explore two people, the connection, blockage, and direction.",
    cardCount: 5,
    positions: ["You", "Them", "Connection", "Blockage", "Direction"],
  },
  {
    id: "decision",
    name: "Decision Guidance",
    description: "Useful when choosing between two paths.",
    cardCount: 4,
    positions: ["Situation", "Option A", "Option B", "Advice"],
  },
];