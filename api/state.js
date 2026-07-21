const TABLE_NAME = "app_state";
const RECORD_ID = "tnc-main";

module.exports = async function handler(request, response) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
  if (!body || typeof body.data !== "object") {
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
  const headers = {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  return fetch(url, { ...options, headers });
}
