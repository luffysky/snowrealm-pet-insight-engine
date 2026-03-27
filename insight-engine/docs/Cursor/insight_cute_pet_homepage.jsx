import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Sphere, Stars } from "@react-three/drei";
import { motion } from "framer-motion";
import { Heart, Sparkles, PawPrint, ChevronRight, Share2, MessageCircleHeart } from "lucide-react";

const quizCards = [
  {
    title: "你的寵物，其實想對你說…",
    subtitle: "3 分鐘，看見牠藏起來的依賴與溫柔",
    badge: "最熱門",
  },
  {
    title: "你是牠眼中的哪種主人？",
    subtitle: "從日常互動，找出你們的陪伴默契",
    badge: "可愛爆擊",
  },
  {
    title: "如果牠會寫故事，第一章會怎麼寫你？",
    subtitle: "把你和牠的相處，變成一張值得收藏的小卡",
    badge: "故事感",
  },
];

const storyWall = [
  {
    title: "鯨仔今天偷看了我三次",
    desc: "牠什麼都沒說，但每次我轉頭，牠都在那裡。",
  },
  {
    title: "原來招財最在意的是我晚回家",
    desc: "有些依賴不會吵，只會安靜地等。",
  },
  {
    title: "雪寶沒講出口的那句話",
    desc: "你以為你在照顧牠，牠其實也一直在接住你。",
  },
];

function FloatingWorld() {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.35} floatIntensity={0.7}>
        <Sphere args={[1.2, 48, 48]} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#d8f4ff" transparent opacity={0.95} roughness={0.15} metalness={0.08} />
        </Sphere>
      </Float>

      <Float speed={2.2} rotationIntensity={0.2} floatIntensity={1.1}>
        <RoundedBox args={[1.55, 0.95, 0.14]} radius={0.16} smoothness={4} position={[0, 0.18, 1.08]}>
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.34}
            roughness={0}
            metalness={0.08}
            transmission={0.92}
            thickness={1.2}
          />
        </RoundedBox>
      </Float>

      <Float speed={2.8} rotationIntensity={0.4} floatIntensity={1.3} position={[-1.55, 0.95, 0.2]}>
        <Sphere args={[0.18, 32, 32]}>
          <meshStandardMaterial color="#ffd9ec" emissive="#ffd9ec" emissiveIntensity={0.4} />
        </Sphere>
      </Float>

      <Float speed={3.1} rotationIntensity={0.4} floatIntensity={1.3} position={[1.45, -0.8, 0.3]}>
        <Sphere args={[0.14, 32, 32]}>
          <meshStandardMaterial color="#fff0b8" emissive="#fff0b8" emissiveIntensity={0.36} />
        </Sphere>
      </Float>

      <Float speed={2.5} rotationIntensity={0.25} floatIntensity={1.1} position={[1.05, 1.1, -0.1]}>
        <Sphere args={[0.1, 24, 24]}>
          <meshStandardMaterial color="#c9f6d8" emissive="#c9f6d8" emissiveIntensity={0.32} />
        </Sphere>
      </Float>
    </group>
  );
}

function TypewriterText() {
  const fullText = "有些話，牠不會說，但你可以看見。";
  const [text, setText] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, i + 1));
      i += 1;
      if (i >= fullText.length) clearInterval(timer);
    }, 70);
    return () => clearInterval(timer);
  }, []);

  return <span>{text}</span>;
}

function CuteBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/20 px-3 py-1 text-xs font-medium text-slate-700 shadow-[0_8px_30px_rgba(255,255,255,0.18)] backdrop-blur-xl">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

export default function InsightCutePetHomepage() {
  const floatingDots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${6 + ((i * 7) % 88)}%`,
        top: `${8 + ((i * 13) % 78)}%`,
        delay: i * 0.18,
        duration: 3 + (i % 4),
      })),
    []
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fff8fd_0%,#eef8ff_38%,#dff1ff_68%,#d9ecff_100%)] text-slate-800">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-4%] h-64 w-64 rounded-full bg-pink-200/45 blur-3xl" />
        <div className="absolute right-[-6%] top-[8%] h-72 w-72 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute bottom-[-6%] left-[20%] h-72 w-72 rounded-full bg-violet-200/35 blur-3xl" />
        {floatingDots.map((dot) => (
          <motion.div
            key={dot.id}
            className="absolute h-3 w-3 rounded-full bg-white/60 shadow-[0_0_25px_rgba(255,255,255,0.8)]"
            style={{ left: dot.left, top: dot.top }}
            animate={{ y: [0, -12, 0], opacity: [0.45, 0.95, 0.45], scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: dot.duration, delay: dot.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-white/25 shadow-[0_12px_30px_rgba(126,177,255,0.16)] backdrop-blur-xl">
            <PawPrint className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-sky-700/80">SNOWREALM INSIGHT</p>
            <p className="text-xs text-slate-500">可愛系情感洞察入口</p>
          </div>
        </div>

        <nav className="hidden items-center gap-3 md:flex">
          {['熱門測驗', '故事牆', '分享卡片'].map((item) => (
            <button
              key={item}
              className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm text-slate-600 backdrop-blur-xl transition hover:bg-white/35"
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 md:px-8 lg:px-10">
        <section className="grid items-center gap-8 pt-3 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex flex-wrap items-center gap-2">
              <CuteBadge>可愛風首頁</CuteBadge>
              <CuteBadge>寵物情感入口</CuteBadge>
              <CuteBadge>Three.js 浮空星球</CuteBadge>
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-800 md:text-6xl md:leading-[1.06]">
              不是每一份測驗，
              <span className="block bg-gradient-to-r from-sky-600 via-cyan-500 to-violet-500 bg-clip-text text-transparent">
                都能把你和牠的心事變可愛。
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              從一個輕鬆的小問卷開始，看看你的寵物想對你說什麼。
              不是冷冰冰的功能介紹，是一個讓人想點、想玩、想收藏的小宇宙入口。
            </p>

            <div className="mt-4 inline-flex items-center rounded-full border border-white/35 bg-white/25 px-4 py-2 text-sm text-slate-600 shadow-[0_12px_30px_rgba(145,188,255,0.14)] backdrop-blur-xl">
              <MessageCircleHeart className="mr-2 h-4 w-4 text-pink-500" />
              <TypewriterText />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-violet-400 px-6 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(83,173,255,0.35)] transition hover:scale-[1.02]">
                立即測牠想說什麼
                <ChevronRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/25 px-6 py-4 text-base font-medium text-slate-700 backdrop-blur-xl transition hover:bg-white/40">
                看看別人的故事卡
                <Heart className="h-4 w-4 text-pink-500" />
              </button>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: "3 分鐘", label: "快速完成" },
                { value: "可收藏", label: "分享卡片" },
                { value: "不硬銷", label: "先玩再說" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/30 bg-white/18 px-4 py-4 shadow-[0_10px_30px_rgba(135,170,230,0.12)] backdrop-blur-xl"
                >
                  <div className="text-xl font-black text-slate-800">{item.value}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: "easeOut" }}
            className="order-1 lg:order-2"
          >
            <div className="relative overflow-hidden rounded-[32px] border border-white/30 bg-white/16 shadow-[0_24px_80px_rgba(96,146,255,0.20)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
              <div className="h-[360px] w-full md:h-[500px]">
                <Canvas camera={{ position: [0, 0, 4.6], fov: 42 }}>
                  <ambientLight intensity={1.2} />
                  <directionalLight position={[2, 2, 3]} intensity={1.4} />
                  <pointLight position={[-2, -1, 2]} intensity={1.2} color="#ffd7ee" />
                  <Stars radius={60} depth={50} count={1500} factor={2.2} saturation={0} fade speed={0.6} />
                  <FloatingWorld />
                </Canvas>
              </div>

              <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-[28px] border border-white/35 bg-white/28 p-4 shadow-[0_14px_40px_rgba(255,255,255,0.12)] backdrop-blur-2xl md:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-sky-700/75">FEATURED CARD</p>
                    <h3 className="mt-2 text-lg font-bold text-slate-800 md:text-2xl">你的寵物其實是情緒共感型</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 md:text-base">
                      牠不是不黏你，牠是在等你有空的時候，安靜地靠近你。
                    </p>
                  </div>
                  <div className="hidden rounded-2xl border border-white/35 bg-white/35 p-3 md:block">
                    <Share2 className="h-5 w-5 text-sky-600" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mt-12 md:mt-16">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-sky-700/75">HOT QUIZZES</p>
              <h2 className="mt-2 text-2xl font-black text-slate-800 md:text-3xl">先放讓人會上癮的問卷</h2>
            </div>
            <button className="hidden rounded-full border border-white/30 bg-white/25 px-4 py-2 text-sm text-slate-600 backdrop-blur-xl md:block">
              看更多
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quizCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 + index * 0.08 }}
                className="group rounded-[28px] border border-white/30 bg-white/18 p-5 shadow-[0_16px_40px_rgba(122,162,230,0.14)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/24"
              >
                <span className="inline-flex rounded-full border border-white/40 bg-white/32 px-3 py-1 text-xs font-semibold text-pink-600">
                  {card.badge}
                </span>
                <h3 className="mt-4 text-xl font-bold leading-8 text-slate-800">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.subtitle}</p>
                <button className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition group-hover:gap-3">
                  立刻開始
                  <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] border border-white/30 bg-white/18 p-6 shadow-[0_16px_40px_rgba(122,162,230,0.12)] backdrop-blur-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-700/75">SOCIAL PROOF</p>
            <h2 className="mt-2 text-2xl font-black text-slate-800 md:text-3xl">大家正在收藏的故事牆</h2>
            <div className="mt-5 space-y-3">
              {storyWall.map((item, idx) => (
                <div key={item.title} className="rounded-[24px] border border-white/30 bg-white/22 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 md:text-lg">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
                    </div>
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-600">
                      #{idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/30 bg-gradient-to-br from-white/24 to-white/14 p-6 shadow-[0_16px_40px_rgba(122,162,230,0.12)] backdrop-blur-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-700/75">GENTLE CTA</p>
            <h2 className="mt-2 text-2xl font-black text-slate-800 md:text-3xl">先讓人喜歡，再讓人留下</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              首頁不要一直講功能。先給一個好玩、可愛、會讓人想試的入口。
              等他玩了一陣子、收藏了一些卡片、開始有感覺，之後再慢慢把更深的世界打開。
            </p>
            <div className="mt-6 rounded-[24px] border border-white/30 bg-white/24 p-4">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="rounded-2xl bg-pink-100 p-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">首頁任務只有一個</p>
                  <p className="text-xs text-slate-500">讓人點進第一份問卷，不是看功能介紹。</p>
                </div>
              </div>
            </div>
            <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-400 via-sky-400 to-violet-400 px-5 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(132,163,255,0.34)] transition hover:scale-[1.01]">
              做出第一張會被分享的卡片
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
