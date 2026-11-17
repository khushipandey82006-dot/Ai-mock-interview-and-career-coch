import { gemini } from '../../../lib/gemini';
export const maxDuration = 30;

export async function POST(req) {
  try {
    const b = await req.json();
    const who = `${b.type} interview for a ${b.role} role, candidate level: ${b.level}`;
    let p;
    if (b.action === 'question') {
      p = `You are a realistic interviewer running a ${who}. Ask question ${b.n} of ${b.total}. Do not repeat: ${JSON.stringify(b.asked || [])}. Return JSON: {"question":"..."}`;
    } else if (b.action === 'evaluate') {
      p = `You are a strict but kind interview coach. ${who}.
Question: ${String(b.q).slice(0, 500)}
Candidate answer: ${String(b.a).slice(0, 3000)}
Score 0-10 for accuracy, clarity, depth. Return JSON: {"accuracy":n,"clarity":n,"depth":n,"feedback":"2-3 actionable sentences","improvement":"a stronger sample answer in 3 sentences"}`;
    } else {
      p = `A candidate finished a mock ${who}. Per-question scores [accuracy, clarity, depth]: ${JSON.stringify(b.summary)}.
Return JSON: {"strengths":["..."],"weaknesses":["..."],"plan":["3-4 concrete next steps"],"roles":["2-3 suitable career paths"]}`;
    }
    return Response.json(await gemini(p));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
