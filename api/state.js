const TABLE_NAME = "app_state";
const RECORD_ID = "tnc-main";

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  try {
    await handleRequest(request, response);
  } catch (error) {
    console.error("Shared state request failed:", error?.cause?.code || error?.name || "unknown");
    response.status(503).json({ error: "공용 저장 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요." });
  }
};

async function handleRequest(request, response) {
  if (!process.env.SUPABASE_URL || !supabaseApiKey()) {
    response.status(503).json({ error: "데이터베이스 설정이 필요합니다." });
    return;
  }

  if (request.method === "GET") {
    await readState(response);
    return;
  }

  if (request.method === "POST") {
    await writeState(request, response);
    return;
  }

  response.status(405).json({ error: "GET 또는 POST 요청만 사용할 수 있습니다." });
};

async function readState(response) {
  const result = await supabaseFetch(`${tableUrl()}?id=eq.${RECORD_ID}&select=data,updated_at`, {
    method: "GET"
  });

  if (!result.ok) {
    response.status(500).json({ error: "데이터를 불러오지 못했습니다." });
    return;
  }

  const rows = await result.json();
  if (!rows.length) {
    response.status(200).json({ data: null, updatedAt: null });
    return;
  }

  response.status(200).json({ data: rows[0].data, updatedAt: rows[0].updated_at });
}

async function writeState(request, response) {
  const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
  if (!body || !body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    response.status(400).json({ error: "저장할 데이터가 없습니다." });
    return;
  }

  const result = await supabaseFetch(`${tableUrl()}?on_conflict=id`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: RECORD_ID,
      data: body.data,
      updated_at: new Date().toISOString()
    })
  });

  if (!result.ok) {
    response.status(500).json({ error: "데이터를 저장하지 못했습니다." });
    return;
  }

  const rows = await result.json();
  response.status(200).json({ ok: true, updatedAt: rows[0]?.updated_at || null });
}

function tableUrl() {
  return `${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${TABLE_NAME}`;
}

function supabaseFetch(url, options) {
  const apiKey = supabaseApiKey();
  const headers = {
    apikey: apiKey,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (apiKey && !apiKey.startsWith("sb_")) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return fetch(url, { ...options, headers });
}

function supabaseApiKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
}
