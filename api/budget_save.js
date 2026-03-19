const DB_ID = "bbd527c11aaa4fd19446de77c2a71cb0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { user, month, cat, amount } = req.body;
  if (!user || !month || !cat || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 기존 같은 사용자+월+카테고리 찾기
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
          filter: {
            and: [
              { property: "사용자", rich_text: { equals: user } },
              { property: "월", rich_text: { equals: month } },
              { property: "카테고리", select: { equals: cat } },
            ],
          },
        }),
      },
    );
    const queryData = await queryRes.json();
    const existing = queryData.results?.[0];

    if (existing) {
      // 이미 있으면 예산금액만 업데이트
      const updateRes = await fetch(
        `https://api.notion.com/v1/pages/${existing.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              예산금액: { number: Number(amount) },
            },
          }),
        },
      );
      const updateData = await updateRes.json();
      if (!updateRes.ok)
        return res.status(updateRes.status).json({ error: updateData });
      return res.status(200).json({ id: existing.id, ok: true });
    } else {
      // 없으면 새로 생성 — 제목 필드명이 빈 문자열("")임에 주의
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
            "": { title: [{ text: { content: `${user}_${month}_${cat}` } }] },
            카테고리: { select: { name: cat } },
            예산금액: { number: Number(amount) },
            사용자: { rich_text: [{ text: { content: user } }] },
            월: { rich_text: [{ text: { content: month } }] },
          },
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        console.error("Notion create error:", JSON.stringify(createData));
        return res.status(createRes.status).json({ error: createData });
      }
      return res.status(200).json({ id: createData.id, ok: true });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
