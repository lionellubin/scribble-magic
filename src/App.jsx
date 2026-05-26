import { useState, useRef, useCallback, useEffect } from "react";

// ─── BRAND ────────────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#6C3FD4",
  primaryDark: "#4e2da0",
  primaryLight: "#9B72EF",
  gold: "#FFD700",
  goldDark: "#F0A500",
  bg: "#0D0B1A",
  bgCard: "#16122A",
  bgCardLight: "#1E1838",
  text: "#F0EAFF",
  textMuted: "#8B7DB0",
  accent: "#FF6B9D",
};

// ─── PROMPTS ──────────────────────────────────────────────────────────────────
const STORY_SYSTEM = `You are a magical storybook creator for Scribble Magic. A child has written a story by hand.

Your tasks:
1. Transcribe the child's EXACT words — preserve ALL spelling mistakes, invented words, odd punctuation. Fix NOTHING.
2. Invent a short charming title (3-6 words) if not obvious.
3. Break into 4-6 pages (1-3 sentences each).
4. For each page write a vivid illustration description: warm, whimsical, watercolor storybook style. Be specific about characters, setting, colors, mood.

Respond ONLY with valid JSON, no markdown fences:
{
  "title": "Story Title Here",
  "pages": [
    {
      "text": "Exact child words...",
      "illustrationPrompt": "A detailed scene description..."
    }
  ]
}`;

// ─── API HELPERS ──────────────────────────────────────────────────────────────
async function callClaude(imageBase64, mediaType) {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: STORY_SYSTEM,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: "Create a storybook from this child's handwritten story." }
        ]
      }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const raw = data.content.map(b => b.text || "").join("");
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function generateIllustration(prompt, pageIndex) {
  const colors = [
    "deep purples and gold", "soft pinks and sky blue", "emerald greens and amber",
    "midnight blue and silver", "coral and lavender", "teal and rose gold"
  ];
  const palette = colors[pageIndex % colors.length];
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Create a beautiful children's storybook SVG illustration for this scene: ${prompt}

Color palette: ${palette}. Style: whimsical watercolor, soft gradients, dreamy atmosphere.

Create a detailed SVG (viewBox="0 0 400 300") with:
- A rich layered background (sky, ground, environment)
- Main characters or objects from the scene
- Decorative magical elements (stars, sparkles, flowers, clouds)
- Soft gradient fills and overlapping semi-transparent shapes for depth
- Warm, joyful, child-friendly aesthetic
- Multiple layers of detail

Respond ONLY with raw SVG starting <svg and ending </svg>. No explanation.`
      }]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const raw = data.content.map(b => b.text || "").join("");
  const match = raw.match(/<svg[\s\S]*<\/svg>/i);
  return match ? match[0] : null;
}

// ─── STAR FIELD ───────────────────────────────────────────────────────────────
function StarField() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    delay: Math.random() * 4,
    dur: Math.random() * 3 + 2,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute",
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          borderRadius: "50%",
          background: "white",
          opacity: 0.4,
          animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size = "md" }) {
  const sizes = { sm: { emoji: "28px", text: "20px" }, md: { emoji: "40px", text: "28px" }, lg: { emoji: "60px", text: "42px" } };
  const sz = sizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
      <span style={{ fontSize: sz.emoji, filter: "drop-shadow(0 0 12px rgba(255,215,0,0.8))", animation: "float 3s ease-in-out infinite" }}>🪄</span>
      <span style={{
        fontFamily: "'Baloo 2', cursive",
        fontSize: sz.text,
        fontWeight: 800,
        background: `linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.primaryLight} 60%, ${BRAND.accent} 100%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "-0.5px",
      }}>Scribble Magic</span>
    </div>
  );
}

// ─── ILLUSTRATION PANEL ───────────────────────────────────────────────────────
function IllustrationPanel({ svgContent, isLoading, pageIndex }) {
  const gradients = [
    "linear-gradient(135deg,#1a0533,#2d1b69)", "linear-gradient(135deg,#0a1628,#1a3a5c)",
    "linear-gradient(135deg,#0d2818,#1a4a2e)", "linear-gradient(135deg,#1a0a0a,#3d1515)",
    "linear-gradient(135deg,#1a1528,#2a2050)", "linear-gradient(135deg,#0a1a1a,#0d3333)",
  ];
  return (
    <div style={{
      background: gradients[pageIndex % gradients.length],
      borderRadius: "16px",
      width: "100%",
      aspectRatio: "4/3",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
      border: `1px solid rgba(108,63,212,0.3)`,
    }}>
      {isLoading ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", animation: "spin 1.5s linear infinite", display: "inline-block" }}>🎨</div>
          <p style={{ fontFamily: "'Quicksand',sans-serif", fontSize: "13px", color: BRAND.textMuted, margin: "10px 0 0" }}>Painting your illustration...</p>
        </div>
      ) : svgContent && svgContent !== "error" ? (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          dangerouslySetInnerHTML={{ __html: svgContent }} />
      ) : (
        <div style={{ textAlign: "center", opacity: 0.5 }}>
          <div style={{ fontSize: "52px" }}>🌟</div>
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3) 100%)", pointerEvents: "none" }} />
    </div>
  );
}

// ─── BOOK COVER ───────────────────────────────────────────────────────────────
function BookCover({ title, onFlip }) {
  return (
    <div onClick={onFlip} style={{
      background: `linear-gradient(145deg, ${BRAND.primaryDark} 0%, ${BRAND.primary} 50%, ${BRAND.primaryLight} 100%)`,
      borderRadius: "8px 24px 24px 8px",
      padding: "56px 40px",
      textAlign: "center",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden",
      boxShadow: `inset -6px 0 20px rgba(0,0,0,0.3), 0 24px 80px rgba(108,63,212,0.5)`,
      minHeight: "380px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      border: `1px solid rgba(255,215,0,0.2)`,
    }}>
      <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:"50%", background:"rgba(255,215,0,0.07)" }} />
      <div style={{ position:"absolute", bottom:-80, left:-40, width:240, height:240, borderRadius:"50%", background:"rgba(255,107,157,0.06)" }} />
      {[{t:"12%",l:"8%"},{t:"20%",r:"10%"},{t:"70%",l:"12%"},{t:"75%",r:"8%"}].map((pos,i)=>(
        <div key={i} style={{ position:"absolute", fontSize:"16px", opacity:0.6, animation:`twinkle ${2+i*0.5}s ease-in-out infinite`, ...pos }}>✦</div>
      ))}
      <div style={{ fontSize:"72px", marginBottom:"24px", filter:"drop-shadow(0 0 20px rgba(255,215,0,0.6))", animation:"float 3s ease-in-out infinite" }}>🪄</div>
      <h1 style={{
        fontFamily:"'Baloo 2',cursive",
        fontWeight:800,
        fontSize:"clamp(20px,5vw,30px)",
        color:"white",
        margin:"0 0 8px",
        textShadow:"0 2px 16px rgba(0,0,0,0.4)",
        lineHeight:1.2,
      }}>{title}</h1>
      <p style={{ fontFamily:"'Quicksand',sans-serif", fontSize:"13px", color:"rgba(255,255,255,0.6)", margin:"0 0 36px", fontStyle:"italic" }}>
        A Scribble Magic Original ✨
      </p>
      <div style={{
        background:"rgba(255,215,0,0.15)",
        border:"2px solid rgba(255,215,0,0.5)",
        borderRadius:"50px",
        padding:"12px 32px",
        color:BRAND.gold,
        fontFamily:"'Baloo 2',cursive",
        fontWeight:700,
        fontSize:"16px",
        letterSpacing:"1px",
        backdropFilter:"blur(4px)",
      }}>Open the Book →</div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ScribbleMagic() {
  const [screen, setScreen] = useState("home");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMediaType, setImageMediaType] = useState("image/jpeg");
  const [storyData, setStoryData] = useState(null);
  const [illustrations, setIllustrations] = useState({});
  const [currentPage, setCurrentPage] = useState(-1);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [loadingDot, setLoadingDot] = useState(0);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (screen !== "loading") return;
    const t = setInterval(() => setLoadingDot(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, [screen]);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImageBase64(e.target.result.split(",")[1]);
      setImageMediaType(file.type || "image/jpeg");
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const makeStorybook = async () => {
    if (!imageBase64) return;
    setScreen("loading");
    setError(null);
    setIllustrations({});
    setCurrentPage(-1);
    try {
      setLoadingMsg("Reading your child's handwriting");
      const data = await callClaude(imageBase64, imageMediaType);
      setStoryData(data);
      setLoadingMsg("Bringing illustrations to life");
      setScreen("book");
      data.pages.forEach((page, i) => {
        setIllustrations(prev => ({ ...prev, [i]: "loading" }));
        generateIllustration(page.illustrationPrompt, i)
          .then(svg => setIllustrations(prev => ({ ...prev, [i]: svg || "error" })))
          .catch(() => setIllustrations(prev => ({ ...prev, [i]: "error" })));
      });
    } catch (e) {
      setError("Couldn't read the story. Make sure the photo is well-lit and try again!");
      setScreen("home");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Scribble Magic", text: `My child wrote a story and Scribble Magic turned it into a magical storybook! ✨`, url: window.location.href });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    } catch {}
  };

  const handleDownloadPDF = () => {
    const pages = storyData?.pages || [];
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${storyData?.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Quicksand:wght@500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0D0B1A;font-family:'Quicksand',sans-serif;color:#F0EAFF}
.cover{width:100vw;height:100vh;background:linear-gradient(145deg,#4e2da0,#6C3FD4,#9B72EF);display:flex;flex-direction:column;align-items:center;justify-content:center;page-break-after:always;text-align:center;padding:60px}
.cover-emoji{font-size:90px;margin-bottom:28px;filter:drop-shadow(0 0 24px rgba(255,215,0,0.7))}
.cover h1{font-family:'Baloo 2',cursive;font-size:52px;font-weight:800;color:white;margin-bottom:16px;text-shadow:0 2px 16px rgba(0,0,0,0.4);line-height:1.2}
.cover p{font-size:18px;color:rgba(255,255,255,0.6);font-style:italic}
.cover .badge{margin-top:36px;border:2px solid rgba(255,215,0,0.5);border-radius:50px;padding:12px 36px;color:#FFD700;font-family:'Baloo 2',cursive;font-size:18px;font-weight:700}
.page{width:100vw;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;page-break-after:always;background:#0D0B1A}
.page-num{font-size:11px;color:#8B7DB0;text-transform:uppercase;letter-spacing:3px;margin-bottom:24px}
.page-text{font-size:30px;line-height:1.9;text-align:center;color:#F0EAFF;background:#16122A;padding:40px 52px;border-radius:20px;border-left:5px solid #6C3FD4;max-width:760px;box-shadow:0 8px 40px rgba(108,63,212,0.2)}
.end{width:100vw;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0D0B1A;text-align:center}
.end h2{font-family:'Baloo 2',cursive;font-size:64px;font-weight:800;background:linear-gradient(135deg,#FFD700,#9B72EF,#FF6B9D);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.end p{font-size:18px;color:#8B7DB0;margin-top:16px}
.end .logo{font-family:'Baloo 2',cursive;font-size:22px;font-weight:800;color:#6C3FD4;margin-top:40px}
</style></head>
<body>
<div class="cover">
  <div class="cover-emoji">🪄</div>
  <h1>${storyData?.title || "My Story"}</h1>
  <p>A Scribble Magic Original ✨</p>
  <div class="badge">Scribble Magic</div>
</div>
${pages.map((p,i) => `<div class="page"><div class="page-num">Page ${i+1} of ${pages.length}</div><div class="page-text">${p.text}</div></div>`).join("")}
<div class="end">
  <h2>The End ✨</h2>
  <p>A masterpiece by a brilliant young author ⭐</p>
  <div class="logo">🪄 Scribble Magic</div>
</div>
</body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 900);
  };

  const resetApp = () => {
    setScreen("home");
    setStoryData(null);
    setImage(null);
    setImageBase64(null);
    setIllustrations({});
    setCurrentPage(-1);
  };

  const totalPages = storyData?.pages?.length || 0;
  const isOnCover = currentPage === -1;
  const isLastPage = currentPage === totalPages - 1;

  // ── GLOBAL STYLES ─────────────────────────────────────────────────────────
  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Quicksand:wght@500;600;700&display=swap');
    *{box-sizing:border-box}
    body{margin:0}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    @keyframes twinkle{0%,100%{opacity:0.2;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(108,63,212,0.4)}50%{box-shadow:0 0 0 12px rgba(108,63,212,0)}}
    .upload-zone:hover{border-color:${BRAND.primary}!important;background:rgba(108,63,212,0.05)!important}
    .go-btn:hover{transform:translateY(-3px)!important;filter:brightness(1.1)}
    .go-btn:active{transform:translateY(0)!important}
    .action-btn:hover{transform:translateY(-2px);filter:brightness(1.08)}
    .nav-btn:hover:not(:disabled){background:${BRAND.primary}!important;color:white!important;border-color:${BRAND.primary}!important}
    .dot-nav:hover{transform:scale(1.3)}
    .feature-pill:hover{transform:translateY(-3px);border-color:${BRAND.primary}!important}
  `;

  // ── LOADING SCREEN ────────────────────────────────────────────────────────
  if (screen === "loading") return (
    <div style={{ background: BRAND.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <style>{globalStyles}</style>
      <StarField />
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "80px", animation: "float 2s ease-in-out infinite", filter: "drop-shadow(0 0 24px rgba(255,215,0,0.7))" }}>🪄</div>
        <h2 style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: "28px", color: BRAND.text, margin: "24px 0 10px" }}>
          {loadingMsg}{".".repeat(loadingDot)}
        </h2>
        <p style={{ color: BRAND.textMuted, fontSize: "15px", fontFamily: "'Quicksand',sans-serif" }}>This takes about 30 seconds ✨</p>
        <div style={{ marginTop: "32px", display: "flex", gap: "8px", justifyContent: "center" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:10, height:10, borderRadius:"50%", background: BRAND.primary, animation:`twinkle 1.2s ${i*0.2}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── BOOK SCREEN ───────────────────────────────────────────────────────────
  if (screen === "book" && storyData) {
    const page = !isOnCover ? storyData.pages[currentPage] : null;
    const illus = !isOnCover ? illustrations[currentPage] : null;

    return (
      <div style={{ background: BRAND.bg, minHeight: "100vh", position: "relative" }}>
        <style>{globalStyles}</style>
        <StarField />

        {shareToast && (
          <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:BRAND.primary, color:"white", borderRadius:"50px", padding:"12px 24px", fontFamily:"'Quicksand',sans-serif", fontWeight:700, fontSize:"14px", zIndex:100, boxShadow:"0 8px 32px rgba(108,63,212,0.5)", animation:"fadeUp 0.3s ease" }}>
            ✓ Link copied — share the magic!
          </div>
        )}

        <div style={{ position:"sticky", top:0, zIndex:10, background:"rgba(13,11,26,0.85)", backdropFilter:"blur(12px)", borderBottom:`1px solid rgba(108,63,212,0.2)`, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={resetApp} style={{ background:"none", border:"none", color:BRAND.textMuted, fontSize:"13px", cursor:"pointer", fontFamily:"'Quicksand',sans-serif", fontWeight:600 }}>← New Story</button>
          <Logo size="sm" />
          <button onClick={handleShare} style={{ background:`linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight})`, border:"none", color:"white", borderRadius:"20px", padding:"8px 18px", fontSize:"13px", cursor:"pointer", fontFamily:"'Baloo 2',cursive", fontWeight:700 }}>
            Share 🔗
          </button>
        </div>

        <div style={{ maxWidth:"680px", margin:"0 auto", padding:"24px 16px 60px", position:"relative", zIndex:1 }}>

          {isOnCover ? (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <BookCover title={storyData.title} onFlip={() => setCurrentPage(0)} />
            </div>
          ) : (
            <div style={{ animation:"fadeUp 0.35s ease" }}>
              <div style={{ background:BRAND.bgCard, borderRadius:"24px", overflow:"hidden", border:`1px solid rgba(108,63,212,0.25)`, boxShadow:`0 24px 80px rgba(0,0,0,0.4)` }}>
                <div style={{ padding:"16px 16px 0" }}>
                  <IllustrationPanel svgContent={illus === "loading" || illus === "error" ? null : illus} isLoading={illus === "loading"} pageIndex={currentPage} />
                </div>
                <div style={{ padding:"22px 26px 28px" }}>
                  <p style={{ fontSize:"11px", color:BRAND.textMuted, textTransform:"uppercase", letterSpacing:"2.5px", margin:"0 0 14px", fontFamily:"'Quicksand',sans-serif" }}>
                    Page {currentPage + 1} of {totalPages}
                  </p>
                  <p style={{
                    fontFamily:"'Quicksand',sans-serif",
                    fontSize:"clamp(17px,4vw,22px)",
                    lineHeight:"1.85",
                    color:BRAND.text,
                    margin:0,
                    background:BRAND.bgCardLight,
                    borderLeft:`4px solid ${BRAND.primary}`,
                    padding:"18px 20px",
                    borderRadius:"0 16px 16px 0",
                    fontWeight:600,
                  }}>{page.text}</p>
                </div>
              </div>

              {isLastPage && (
                <div style={{ marginTop:"20px", background:`linear-gradient(135deg, ${BRAND.bgCard}, ${BRAND.bgCardLight})`, border:`2px dashed rgba(108,63,212,0.4)`, borderRadius:"20px", padding:"32px", textAlign:"center", animation:"fadeUp 0.5s ease 0.2s both" }}>
                  <div style={{ fontSize:"52px", marginBottom:"10px", filter:"drop-shadow(0 0 16px rgba(255,215,0,0.6))" }}>✨</div>
                  <h3 style={{ fontFamily:"'Baloo 2',cursive", fontWeight:800, fontSize:"28px", background:`linear-gradient(135deg,${BRAND.gold},${BRAND.primaryLight})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:"0 0 6px" }}>The End!</h3>
                  <p style={{ color:BRAND.textMuted, fontSize:"14px", margin:0, fontFamily:"'Quicksand',sans-serif" }}>A masterpiece by a brilliant young author ⭐</p>
                </div>
              )}
            </div>
          )}

          <div style={{ display:"flex", gap:"12px", alignItems:"center", justifyContent:"center", marginTop:"22px" }}>
            <button className="nav-btn"
              onClick={() => setCurrentPage(p => Math.max(-1, p-1))}
              disabled={isOnCover}
              style={{ padding:"12px 22px", borderRadius:"12px", border:`2px solid rgba(108,63,212,0.4)`, background:"transparent", color:BRAND.primaryLight, fontSize:"16px", cursor:isOnCover?"not-allowed":"pointer", opacity:isOnCover?0.25:1, fontFamily:"'Baloo 2',cursive", fontWeight:700, transition:"all 0.15s" }}>
              ←
            </button>
            <div style={{ display:"flex", gap:"7px", alignItems:"center" }}>
              <div className="dot-nav" onClick={() => setCurrentPage(-1)} style={{ width:isOnCover?14:9, height:isOnCover?14:9, borderRadius:"50%", background:isOnCover?BRAND.gold:BRAND.textMuted, cursor:"pointer", transition:"all 0.2s" }} />
              {storyData.pages.map((_, i) => (
                <div key={i} className="dot-nav" onClick={() => setCurrentPage(i)} style={{ width:currentPage===i?14:9, height:currentPage===i?14:9, borderRadius:"50%", background:currentPage===i?BRAND.gold:BRAND.textMuted, cursor:"pointer", transition:"all 0.2s" }} />
              ))}
            </div>
            <button className="nav-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages-1, p+1))}
              disabled={isLastPage}
              style={{ padding:"12px 22px", borderRadius:"12px", border:`2px solid rgba(108,63,212,0.4)`, background:"transparent", color:BRAND.primaryLight, fontSize:"16px", cursor:isLastPage?"not-allowed":"pointer", opacity:isLastPage?0.25:1, fontFamily:"'Baloo 2',cursive", fontWeight:700, transition:"all 0.15s" }}>
              →
            </button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginTop:"24px" }}>
            <button className="action-btn" onClick={handleDownloadPDF} style={{ padding:"18px", background:`linear-gradient(135deg,${BRAND.primary},${BRAND.primaryDark})`, color:"white", border:"none", borderRadius:"16px", fontSize:"15px", fontFamily:"'Baloo 2',cursive", fontWeight:700, cursor:"pointer", boxShadow:`0 6px 24px rgba(108,63,212,0.4)`, transition:"all 0.2s", letterSpacing:"0.3px" }}>
              📄 Download PDF
            </button>
            <button className="action-btn" onClick={handleShare} style={{ padding:"18px", background:`linear-gradient(135deg,${BRAND.gold},${BRAND.goldDark})`, color:"#1a1000", border:"none", borderRadius:"16px", fontSize:"15px", fontFamily:"'Baloo 2',cursive", fontWeight:700, cursor:"pointer", boxShadow:`0 6px 24px rgba(255,215,0,0.3)`, transition:"all 0.2s", letterSpacing:"0.3px" }}>
              🔗 Share Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── HOME SCREEN ───────────────────────────────────────────────────────────
  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh", position: "relative" }}>
      <style>{globalStyles}</style>
      <StarField />

      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"0 16px 80px", position:"relative", zIndex:1 }}>

        <div style={{ textAlign:"center", padding:"52px 20px 40px", animation:"fadeUp 0.5s ease" }}>
          <Logo size="lg" />
          <p style={{ fontFamily:"'Quicksand',sans-serif", fontWeight:600, fontSize:"16px", color:BRAND.textMuted, margin:"16px 0 0", letterSpacing:"0.2px" }}>
            Your child's stories, magically brought to life. ✨
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"36px", animation:"fadeUp 0.5s ease 0.1s both" }}>
          {[
            { emoji:"📸", step:"1", title:"Snap It", desc:"Photo of their handwritten story" },
            { emoji:"🪄", step:"2", title:"Watch Magic", desc:"AI reads & illustrates each page" },
            { emoji:"🎁", step:"3", title:"Share & Save", desc:"Download PDF or share with family" },
          ].map((f,i) => (
            <div key={i} className="feature-pill" style={{ background:BRAND.bgCard, borderRadius:"18px", padding:"20px 14px", textAlign:"center", border:`1px solid rgba(108,63,212,0.2)`, transition:"all 0.2s", cursor:"default" }}>
              <div style={{ fontSize:"30px", marginBottom:"8px" }}>{f.emoji}</div>
              <p style={{ fontFamily:"'Baloo 2',cursive", fontWeight:700, fontSize:"14px", color:BRAND.primaryLight, margin:"0 0 4px" }}>{f.title}</p>
              <p style={{ fontSize:"11px", color:BRAND.textMuted, margin:0, lineHeight:1.4, fontFamily:"'Quicksand',sans-serif" }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div
          className="upload-zone"
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileRef.current.click()}
          style={{
            border:`2px dashed ${dragging ? BRAND.primary : "rgba(108,63,212,0.35)"}`,
            borderRadius:"24px",
            padding: image ? "20px" : "52px 24px",
            textAlign:"center",
            cursor:"pointer",
            background: dragging ? "rgba(108,63,212,0.08)" : BRAND.bgCard,
            transition:"all 0.2s",
            marginBottom:"16px",
            animation:"fadeUp 0.5s ease 0.2s both",
          }}>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
          {image ? (
            <div>
              <img src={image} alt="uploaded" style={{ maxHeight:"220px", maxWidth:"100%", borderRadius:"14px", boxShadow:`0 8px 32px rgba(0,0,0,0.4)`, border:`1px solid rgba(108,63,212,0.3)` }} />
              <p style={{ color:BRAND.primaryLight, margin:"14px 0 0", fontSize:"14px", fontFamily:"'Quicksand',sans-serif", fontWeight:600 }}>✓ Story ready — tap to change photo</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize:"52px", marginBottom:"14px", animation:"float 3s ease-in-out infinite", filter:`drop-shadow(0 0 16px rgba(108,63,212,0.6))` }}>📷</div>
              <p style={{ fontFamily:"'Baloo 2',cursive", fontWeight:700, fontSize:"20px", color:BRAND.text, margin:"0 0 8px" }}>Upload a photo</p>
              <p style={{ fontSize:"14px", color:BRAND.textMuted, margin:0, fontFamily:"'Quicksand',sans-serif" }}>of your child's handwritten story<br/>Drag & drop or tap to browse • Works on mobile too</p>
            </>
          )}
        </div>

        {error && (
          <div style={{ background:"rgba(255,107,107,0.1)", border:"2px solid rgba(255,107,107,0.3)", borderRadius:"14px", padding:"14px 18px", color:"#ff8080", fontSize:"14px", textAlign:"center", marginBottom:"14px", fontFamily:"'Quicksand',sans-serif" }}>
            {error}
          </div>
        )}

        <button
          className="go-btn"
          onClick={makeStorybook}
          disabled={!image}
          style={{
            width:"100%", padding:"22px",
            background: image ? `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 50%, ${BRAND.accent} 100%)` : BRAND.bgCard,
            backgroundSize: image ? "200% auto" : "auto",
            color: image ? "white" : BRAND.textMuted,
            border:"none", borderRadius:"18px",
            fontSize:"20px", fontFamily:"'Baloo 2',cursive", fontWeight:800,
            cursor: image ? "pointer" : "not-allowed",
            boxShadow: image ? `0 8px 32px rgba(108,63,212,0.45)` : "none",
            transition:"all 0.25s",
            letterSpacing:"0.5px",
            animation: image ? "pulse 2s ease-in-out infinite, fadeUp 0.5s ease 0.3s both" : "fadeUp 0.5s ease 0.3s both",
          }}>
          🪄 Create My Storybook!
        </button>

        <div style={{ textAlign:"center", marginTop:"36px", animation:"fadeUp 0.5s ease 0.4s both" }}>
          <p style={{ fontSize:"13px", color:BRAND.textMuted, margin:"0 0 16px", fontFamily:"'Quicksand',sans-serif" }}>
            Spelling mistakes preserved — exactly as your child wrote it 💜
          </p>
          <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap" }}>
            {["Free to use","No account needed","Shareable with family","Download as PDF"].map(t => (
              <span key={t} style={{ background:BRAND.bgCard, border:`1px solid rgba(108,63,212,0.25)`, borderRadius:"20px", padding:"6px 14px", fontSize:"12px", color:BRAND.textMuted, fontFamily:"'Quicksand',sans-serif", fontWeight:600 }}>✦ {t}</span>
            ))}
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:"48px", paddingTop:"24px", borderTop:`1px solid rgba(108,63,212,0.15)` }}>
          <Logo size="sm" />
          <p style={{ fontSize:"12px", color:"rgba(139,125,176,0.5)", margin:"10px 0 0", fontFamily:"'Quicksand',sans-serif" }}>
            Made with ✨ for every young storyteller
          </p>
        </div>
      </div>
    </div>
  );
}
