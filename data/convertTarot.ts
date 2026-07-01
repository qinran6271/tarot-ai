import fs from "fs";

const raw = JSON.parse(
  fs.readFileSync("./tarot.json", "utf-8")
);

function toId(name: string) {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, "-");
}

const deck = raw.cards.map((card: any) => ({
  id: toId(card.name),
  name: card.name,
  img: `/cards/${card.img}`,
  number: Number(card.number),
  arcana: card.arcana,
  suit: card.suit,
}));

const output = `export type TarotCardData = {
  id: string;
  name: string;
  img: string;
  number: number;
  arcana: "Major Arcana" | "Minor Arcana";
  suit: "Cups" | "Swords" | "Wands" | "Pentacles" | null;
};

export const tarotDeck: TarotCardData[] = ${JSON.stringify(
  deck,
  null,
  2
)};`;

fs.writeFileSync("./lib/tarot.ts", output);

console.log("✅ lib/tarot.ts generated!");