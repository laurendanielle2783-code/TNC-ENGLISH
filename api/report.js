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
${payload.customPrompt || "당신은 학부모용 학습보고서를 작성하는 학원 담임 선생님입니다."}

아래 학생 데이터를 바탕으로 학부모에게 보낼 한국어 학습보고서를 작성해라.

작성 규칙:
- 보고서 양식: ${payload.template}
- 작성 톤: ${payload.tone}
- 학부모가 바로 카카오톡으로 받아도 자연스럽게 작성
- 실제 학생의 전화번호, 주소, 계정 등 개인정보는 절대 출력하지 않기
- 입력되지 않은 성적이나 행동을 추측하지 않기
- 다른 학생과 비교하지 않기
- 질책하거나 낙인찍는 표현 사용하지 않기
- 점수가 낮아도 노력과 성장 가능성을 함께 설명하기
- 학부모가 이해하기 어려운 전문용어 피하기
- 확인되지 않은 진단이나 성향을 단정하지 않기
- 같은 문장을 모든 학생에게 반복하는 느낌을 피하기
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
