"use client";
import { useState, useEffect } from "react";

interface Template {
  id: number;
  title: string;
  body: string;
  category: string;
  tone: string;
  tags: string[];
  type: "ppv" | "tip" | "engagement" | "upsell" | "reengagement" | "seasonal" | "custom";
}

const CATEGORIES = [
  { key: "all", label: "All", color: "#a8a29e" },
  { key: "ppv", label: "PPV Promos", color: "#4ade80" },
  { key: "tip", label: "Tip Menu", color: "#facc15" },
  { key: "engagement", label: "Engagement", color: "#60a5fa" },
  { key: "upsell", label: "Upsells", color: "#fb923c" },
  { key: "reengagement", label: "Re-engagement", color: "#f87171" },
  { key: "seasonal", label: "Seasonal", color: "#a78bfa" },
  { key: "custom", label: "Custom / Other", color: "#22d3ee" },
];

const TEMPLATES: Template[] = [
  // PPV PROMOS
  { id: 1, title: "New PPV Drop — Teaser", body: "just finished filming something CRAZY 🔥 this one's different... trust me you don't wanna miss it 😈\n\ncheck your DMs in 5 mins... or unlock it now before the price goes up 💕", category: "ppv", tone: "flirty", tags: ["urgency", "teaser"], type: "ppv" },
  { id: 2, title: "Exclusive Behind The Scenes", body: "hey babe 💗 I shot something super special today just for my favs... wanna see what goes on behind the scenes? 👀\n\nunlock to see everything I couldn't post on my wall 🙈", category: "ppv", tone: "intimate", tags: ["exclusive", "bts"], type: "ppv" },
  { id: 3, title: "Limited Time PPV", body: "⏰ 24 HOURS ONLY ⏰\n\nI'm sending this to my top fans only — this set was TOO hot for my wall 🥵\n\nonce it's gone, it's gone. don't say I didn't warn you 😏", category: "ppv", tone: "urgent", tags: ["limited", "urgency", "exclusive"], type: "ppv" },
  { id: 4, title: "PPV Discount Offer", body: "hey love! I never do this but... I'm running a special today 💕\n\nmy newest PPV is 40% off for the next few hours. after that it goes back to full price 😘\n\ntap to unlock before it's too late!", category: "ppv", tone: "friendly", tags: ["discount", "sale"], type: "ppv" },
  { id: 5, title: "Collab PPV Announcement", body: "SO... me and [creator name] finally did it 😏🔥\n\nthis collab is INSANE and you're the first to know. only sending this to my real ones 💦\n\nunlock now — trust me on this one", category: "ppv", tone: "hype", tags: ["collab", "exclusive"], type: "ppv" },
  { id: 6, title: "Try-On / Outfit PPV", body: "just got new outfits and had to try them ALL on for you 👗😈\n\n12 looks... and they get more 🌶️ with each one. the last outfit? let's just say it's barely there 😜\n\nunlock the full try-on now!", category: "ppv", tone: "playful", tags: ["outfit", "try-on"], type: "ppv" },
  { id: 7, title: "Story Time PPV", body: "ok so something happened last night and I HAVE to tell you about it 😳\n\nbut this story comes with visuals... and it's too wild for my wall 🙈\n\nunlock if you wanna hear the whole thing 👀", category: "ppv", tone: "storytelling", tags: ["story", "personal"], type: "ppv" },
  { id: 8, title: "Rate My PPV", body: "I need your honest opinion babe 🥺\n\njust shot something new and idk if it's too much... or not enough? 😏\n\nunlock it and rate it 1-10 in my DMs! best answer gets a surprise 😘", category: "ppv", tone: "interactive", tags: ["interactive", "rating"], type: "ppv" },

  // TIP MENU
  { id: 20, title: "Tip Menu Introduction", body: "🌟 MY TIP MENU 🌟\n\n💕 Tip $5 — Selfie\n💕 Tip $10 — Outfit pic\n💕 Tip $15 — Lingerie pic\n💕 Tip $25 — Surprise video\n💕 Tip $50 — Custom request\n💕 Tip $100 — Video call (10 min)\n\ntip for any of these and I'll send it straight to your DMs! 😘", category: "tip", tone: "friendly", tags: ["menu", "pricing"], type: "tip" },
  { id: 21, title: "Tip If You Want To...", body: "wanna play a game? 😏\n\ntip $5 if you want me to... (pick one)\n🔥 Send a voice note\n🔥 Rate your pic\n🔥 Answer any question honestly\n🔥 Send you something spicy\n\nyour move 😈", category: "tip", tone: "playful", tags: ["game", "interactive"], type: "tip" },
  { id: 22, title: "Tip Goal Countdown", body: "🎯 TIP GOAL 🎯\n\nwe're at $340 / $500!!\n\nwhen we hit $500 I'm dropping something INSANE for everyone who tipped 🔥\n\ndon't miss out — every tip counts! let's get there 💕", category: "tip", tone: "hype", tags: ["goal", "countdown"], type: "tip" },

  // ENGAGEMENT
  { id: 30, title: "Good Morning Check-in", body: "good morning babe ☀️ just woke up thinking about how lucky I am to have fans like you 💗\n\nhow's your day starting? tell me something good 😊", category: "engagement", tone: "warm", tags: ["morning", "casual"], type: "engagement" },
  { id: 31, title: "Poll / Question", body: "ok serious question... 🤔\n\nwhat kind of content do you wanna see more of?\n\n1️⃣ Lingerie sets\n2️⃣ Workout / gym content\n3️⃣ Behind the scenes\n4️⃣ Day in my life\n\ndrop your number below! most popular wins 😘", category: "engagement", tone: "interactive", tags: ["poll", "feedback"], type: "engagement" },
  { id: 32, title: "Would You Rather", body: "let's play would you rather 😏\n\nwould you rather...\nA) get a custom video from me\nB) have a 10 min video call\n\ncomment A or B 👀 winner gets announced tomorrow!", category: "engagement", tone: "playful", tags: ["game", "interactive"], type: "engagement" },
  { id: 33, title: "Appreciation Post", body: "I just wanted to take a sec and say THANK YOU 🥺💕\n\nseriously, the love and support from you guys means everything. you're the reason I do this and I never take that for granted 🤍\n\nwho's been here since day 1? drop a ❤️", category: "engagement", tone: "grateful", tags: ["appreciation", "loyalty"], type: "engagement" },
  { id: 34, title: "This or That", body: "THIS or THAT? 👇\n\n🏖️ Beach photoshoot OR 🏠 Home photoshoot?\n👙 Bikini OR 🖤 Lingerie?\n📸 Photos OR 🎥 Videos?\n😇 Soft & sweet OR 😈 Spicy & wild?\n\ntell me yours! matching answers get a surprise 😘", category: "engagement", tone: "playful", tags: ["game", "this-or-that"], type: "engagement" },
  { id: 35, title: "Ask Me Anything", body: "AMA TIME! 🎤\n\nask me literally ANYTHING — no limits, no judgment 😈\n\nmost creative question gets a free custom 👀\n\ngo!", category: "engagement", tone: "open", tags: ["ama", "interactive"], type: "engagement" },

  // UPSELLS
  { id: 40, title: "VIP / Paid Page Upsell", body: "babe if you think THIS page is good... you haven't seen my VIP page yet 🥵\n\nthat's where the REAL content lives 🔥 no rules, no limits\n\njoin now and I'll send you something special as a welcome gift 💕", category: "upsell", tone: "teaser", tags: ["vip", "upgrade"], type: "upsell" },
  { id: 41, title: "Custom Content Pitch", body: "hey love 💕 did you know I do customs? 🎬\n\ntell me EXACTLY what you want to see and I'll make it happen 😈 your fantasy, your rules\n\nDM me for pricing — first timers get a discount 😘", category: "upsell", tone: "personal", tags: ["custom", "personal"], type: "upsell" },
  { id: 42, title: "Sexting Session Promo", body: "feeling bored tonight? 😏\n\nlet's have some fun... live sexting sessions are open 🔥\n\ntip $30 to start and we'll go as long as you want 😈💦\n\nfirst come first served — I can only take a few tonight", category: "upsell", tone: "direct", tags: ["sexting", "live"], type: "upsell" },
  { id: 43, title: "Bundle Deal", body: "🎁 BUNDLE DEAL 🎁\n\nget ALL 3 of my newest PPVs for the price of 2!\n\nthat's over 15 minutes of exclusive content 🔥\n\nthis deal expires at midnight — grab it while you can 😘", category: "upsell", tone: "promotional", tags: ["bundle", "deal"], type: "upsell" },

  // RE-ENGAGEMENT
  { id: 50, title: "Miss You / Come Back", body: "hey stranger 🥺 haven't heard from you in a while...\n\njust wanted to say I miss talking to you 💕 I've been posting some crazy stuff lately and I wish you could see it\n\ncome back? I'll make it worth your while 😘", category: "reengagement", tone: "soft", tags: ["comeback", "miss-you"], type: "reengagement" },
  { id: 51, title: "Expiring Sub Reminder", body: "babe your sub is about to expire 😱\n\ndon't leave me!! I have SO much planned for this month 🔥\n\nrenew now and I'll send you something exclusive as a thank you 💕", category: "reengagement", tone: "urgent", tags: ["renewal", "expiring"], type: "reengagement" },
  { id: 52, title: "Win-Back Discount", body: "I noticed you haven't been around... so I'm doing something I NEVER do 😏\n\n50% OFF your resub — but only for the next 24 hours ⏰\n\nI've been saving my best content and I want you to see it 🔥💕", category: "reengagement", tone: "exclusive", tags: ["discount", "winback"], type: "reengagement" },
  { id: 53, title: "What Happened?", body: "hey... did I do something wrong? 🥺\n\nyou used to be one of my most active fans and I miss our convos 💔\n\nif there's something you wanna see more of, just tell me — I'm here for YOU 💕", category: "reengagement", tone: "personal", tags: ["personal", "feedback"], type: "reengagement" },

  // SEASONAL
  { id: 60, title: "Valentine's Day", body: "💘 HAPPY VALENTINE'S DAY 💘\n\nsince I can't be your valentine IRL... let me be your virtual one 😏\n\nI have something VERY special dropping today just for you 🌹\n\nwho wants to be my valentine? 🥰", category: "seasonal", tone: "romantic", tags: ["valentines", "holiday"], type: "seasonal" },
  { id: 61, title: "New Year's", body: "HAPPY NEW YEAR babe!! 🎊🥂\n\n2026 is going to be WILD and I'm starting it off right 🔥\n\nnew year, new content, new everything. you ready? 😈\n\nfirst PPV of 2026 dropping in 1 hour...", category: "seasonal", tone: "hype", tags: ["newyear", "holiday"], type: "seasonal" },
  { id: 62, title: "Summer / Hot Girl Summer", body: "HOT GIRL SUMMER IS HERE ☀️🔥\n\njust shot an insane beach set and I'm only sending it to my ride-or-dies 🏖️\n\nunlock to see what I wore (or didn't wear 😏) to the beach", category: "seasonal", tone: "fun", tags: ["summer", "seasonal"], type: "seasonal" },
  { id: 63, title: "Halloween", body: "TRICK OR TREAT 🎃👻\n\nI dressed up as something VERY naughty for Halloween this year 😈\n\nguess my costume and if you're right... you get a free unlock 🔥\n\nhint: it involves stockings 🖤", category: "seasonal", tone: "playful", tags: ["halloween", "holiday"], type: "seasonal" },
  { id: 64, title: "Birthday Month", body: "IT'S MY BIRTHDAY MONTH 🎂🥳\n\nand guess what... YOU get the gifts!\n\n🎁 Free photo set for all active subs\n🎁 50% off customs all month\n🎁 Daily surprise drops\n\nlet's celebrate together! 💕", category: "seasonal", tone: "celebratory", tags: ["birthday", "promo"], type: "seasonal" },

  // CUSTOM
  { id: 70, title: "Content Schedule Announcement", body: "📅 THIS WEEK'S SCHEDULE 📅\n\nMon — Lingerie set 🖤\nTue — Behind the scenes 🎬\nWed — PPV drop 🔥\nThu — Q&A / AMA 💬\nFri — Surprise collab 👀\nSat — Fan appreciation day 💕\nSun — Rest day (maybe 😈)\n\nwhat are you most excited for? 👇", category: "custom", tone: "organized", tags: ["schedule", "announcement"], type: "custom" },
  { id: 71, title: "Fan Loyalty Reward", body: "🏆 FAN LOYALTY REWARD 🏆\n\nto everyone who's been subbed for 3+ months... CHECK YOUR DMS 👀\n\nI just sent you something special because you deserve it 💕\n\nnew here? stick around — your turn is coming 😘", category: "custom", tone: "rewarding", tags: ["loyalty", "reward"], type: "custom" },
  { id: 72, title: "Gym / Fitness Content", body: "just crushed leg day and my 🍑 is looking INSANE rn 🏋️‍♀️\n\nwho wants to see the post-workout content? 😏\n\nspoiler: I may or may not have taken some pics in the locker room 🙈🔥", category: "custom", tone: "casual", tags: ["fitness", "gym"], type: "custom" },
  { id: 73, title: "Late Night Mood", body: "can't sleep... 🌙\n\nanyone else up? feeling kinda naughty tonight not gonna lie 😈\n\nfirst 10 people to respond get something special in their DMs... go 👀💕", category: "custom", tone: "intimate", tags: ["latenight", "interactive"], type: "custom" },
  { id: 74, title: "Subscriber Milestone", body: "OMG WE JUST HIT [number] SUBSCRIBERS!! 🎉🥳\n\nI literally can't believe it... when I started I never thought I'd get here 🥺\n\nto celebrate I'm doing:\n✨ Free unlock for everyone\n✨ 30% off all PPVs today\n✨ Live stream tomorrow at 8pm\n\nTHANK YOU 💕💕💕", category: "custom", tone: "celebratory", tags: ["milestone", "celebration"], type: "custom" },
];

export default function MassMessagesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [copied, setCopied] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [showGen, setShowGen] = useState(false);

  const filtered = TEMPLATES.filter(t => {
    if (category !== "all" && t.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q)) || t.tone.includes(q);
    }
    return true;
  });

  async function copyMsg(t: Template) {
    await navigator.clipboard.writeText(t.body);
    setCopied(t.id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function generateAI() {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    setAiResult("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Write a mass message for an OnlyFans creator to send to their subscribers. The message should be: ${aiPrompt}\n\nRules:\n- Write ONLY the message text, no labels or explanations\n- Keep it 2-4 short paragraphs\n- Use emojis naturally\n- Sound human and casual, like texting\n- Include a call to action\n- Never be explicitly sexual, keep it suggestive but platform-safe` }] }),
      });
      const data = await res.json();
      setAiResult(data.reply || "Couldn't generate. Try again.");
    } catch {
      setAiResult("Connection error. Check ANTHROPIC_API_KEY.");
    }
    setGenerating(false);
  }

  async function copyAI() {
    if (aiResult) { await navigator.clipboard.writeText(aiResult); }
  }

  const catCounts: Record<string, number> = { all: TEMPLATES.length };
  TEMPLATES.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });

  return (
    <>
      <div className="mb-7">
        <h1 className="text-[26px] font-extrabold tracking-tight">Mass Messages</h1>
        <p className="text-[13px] text-[#78716c] mt-1">{TEMPLATES.length} templates · Search, copy, or generate new ones with AI</p>
      </div>

      {/* AI Generator */}
      <div className="mb-6">
        <button onClick={() => setShowGen(!showGen)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#4ade80]/20 to-[#22d3ee]/20 border border-[#4ade80]/20 text-[#4ade80] text-sm font-bold hover:border-[#4ade80]/40 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/></svg>
          {showGen ? "Hide AI Generator" : "Generate with AI"}
        </button>
        {showGen && (
          <div className="mt-3 p-5 bg-[#1a1714] border border-white/[0.06] rounded-xl">
            <div className="text-xs text-[#78716c] mb-3">Describe what kind of message you need — tone, purpose, any specific details:</div>
            <div className="flex gap-2 mb-3">
              <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && generateAI()} placeholder="e.g. A flirty PPV promo for a new lingerie set, make it urgent..." className="flex-1 bg-[#0c0a09] border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]/30" />
              <button onClick={generateAI} disabled={generating} className="px-5 py-2.5 rounded-lg bg-[#4ade80] text-[#0a0a0a] text-sm font-bold hover:brightness-110 transition disabled:opacity-50">{generating ? "Writing..." : "Generate"}</button>
            </div>
            {aiResult && (
              <div className="relative">
                <div className="p-4 bg-[#0c0a09] border border-white/[0.06] rounded-lg text-sm text-[#a8a29e] whitespace-pre-wrap leading-relaxed">{aiResult}</div>
                <button onClick={copyAI} className="absolute top-2 right-2 px-3 py-1.5 rounded-md bg-[#4ade80]/15 text-[#4ade80] text-[10px] font-bold hover:bg-[#4ade80]/25 transition">Copy</button>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {["PPV teaser for new content", "Win-back message for expired subs", "Late night engagement post", "Tip goal countdown hype", "New subscriber welcome"].map(p => (
                <button key={p} onClick={() => { setAiPrompt(p); }} className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.04] text-[#78716c] hover:text-white hover:bg-white/[0.08] transition">{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)} className={`px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${category === c.key ? "text-white" : "text-[#57534e] hover:text-[#a8a29e]"}`} style={category === c.key ? { background: c.color + "20", color: c.color, border: `1px solid ${c.color}33` } : { background: "rgba(255,255,255,0.03)", border: "1px solid transparent" }}>
            {c.label} <span className="opacity-60 ml-1">{catCounts[c.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, content, tag, or tone..." className="w-full max-w-md bg-[#1a1714] border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]/30" />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {filtered.map(t => {
          const cat = CATEGORIES.find(c => c.key === t.category);
          const isCopied = copied === t.id;
          return (
            <div key={t.id} className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition group relative">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-[13px] font-bold">{t.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: (cat?.color || "#78716c") + "20", color: cat?.color || "#78716c" }}>{cat?.label}</span>
                    <span className="text-[9px] text-[#57534e]">{t.tone}</span>
                  </div>
                </div>
                <button onClick={() => copyMsg(t)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${isCopied ? "bg-[#4ade80] text-[#0a0a0a]" : "bg-white/[0.06] text-[#78716c] hover:text-white hover:bg-white/[0.1]"}`}>
                  {isCopied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <div className="text-[12px] text-[#a8a29e] leading-relaxed whitespace-pre-wrap line-clamp-6">{t.body}</div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {t.tags.map(tag => <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.04] text-[#57534e]">#{tag}</span>)}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#57534e]">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-sm">No templates found. Try a different search or category.</div>
        </div>
      )}
    </>
  );
}
