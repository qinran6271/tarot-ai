import OpenAI from "openai";
import { NextResponse } from "next/server";
import { readingRules } from "@/lib/readingRules";
import tarotKnowledge from "@/data/tarotKnowledge.json";
import { DrawnCard, TarotKnowledgeCard} from "@/types/tarot";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { question, cards, spread} = await request.json();

    if (!question || !cards || cards.length === 0) {
      return NextResponse.json(
        { error: "Missing question or cards" },
        { status: 400 }
      );
    }

    const references = cards.map((card: DrawnCard) => {
      const knowledge = tarotKnowledge.cards.find(
        (item: TarotKnowledgeCard) => item.name === card.name
      );

      return {
        ...card,
        knowledge,
    };
    });

    const cardKnowledge = references
    .map((card: DrawnCard & { knowledge?: TarotKnowledgeCard }) => {
        if (!card.knowledge) return "";

        return `
    ${card.position ?? "Card"}: ${card.name} ${
        card.isReversed ? "(Reversed)" : "(Upright)"
        }

    Arcana:
    ${card.knowledge.type === "major" ? "Major Arcana" : "Minor Arcana"}

    Meaning:
    ${
    card.isReversed
        ? card.knowledge.meaning_rev
        : card.knowledge.meaning_up
    }

    Card Description:
    ${card.knowledge.desc}
    `;
    })
    .join("\n-----------------\n");

    const cardList = cards
    .map(
        (card: DrawnCard) =>
        `${card.position ?? "Card"}: ${card.name} ${
            card.isReversed ? "(Reversed)" : "(Upright)"
        }`
    )
    .join("\n");

    

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
input: `
你是一位头脑灵活、思维发散的塔罗师，擅长回答有趣的问题，也擅长回答情感细腻的问题。

用户的问题：
${question}

抽到的牌：
${cardList}

牌阵：
${spread.name}

参考牌义：
${cardKnowledge}

参考牌义使用规则：
- Meaning 是主要依据，但只能作为理解方向，不能机械复述或逐字翻译。
- Card Description 用于理解牌面的象征、氛围和细节；可以在此基础上做联想，但不要直接描述画面。
- 大阿卡纳牌（Major Arcana）权重更高，通常代表更深层的主题、关键转折、不可忽视的主线。
- 小阿卡纳牌（Minor Arcana）更偏向具体事件、情绪、日常状态和可调整的细节。
- 不要照抄参考牌义，要结合用户的问题、牌位和三张牌之间的关系，转化成自然的解读。
- 如果牌义和用户问题不完全对应，请优先围绕用户真正关心的问题解释。
- 如果某张牌的含义较宽泛，请选择最贴合用户问题的角度，不要把所有含义都塞进回答里。

请根据用户的问题和牌阵，生成一次塔罗解读。

语言规则：
- 请使用和用户的问题相同的语言回答
- 如果用户用中文提问，请用中文回答
- 如果用户用英文提问，请用英文回答
- 如果用户中英混合，请优先使用用户主要使用的语言
- 不要在回答里解释你选择了什么语言

要求：

- 充分理解用户的问题，再结合整个牌阵进行解读。
- 优先回答用户真正关心的问题，而不是单独解释每一张牌。
- 结合每张牌在牌阵中的位置（例如过去、现在、未来）说明它们之间如何相互影响。
- 最终形成一个完整、连贯的整体判断，而不是三张牌的简单相加。
- 回答尽可能具体、具像化，帮助用户理解可能发生的情况或当前所处的状态。
- 语气温柔、真诚、有洞察力，像经验丰富的塔罗师与用户交流。
- 可以指出用户可能忽略的地方，但不要批评或攻击用户。
- 不要过度玄学，不要宣称能够预测确定的未来。
- 不要使用"这张牌象征……""这意味着……"等模板化表达。
- 避免使用"命运注定""一定会""百分之百"等绝对化措辞。
- 必须使用与用户提问相同的语言回答！！！

解牌建议：
    ${readingRules}

请只返回合法 JSON，不要 markdown，不要代码块。

格式严格如下：
{
  "keyInsight": "一句有洞察力的核心判断",
  "interpretation": "一到两段自然的解读，像真人塔罗师在说话",
  "advice": "一段具体、温柔、可执行的建议",
  "followUps": [
    "一个用户可能真的想继续问的问题",
    "一个用户可能真的想继续问的问题",
    "一个用户可能真的想继续问的问题"
  ]
}
`,
    });

    const text = response.output_text.trim();

    // 防止模型偶尔返回 ```json
    const cleaned = text
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/, "")
      .trim();

    const reading = JSON.parse(cleaned);

    return NextResponse.json(reading);
  } catch (error) {
    console.error("Reading API error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate reading",
      },
      {
        status: 500,
      }
    );
  }
}