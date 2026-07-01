
/**
 * Tarot deck data and helper functions.
 *
 * This file is responsible for:
 * - Defining tarot card types
 * - Storing the tarot deck
 * - Drawing three random cards
 */

import tarotData from "@/data/tarot.json";

export type TarotCardData = {
  id: string;
  name: string;
  img: string;
  number: number;
  arcana: "Major Arcana" | "Minor Arcana";
  suit: "Cups" | "Swords" | "Wands" | "Pentacles" | null;
};

function toId(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, "-");
}

export const tarotDeck: TarotCardData[] = tarotData.cards.map((card) => ({
  id: toId(card.name),
  name: card.name,
  img: `/cards/${card.img}`,
  number: Number(card.number),
  arcana: card.arcana as TarotCardData["arcana"],
  suit: card.suit as TarotCardData["suit"],
}));

/**
 * Randomly draw three unique tarot cards.
 * The original deck remains unchanged.
 */
export function drawThreeCards(): TarotCardData[] {
  const shuffled = [...tarotDeck].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}