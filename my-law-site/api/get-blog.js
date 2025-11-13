// api/get-blog.js
const { XMLParser } = require("fast-xml-parser");

// law.html 스크립트에 있던 분류 함수들 (그대로 가져옴)
const stripHtml = (h) => (h || "").replace(/<[^>]*>/g, "");
const dateYmd = (dt) => {
  const d = new Date(dt);
  return isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const classifyTag = (title, desc) => {
  const t = (title + " " + desc).toLowerCase();
  if (/(의료|환자|진료|오진|수술|감정)/.test(t)) return "의료";
  if (/(행정|면허|자격정지|심판)/.test(t)) return "행정";
  if (/(형사|벌금|기소|피의자)/.test(t)) return "형사";
  return "기타";
};
const normalize = ({ title, link, date, desc }) => {
  const tag = classifyTag(title || "", desc || "");
  return { title: title || "(제목 없음)", link, date: date || new Date().toISOString(), ymd: dateYmd(date || Date.now()), desc: (desc || "").trim(), tag };
};

// Vercel이 이 함수를 실행시킵니다.
export default async function handler(request, response) {
  const BLOG_ID = "logjinkr";
  const RSS_URL = `https://blog.rss.naver.com/${BLOG_ID}.xml`;

  try {
    // 1. 네이버 RSS에 '심부름'
    const rssResponse = await fetch(RSS_URL);
    if (!rssResponse.ok) {
      throw new Error(`Failed to fetch RSS: ${rssResponse.statusText}`);
    }
    const xml = await rssResponse.text();

    // 2. XML을 JSON으로 '번역'
    const parser = new XMLParser();
    const rssJson = parser.parse(xml);
    const items = rssJson?.rss?.channel?.item || [];

    // 3. law.html이 쓰던 형식으로 '가공'
    const posts = items.map((it) => normalize({
      title: it.title,
      link: it.link,
      date: it.pubDate,
      desc: stripHtml(it.description)
    }));

    // 4. 브라우저에 가공한 데이터를 전송
    response.status(200).json(posts);

  } catch (error) {
    console.error(error);
    response.status(500).json({ error: error.message });
  }
}