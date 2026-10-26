# MatchMind — Product Marketing & Viral Launch Kit (GTM)

> **Tagline**: *See the game beneath the game.*
> **One-sentence pitch**: MatchMind turns 1,200+ raw football events into an interactive 3D tactical story, a broadcast control room, a transparent OBS overlay, and a personalized multi-language fan second screen — powered by a 5-agent Microsoft Agent Framework graph with a deterministic release gate that blocks AI hallucinations before they ever reach the air.

---

## 1. X / Twitter Viral Launch Thread (English)

**Tweet 1/7 (Hook + 15s/90s Video):**
Football broadcasts show you the scoreline. They don’t show you the invisible structure that created it.

Meet **MatchMind**: a real-time explainable match intelligence engine built with a 5-agent Microsoft Agent Framework graph + Three.js + MCP.

See the game beneath the game 🧵👇
🔗 Live 3D Demo (zero API key): https://ruziniuuuuu.github.io/matchmind/

**Tweet 2/7 (The Core Problem & Principle):**
Why can’t you just wrap an LLM around live sports data?
Because LLMs invent numbers. In live broadcast, a single hallucinated stat destroys trust.

MatchMind’s #1 architectural rule:
**Deterministic facts. Probabilistic language.**
- Every xG, xT, pressure index & speed number comes from our deterministic analytics engine.
- Models explain *why* a moment mattered; they NEVER invent numbers.

**Tweet 3/7 (The 5-Agent Graph + MCP):**
One prompt doing analysis, broadcast copywriting, 9-variant localization, and fact-checking contradicts itself.

We built a typed 5-agent workflow:
1️⃣ **TacticalAnalyst** calls 4 MCP tools (`get_event_window`, `get_tactical_chain`, `get_pressure_comparison`, `get_player_summary`)
2️⃣ **StoryProducer** drafts timed broadcast cues
3️⃣ **AudienceEditor** writes Analyst / Casual / Player cards in EN/ES/中文 in parallel
4️⃣ **FactChecker** audits claims
5️⃣ **Director** schedules airtime & suppresses duplicates

**Tweet 4/7 (The Hallucination Gate — 33.4 vs 33.8 km/h):**
What happens when a model claims:
*"At 72', NHR-14 hits 33.4 km/h — the fastest sprint of the match"*?

Our **FactChecker + Deterministic Verifier** cross-checks the MatchBlackboard (`e-000419` at 31' was `33.8 km/h`), flags `unsupported_superlative`, and triggers a bounded 1-step revision loop (`StoryProducer:revise -> FactChecker:recheck`).
Unverified claims never go on air.

**Tweet 5/7 (3D Parabolic Pitch & Multi-Moment Blackboard):**
Inside **Moment Focus**, every pass arc, pressure ring, and coordinate is driven by 1,275+ synthetic match events — not a pre-rendered video.
Switch between **TV Cam**, **Top-Down xT**, and **Press POV**, or step through the 3-act **MatchBlackboard Story Arc** (31' Sprint Catalyst → 72' Press Trap → 74' Winner).

**Tweet 6/7 (Broadcast Studio, OBS Overlay & Fan Second Screen):**
One verified evidence bundle powers three production surfaces:
🎛️ **Studio**: Director rundown, 60s dedupe, stoppage scheduling & human override
📺 **Overlay**: 1920×1080 transparent browser source for OBS/vMix (`L3 / STAT / MOM / SPD / MAP`)
📱 **Fan**: Analyst, Casual & Player Follow readings in English, Spanish & Chinese

**Tweet 7/7 (Open Source & Try It Now):**
Try the interactive 90-second Judge Tour, test the Adversarial Hallucination Lab, or download a 1-click Vector Tactical Poster right in your browser:

🌐 Live Demo: https://ruziniuuuuu.github.io/matchmind/
🎬 90s Film: https://ruziniuuuuu.github.io/matchmind/promo.mp4
💻 GitHub (MIT): https://github.com/ruziniuuuuu/matchmind

---

## 2. HackerNews (`Show HN`) & ProductHunt Launch Post

### Title
`Show HN: MatchMind – 5-Agent Football Broadcast Intelligence with a Deterministic Verifier`

### Maker's First Comment
Hi HN! We built **MatchMind** to explore a question that plagues real-time AI applications: *How do you use multi-agent LLMs in a high-stakes, low-latency environment like live sports broadcasting without letting hallucinated numbers slip onto the screen?*

**Live zero-key static demo**: https://ruziniuuuuu.github.io/matchmind/  
**GitHub repo**: https://github.com/ruziniuuuuu/matchmind

#### How it works under the hood
1. **Synthetic Data Generator (`MatchForge`)**: Generates 5 deterministic football matches (6,281 events total) with realistic pass completion, xG, pressure, and ground-truth evaluation labels.
2. **Deterministic Analytics + FastMCP Server**: Computes versioned xG (`xg-v1`), 12×8 grid Expected Threat (`xt-v1`), pressure indices, and momentum change points, exposed via 6 MCP tools (`get_event_window`, `get_tactical_chain`, `get_pressure_comparison`, `get_player_summary`, `get_snapshot`, `get_moments`).
3. **Typed Microsoft Agent Framework Graph**:
   `prepare -> analyst -> fan-out(producer, audience, checker) -> review -> revise once -> recheck -> finalize -> Director`
4. **Authoritative Release Gate (`verifier.py`)**:
   - Recomputes every `MetricRef` against the deterministic snapshot within strict tolerance.
   - Scans every numeric token in the `OverlayCue` against grounded claims (`verify_cue`).
   - Blocks unsupported superlatives (e.g., claiming a `33.4 km/h` sprint at 72' is the "fastest of the match" when a 31' sprint hit `33.8 km/h`).
5. **Interactive 3D & Broadcast Surfaces**: Three.js parabolic pass trajectories + Studio Director rundown + 1920×1080 OBS transparent overlay + 9-variant Fan app.

We’d love your feedback on the bounded revision graph and deterministic verification pattern!

---

## 3. 中文社交媒体宣发矩阵（小红书 / 即刻 / 知乎 / 公众号）

### 方案 A：硬核 AI 架构向（适合即刻 / 知乎 / 推特中文圈 / 技术公众号）

**标题备选：**
1. 《当大模型闯入足球导播间：我们用 5 个 Agent + 确定性门禁，把 AI 幻觉死死拦在屏幕外》
2. 《See the game beneath the game：我做了一个实时 3D 足球战术多智能体导播系统 MatchMind》
3. 《为什么单 Prompt 做不好体育解说？拆解 MatchMind 的 5-Agent 扇出拓扑与 MCP 取证闭环》

**正文可直接发布：**
一场 90 分钟的足球比赛会产生 1,200 到 1,500 个事件。
导播只有几秒钟决定“哪个瞬间值得上屏”，而观众往往只看到冰冷的比分，看不见比分背后暗流涌动的空间压迫、传球威胁（xT）与战术博弈。

如果直接把比赛数据塞给大模型生成解说字幕，会发生什么？
**模型会编造数字、会滥用“全场最快/本场唯一”等极值幻觉。而在直播导播台上，一次数据造假就是播出事故。**

为此，我们打造了 **MatchMind —— 实时可解释足球战术多智能体系统**。

🔥 **核心架构亮点：**
1. **确定性事实，概率性表达（Deterministic Facts, Probabilistic Language）**
   所有足球指标（xG、xT 期望威胁网格、压迫指数、动量拐点、冲刺极值）100% 由确定性引擎计算并附带公式版本号（如 `xt-v1`）。大模型只负责解释“为什么这个瞬间重要”，绝不允许心算任何数字。
2. **基于 Microsoft Agent Framework 的 5-Agent 有向图与有界修订（Bounded Revision）**
   - **TacticalAnalyst**：通过 MCP 协议调用 `get_tactical_chain`、`get_pressure_comparison` 等工具提取战术证据链；
   - **StoryProducer** & **AudienceEditor**：三路并发扇出，一边生成导播安全区字幕（OverlayCue），一边并行生成面向“战术分析师 / 普通球迷 / 球星死忠” × “中/英/西三语”的 9 张定制卡片；
   - **FactChecker + 确定性门禁**：逐字扫描字幕中的数字与极值。比如第 72 分钟反击冲刺达到 `33.4 km/h`，如果模型吹嘘“全场最快冲刺”，门禁会立刻调取黑板记忆中第 31 分钟的 `33.8 km/h`（`e-000419`）当场拦截，并触发单次有界修订回路（`StoryProducer:revise -> FactChecker:recheck`）！
   - **Director（导播智能体）**：执行 60 秒同类去重、15 秒字幕最小间隔，自动将通过核验的战术卡排期到最近的死球窗口，且保留人类导播的一键 Hold / Approve 最终控制权。
3. **电影级 Three.js 3D 战术复盘与三端同源体验**
   不仅有 3D 抛物线穿透传球轨迹、压迫波纹、三机位切换（导播视角 / 上帝 xT 视角 / 破逼抢特写），还内置了 **MatchBlackboard 跨时刻三幕剧叙事弧** 与 **Tactical Copilot 战术问答**！

🌐 **免 Key 在线交互体验（含 90 秒评委导览模式 & 幻觉拦截实验室）：**
https://ruziniuuuuu.github.io/matchmind/
💻 **GitHub 开源仓库（MIT）：**
https://github.com/ruziniuuuuu/matchmind

---

### 方案 B：视觉惊艳 & 球迷破圈向（适合小红书 / B站动态 / 视频号文案）

**标题：**
把足球比赛变成 3D 战术沙盘！我用 5 个 AI 智能体做了一套未来转播间 ⚽️✨

**正文：**
看球的时候你是不是也好奇：
为什么看似平平无奇的一脚中场直塞，解说员却大呼“打穿了整条防线”？

我用 Three.js + 5 个协作 AI 智能体做了 **MatchMind**！
只要拖动底部的时间轴：
🟢 **3D 抛物线轨迹**直接还原每一次破逼抢传球的真实落点
🔴 **动态压迫光环**实时显示持球人身边有多窒息（0.82 高压预警！）
🧠 **幻觉拦截实验室**：哪怕 AI 想偷偷吹牛说“这是全场最快冲刺”，也会被核查员 Agent 拿着第 31 分钟的数据当场红牌罚下重写！
📱 **千人千面看球**：无论你是硬核战术控（看 xT 期望威胁值）、刚看球的新手（大白话解读），还是只想盯紧自家主队球星，一键切换中/英/西三语战报卡，还能一键导出专属 SVG 战术海报！

戳置顶评论直接在线把玩 3D 战术球场 👇
#AI智能体 #足球战术 #Threejs #独立开发 #黑客松 #MultiAgent #数据可视化
