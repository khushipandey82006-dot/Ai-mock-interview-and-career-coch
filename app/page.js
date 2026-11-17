'use client';
import { useState, useEffect } from 'react';

const TOTAL = 5;
const call = async (b) => {
  const r = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
};
const List = ({ t, items }) => items?.length ? (<><h2>{t}</h2><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></>) : null;

export default function Home() {
  const [view, setView] = useState('home');
  const [cfg, setCfg] = useState({ role: 'Software Engineer', type: 'Technical', level: 'Fresher' });
  const [qs, setQs] = useState([]);
  const [ans, setAns] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [hist, setHist] = useState([]);
  const [tips, setTips] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => { try { setHist(JSON.parse(localStorage.getItem('hist') || '[]')); } catch {} }, []);
  const run = async (fn) => { setBusy(true); setErr(''); try { await fn(); } catch (e) { setErr(e.message); } setBusy(false); };
  const nextQ = (list) => call({ action: 'question', ...cfg, n: list.length + 1, total: TOTAL, asked: list.map((x) => x.q) }).then((d) => setQs([...list, { q: d.question }]));

  const start = () => run(async () => { setTips(null); setAns(''); setQs([]); await nextQ([]); setView('interview'); });
  const cur = qs[qs.length - 1];
  const submit = () => run(async () => {
    const ev = await call({ action: 'evaluate', ...cfg, q: cur.q, a: ans });
    setQs(qs.map((x, i) => (i === qs.length - 1 ? { ...x, a: ans, ev } : x)));
  });
  const next = () => run(async () => { setAns(''); await nextQ(qs); });
  const finish = () => run(async () => {
    const avg = +(qs.reduce((s, x) => s + (x.ev.accuracy + x.ev.clarity + x.ev.depth) / 3, 0) / qs.length).toFixed(1);
    const g = await call({ action: 'guidance', ...cfg, summary: qs.map((x) => ({ q: x.q, scores: [x.ev.accuracy, x.ev.clarity, x.ev.depth] })) });
    const h = [...hist, { date: new Date().toLocaleDateString(), role: cfg.role, type: cfg.type, avg }];
    setHist(h); setScore(avg); setTips(g);
    try { localStorage.setItem('hist', JSON.stringify(h)); } catch {}
    setView('result');
  });

  return (
    <div className="wrap">
      <nav>
        <b>🎯 AI Mock Interview Coach</b>
        <div><button className="g" onClick={() => setView('home')}>Practice</button><button className="g" onClick={() => setView('progress')}>Progress</button></div>
      </nav>

      {view === 'home' && (<div className="card">
        <h1>Practice interviews. Get instant feedback.</h1>
        <p className="m">AI-driven technical and HR mock interviews, scored on accuracy, clarity and depth, with personalised career guidance.</p>
        <label>Target role</label><input value={cfg.role} onChange={(e) => setCfg({ ...cfg, role: e.target.value })} />
        <div className="row">
          <div><label>Interview type</label><select value={cfg.type} onChange={(e) => setCfg({ ...cfg, type: e.target.value })}><option>Technical</option><option>HR</option></select></div>
          <div><label>Level</label><select value={cfg.level} onChange={(e) => setCfg({ ...cfg, level: e.target.value })}><option>Fresher</option><option>1-3 years</option><option>3+ years</option></select></div>
        </div>
        {err && <div className="err">{err}</div>}
        <p></p><button disabled={busy || !cfg.role.trim()} onClick={start}>{busy ? 'Preparing…' : `Start ${TOTAL}-question interview`}</button>
      </div>)}

      {view === 'interview' && cur && (<div className="card">
        <div className="bar"><i style={{ width: `${(qs.length / TOTAL) * 100}%` }} /></div>
        <p className="m">Question {qs.length} of {TOTAL} · {cfg.type}</p>
        <h2>{cur.q}</h2>
        <textarea placeholder="Type your answer…" value={ans} disabled={!!cur.ev || busy} onChange={(e) => setAns(e.target.value)} />
        {err && <div className="err">{err}</div>}
        {!cur.ev && <p><button disabled={busy || ans.trim().length < 10} onClick={submit}>{busy ? 'Evaluating…' : 'Submit answer'}</button></p>}
        {cur.ev && (<>
          <div className="sc">{['accuracy', 'clarity', 'depth'].map((k) => <div key={k}><b>{cur.ev[k]}/10</b><span>{k}</span></div>)}</div>
          <p>{cur.ev.feedback}</p>
          <p className="m"><b>Stronger answer:</b> {cur.ev.improvement}</p>
          <button disabled={busy} onClick={qs.length === TOTAL ? finish : next}>{busy ? 'Please wait…' : qs.length === TOTAL ? 'Finish & get career guidance' : 'Next question'}</button>
        </>)}
      </div>)}

      {view === 'result' && (<div className="card">
        <h1>Session complete</h1>
        <div className="big">{score}/10</div><p className="m">Average score for this session</p>
        {tips && (<><List t="Strengths" items={tips.strengths} /><List t="Areas to improve" items={tips.weaknesses} /><List t="Your action plan" items={tips.plan} /><List t="Career paths to explore" items={tips.roles} /></>)}
        <button onClick={() => setView('home')}>Practice again</button>
      </div>)}

      {view === 'progress' && (<div className="card">
        <h1>Your progress</h1>
        {hist.length === 0 ? <p className="m">No sessions yet. Complete one interview to see your trend.</p> : (<>
          <div className="hist">{hist.slice(-12).map((h, i) => <div key={i} style={{ height: `${h.avg * 10}%` }} title={`${h.date} · ${h.role}`}><span>{h.avg}</span></div>)}</div>
          <p className="m">Last {Math.min(hist.length, 12)} sessions · best {Math.max(...hist.map((h) => h.avg))}/10</p>
          <ul>{[...hist].reverse().slice(0, 8).map((h, i) => <li key={i}>{h.date} — {h.role} ({h.type}): {h.avg}/10</li>)}</ul>
        </>)}
      </div>)}
    </div>
  );
}
