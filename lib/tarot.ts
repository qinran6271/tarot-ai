export type TarotCardData = {
  id: string;
  name: string;
};

export const tarotDeck: TarotCardData[] = [
  { id: "the-fool", name: "The Fool" },
  { id: "the-magician", name: "The Magician" },
  { id: "the-high-priestess", name: "The High Priestess" },
  { id: "the-empress", name: "The Empress" },
  { id: "the-emperor", name: "The Emperor" },
  { id: "the-hierophant", name: "The Hierophant" },
  { id: "the-lovers", name: "The Lovers" },
  { id: "the-chariot", name: "The Chariot" },
  { id: "strength", name: "Strength" },
  { id: "the-hermit", name: "The Hermit" },
  { id: "wheel-of-fortune", name: "Wheel of Fortune" },
  { id: "justice", name: "Justice" },
  { id: "the-hanged-man", name: "The Hanged Man" },
  { id: "death", name: "Death" },
  { id: "temperance", name: "Temperance" },
  { id: "the-devil", name: "The Devil" },
  { id: "the-tower", name: "The Tower" },
  { id: "the-star", name: "The Star" },
  { id: "the-moon", name: "The Moon" },
  { id: "the-sun", name: "The Sun" },
  { id: "judgement", name: "Judgement" },
  { id: "the-world", name: "The World" },
];

export function drawThreeCards() {
  return [...tarotDeck].sort(() => Math.random() - 0.5).slice(0, 3);
}