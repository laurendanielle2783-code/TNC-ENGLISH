const OPENAI_URL = "https://api.openai.com/v1/responses";
const MODEL = "gpt-5.6-terra";

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "POST 요청만 사용할 수 있습니다." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    response.status(500).json({ error: "API 설정을 확인해주세요." });
    return;
  }

  try {
    const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const prompt = buildPrompt(payload);

    const openaiResponse = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        input: prompt,
        max_output_tokens: 900
      })
    });

    const data = await openaiResponse.json();
    if (!openaiResponse.ok) {
      response.status(500).json({ error: "보고서를 생성하지 못했습니다." });
      return;
    }

    response.status(200).json({ report: extractOutputText(data) });
  } catch {
    response.status(500).json({ error: "보고서를 생성하지 못했습니다." });
  }
};

function buildPrompt(payload) {
  return `
너는 TNC 영어학원의 학부모 안내문을 작성하는 영어학원 담임 선생님이다.
아래 학생 데이터를 바탕으로 학부모에게 보낼 한국어 학습보고서를 작성해라.

작성 규칙:
- 보고서 양식: ${payload.template}
- 작성 톤: ${payload.tone}
- 학부모가 바로 카카오톡으로 받아도 자연스럽게 작성
- 개인정보는 새로 만들지 말고, 제공된 학습정보만 사용
- 과장하지 말고, 칭찬과 다음 행동을 구체적으로 제시
- 제목 1줄, 본문 4~7문단, 마지막에 가정 확인사항 2개 포함

학생 정보:
${JSON.stringify(payload, null, 2)}
`;
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}
