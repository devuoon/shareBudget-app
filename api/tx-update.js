export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "PATCH")
    return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") body = JSON.parse(body);
  const { id, type, amount, date, cat, desc } = body || {};
  if (!id) return res.status(400).json({ error: "id required" });

  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          제목: { title: [{ text: { content: desc || cat } }] },
          유형: { select: { name: type === "income" ? "수입" : "지출" } },
          금액: { number: Number(amount) },
          카테고리: { select: { name: cat } },
          날짜: { date: { start: date } },
          메모: { rich_text: [{ text: { content: desc || "" } }] },
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
