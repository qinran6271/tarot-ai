export type ReadingTopic =
  | "relationship"
  | "career"
  | "finance"
  | "health"
  | "travel"
  | "family"
  | "personal_growth"
  | "decision"
  | "general";

type TopicRule = {
  topic: ReadingTopic;
  keywords: string[];
};

const TOPIC_RULES: TopicRule[] = [
  {
    topic: "relationship",
    keywords: [
      "感情",
      "爱情",
      "恋爱",
      "复合",
      "分手",
      "前任",
      "对象",
      "男朋友",
      "女朋友",
      "伴侣",
      "暧昧",
      "喜欢我",
      "爱我",
      "结婚",
      "婚姻",
      "relationship",
      "dating",
      "boyfriend",
      "girlfriend",
      "partner",
      "ex ",
      "marriage",
    ],
  },
  {
    topic: "career",
    keywords: [
      "工作",
      "事业",
      "职业",
      "公司",
      "老板",
      "同事",
      "面试",
      "升职",
      "跳槽",
      "辞职",
      "创业",
      "career",
      "job",
      "work",
      "interview",
      "promotion",
      "resign",
      "business",
    ],
  },
  {
    topic: "finance",
    keywords: [
      "钱",
      "财运",
      "收入",
      "工资",
      "投资",
      "贷款",
      "债务",
      "买房",
      "预算",
      "赚钱",
      "finance",
      "money",
      "income",
      "salary",
      "investment",
      "loan",
      "debt",
      "budget",
    ],
  },
  {
    topic: "health",
    keywords: [
      "健康",
      "身体",
      "生病",
      "康复",
      "睡眠",
      "失眠",
      "焦虑",
      "治疗",
      "怀孕",
      "health",
      "illness",
      "recovery",
      "sleep",
      "anxiety",
      "treatment",
      "pregnant",
      "pregnancy",
    ],
  },
  {
    topic: "travel",
    keywords: [
      "旅行",
      "旅游",
      "出国",
      "搬家",
      "出差",
      "航班",
      "签证",
      "移民",
      "travel",
      "trip",
      "flight",
      "visa",
      "move abroad",
      "relocate",
    ],
  },
  {
    topic: "family",
    keywords: [
      "家庭",
      "家人",
      "父母",
      "妈妈",
      "爸爸",
      "孩子",
      "亲戚",
      "family",
      "parent",
      "mother",
      "father",
      "child",
      "relative",
    ],
  },
  {
    topic: "personal_growth",
    keywords: [
      "成长",
      "人生方向",
      "自我",
      "内在",
      "目标",
      "迷茫",
      "personal growth",
      "self growth",
      "life direction",
      "purpose",
      "goal",
    ],
  },
  {
    topic: "decision",
    keywords: [
      "要不要",
      "是否",
      "应该吗",
      "怎么选",
      "选择",
      "决定",
      "还是",
      "哪个更好",
      "should i",
      "choose",
      "choice",
      "decision",
      "which one",
    ],
  },
];

export const TOPIC_GROUPS: Record<ReadingTopic, readonly string[]> = {
  relationship: [
    "relationship",
    "relationship_advice",
    "relationship_finance",
    "relationship_ethics",
    "relationship_safety",
    "family",
    "commitment",
    "intimacy",
  ],
  career: [
    "career",
    "career_advice",
    "business",
    "business_finance",
    "management",
    "leadership",
    "project",
    "project_management",
    "learning",
    "education",
    "work_style",
    "workplace_ethics",
  ],
  finance: [
    "finance",
    "finance_advice",
    "business_finance",
    "relationship_finance",
    "transaction",
    "investment",
    "inheritance",
    "resources",
    "security",
  ],
  health: [
    "health",
    "self_care",
    "healing",
    "body",
    "recovery",
    "sleep",
    "anxiety",
    "safety_caution",
  ],
  travel: ["travel"],
  family: [
    "family",
    "relationship",
    "relationship_advice",
    "caregiving",
    "support",
    "legacy",
    "inheritance",
  ],
  personal_growth: [
    "personal_growth",
    "self_development",
    "self_awareness",
    "self_reflection",
    "growth",
    "belief",
    "purpose",
    "inner_growth",
    "self_worth",
  ],
  decision: [
    "decision",
    "decision_making",
    "advice",
    "planning",
    "choice",
    "priorities",
    "opportunity",
  ],
  general: [],
};

export function detectReadingTopic(question: string): ReadingTopic {
  const normalizedQuestion = question.trim().toLocaleLowerCase();

  for (const rule of TOPIC_RULES) {
    if (rule.keywords.some((keyword) => normalizedQuestion.includes(keyword))) {
      return rule.topic;
    }
  }

  return "general";
}
