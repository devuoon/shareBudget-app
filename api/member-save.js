const DB_ID = "6c72c9d8ebff4d6b954b4b78a4f0cb25";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") body = JSON.parse(body);
  const { nickname } = body || {};
  if (!nickname) return res.status(400).json({ error: "nickname required" });

  try {
    const queryRes = await fetch(
      `https://api.notion.com/v1/databases/${DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { property: "닉네임", title: { equals: nickname } },
        }),
      },
    );
    const queryData = await queryRes.json();
    if (queryData.results?.length > 0) {
      return res.status(200).json({ ok: true, exists: true });
    }

    const today = new Date().toISOString().split("T")[0];
    const createRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: DB_ID },
        properties: {
          닉네임: { title: [{ text: { content: nickname } }] },
          가입일: { date: { start: today } },
        },
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok)
      return res.status(createRes.status).json({ error: createData });
    return res.status(200).json({ ok: true, id: createData.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
