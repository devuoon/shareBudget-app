const DB_ID = "e10dffa0f872481b8a26e6027f40e279";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const { user, month } = req.query;
  if (!month) return res.status(400).json({ error: "month required" });

  const startDate = `${month}-01`;
  const [y, m] = month.split("-");
  const lastDay = new Date(+y, +m, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  const andFilters = [
    { property: "날짜", date: { on_or_after: startDate } },
    { property: "날짜", date: { on_or_before: endDate } },
  ];
  if (user) {
    andFilters.push({ property: "사용자", rich_text: { equals: user } });
  }

  try {
    let allResults = [];
    let cursor = undefined;
    do {
      const body = {
        filter: { and: andFilters },
        sorts: [{ property: "날짜", direction: "ascending" }],
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      };
      const response = await fetch(
        `https://api.notion.com/v1/databases/${DB_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (!response.ok)
        return res.status(response.status).json({ error: data });
      allResults = allResults.concat(data.results);
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    const txList = allResults.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        type: p["유형"]?.select?.name === "수입" ? "income" : "expense",
        amount: p["금액"]?.number || 0,
        date: p["날짜"]?.date?.start || "",
        cat: p["카테고리"]?.select?.name || "기타",
        desc: p["제목"]?.title?.[0]?.text?.content || "",
        user: p["사용자"]?.rich_text?.[0]?.text?.content || "",
      };
    });

    return res.status(200).json({ txList });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
