// Faint point-and-line pattern, echoing the TJL website background.
function rand(seed: number) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647) }

export default function Constellation({ seed = 7 }: { seed?: number }) {
  const r = rand(seed)
  const pts = Array.from({ length: 34 }, () => ({ x: r() * 400, y: r() * 800 }))
  const lines: [number, number][] = []
  pts.forEach((p, i) => {
    pts.forEach((q, j) => { if (j > i && Math.hypot(p.x - q.x, p.y - q.y) < 95 && r() > 0.45) lines.push([i, j]) })
  })
  return (
    <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {lines.map(([a, b], k) => <line key={k} x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y} stroke="#fff" strokeOpacity=".08" strokeWidth=".6" />)}
      {pts.map((p, k) => <circle key={k} cx={p.x} cy={p.y} r={k % 5 ? 0.9 : 1.4} fill="#fff" fillOpacity={k % 5 ? 0.25 : 0.45} />)}
    </svg>
  )
}
