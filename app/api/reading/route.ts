import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { question, cards } = await request.json();

    if (!question || !cards || cards.length === 0) {
      return NextResponse.json(
        { error: "Missing question or cards" },
        { status: 400 }
      );
    }

    const cardList = cards
      .map(
        (card: { name: string; position?: string }) =>
          `${card.position ?? "Card"}: ${card.name}`
      )
      .join("\n");

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
input: `
你是一位头脑灵活思维发散的塔罗师，擅长回答有趣的问题，擅长回答情感细腻的问题。

用户的问题：
${question}

抽到的牌：
${cardList}

请根据用户的问题和三张牌，生成一次中文塔罗解读。

要求：
- 不要机械逐张解释牌义
- 先回答用户真正关心的问题
- 综合三张牌形成一个整体判断
- 语气温柔、直接、有洞察力
- 不要过度玄学，也不要像心理咨询报告
- 可以指出用户可能的盲点，但不要攻击用户
- 不要说“命运注定”“一定会”
- 不要使用“这张牌象征……”这种模板化表达

请只返回合法 JSON，不要 markdown，不要代码块。

格式严格如下：
{
  "keyInsight": "一句有洞察力的中文核心判断",
  "interpretation": "一到两段自然的中文解读，像真人塔罗师在说话",
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