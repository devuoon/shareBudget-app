const DB_ID = "6c72c9d8ebff4d6b954b4b78a4f0cb25";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

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
          sorts: [{ property: "가입일", direction: "ascending" }],
          page_size: 100,
        }),
      },
    );
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });

    const members = data.results
      .map((page) => {
        const p = page.properties;
        return {
          nickname: p["닉네임"]?.title?.[0]?.text?.content || "",
          joinedAt: p["가입일"]?.date?.start || "",
        };
      })
      .filter((m) => m.nickname);

    return res.status(200).json({ members });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
