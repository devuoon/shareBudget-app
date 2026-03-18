// api/tx-save.js
// 거래 내역을 Notion DB에 저장

const DB_ID = 'e10dffa0f872481b8a26e6027f40e279';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, amount, date, cat, desc, user } = req.body;
  if (!type || !amount || !date || !user) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: DB_ID },
        properties: {
          '제목': { title: [{ text: { content: desc || cat } }] },
          '유형': { select: { name: type === 'income' ? '수입' : '지출' } },
          '금액': { number: amount },
          '카테고리': { select: { name: cat } },
          '사용자': { rich_text: [{ text: { content: user } }] },
          '날짜': { date: { start: date } },
          '메모': { rich_text: [{ text: { content: desc || '' } }] },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });
    return res.status(200).json({ id: data.id, ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
