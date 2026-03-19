const DB_ID = "bbd527c11aaa4fd19446de77c2a71cb0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const { user, month } = req.query;
  if (!user || !month)
    return res.status(400).json({ error: "user and month required" });

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            and: [
              { property: "사용자", rich_text: { equals: user } },
              { property: "월", rich_text: { equals: month } },
            ],
          },
        }),
      },
    );
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });

    // { 식비: 50000, 교통: 30000 } 형태로 변환
    const budgets = {};
    for (const page of data.results) {
      const p = page.properties;
      const cat = p["카테고리"]?.select?.name;
      const amt = p["예산금액"]?.number;
      if (cat && amt) budgets[cat] = amt;
    }
    return res.status(200).json({ budgets });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
