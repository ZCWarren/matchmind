# MatchMind — 执行计划 v2（Solo / DeepSeek / 本地优先）

> 2026-10-22 22:50 CST · 内部截止 2026-10-27 23:00 CST · 官方截止 2026-10-28 14:59 CST
>
> 本文件覆盖 [PLAN.md](./PLAN.md) 中“必须有 Azure/Foundry”的假设。两份文件冲突时，以本文件为准。

---

## 0. 结论

| 项目 | 决定 |
|---|---|
| 报名 | 已报名（个人）；提交时填你自己 |
| 模型 | DeepSeek：`deepseek-flash` 默认，`deepseek-v4-pro` 只给关键 moment |
| 编排 | Microsoft Agent Framework + MCP（这是我们的 Microsoft 技术主线） |
| Azure/Foundry | 不作为 demo 阻塞；保留 adapter + Bicep 作为生产路径 |
| 目标奖项 | **Best Multi-Agent System 为主**；Grand Prize 作为上限 |
| 部署 | **本地 8010 已跑**；提交前必须有公网 URL（tunnel / host） |
| 预算 | DeepSeek < $10；公网方案 $0-20；无 Azure 费用 |

**一句话策略**：不假装用了 Foundry。用 **Agent Framework + MCP + 多智能体编排** 把“agentic design”做到最强；模型层做成 provider-agnostic，DeepSeek 跑 demo，Foundry adapter 留给有 Azure 的评委/生产环境。

---

## 0.1 当前状态（2026-10-22 23:05）

| 项 | 状态 |
|---|---|
| 报名 | 已确认（个人） |
| repo 骨架 | 已建：`pyproject.toml`、`Makefile`、FastAPI hello、`.env.example` |
| Python 依赖 | `uv sync --extra dev` 通过；`agent-framework 1.22.0` / `agent-framework-openai 1.17.0` / `openai 3.36.1` |
| DeepSeek client | `OpenAIChatClient` / `OpenAIChatCompletionClient` 直接 `base_url` 构造通过 |
| smoke test | **PASS**：zshrc key 已写入 `.env`；raw DeepSeek + Agent Framework 都通过 |
| tests | `pytest` 2 passed；`ruff` 通过；本地 API `:8010` healthz OK |
| 下一步 | MatchForge v0（1 场 1,200 事件 + hero moment） |

> `.env` 已创建（权限 600，gitignored）；key 不打印、不提交。

---

## 0.2 Solo + 本地模式（以此为准）

- **1 人**：A/B/C 不是三个人，是你按顺序戴的帽子：Data/Analytics → Agents/Backend → Frontend/Video。
- **本地**：API 已跑在 `http://localhost:8010`（`8000` 被 Caddy 占用，别动它）；`/docs` 可打开。
- **公网**：规则要求评委能访问的 demo URL；**local-only 不行**。D3 用 Cloudflare Tunnel / ngrok / Caddy 反代，D4 固定链接。
- **Scope**：Must + 少量 Should；砍 5 语言/RTL/Cosmos/Event Hubs/hosted agent。
- **节奏**：按 PLAN.md §10 的单人 D0-D5，把模型换成 DeepSeek，把部署先换成本地 8010；D3 再把 8010 暴露到公网。
- **今天的下一步**：MatchForge v0（1 场、~1,200 事件、hero moment）→ analytics v0 → 本地 Studio shell。

### Solo 5 天速查

| Day | Focus | Done |
|---|---|---|
| D0 今晚 | MatchForge v0 + analytics v0 | 1 场 JSONL；xG/xT/pressure 测试 |
| D1 10/23 | 数据 + 指标 + MCP | 3 场数据；6 个工具；`make demo-insight` |
| D2 10/24 | Agents + API/WS | Analyst→Producer→Verifier→Director 跑通 |
| D3 10/25 | Studio + Overlay + Fan | 三端可看；本地全链路 |
| D4 10/26 | 评估 + 视频 + 公网 | 60 moment eval；2 分钟粗剪；public URL |
| D5 10/27 | 提交 | 23:00 前提交 |

---

## 1. 为什么这个调整可行

- 规则对 **Best Multi-Agent System** 的说明明确接受 “GitHub Copilot, Microsoft Agent Framework, A2A, or another supported orchestration approach”。Agent Framework 本身就是 Microsoft 技术，不需要 Foundry 才能成立。
- DeepSeek API 与 OpenAI 兼容，支持 **Responses API、function/tool calls、JSON output**，足够跑 Agent Framework 的 agent + 本地 MCP 工具。
- 没有 Azure 只影响 “Best Foundry / Best Azure Cloud Native” 两个类别，以及 Grand 的“Microsoft 平台深度”加分；不影响五阶段 pipeline、产品、UX、multi-agent 这些占 80% 的评分项。
- 3 个人约 100-120 人时，比单人 5 天宽裕；可以保留 5 个 agent、3 种语言、overlay + fan 双端。

**诚实原则**：提交材料里写“demo runs on DeepSeek via an OpenAI-compatible provider; Foundry adapter + Azure Bicep included for production”。不要写“deployed on Azure/Foundry”除非真的部署了。

---

## 2. 技术栈修订

| 层 | 原计划 | 现在 |
|---|---|---|
| 模型 | Microsoft Foundry deployments | **DeepSeek** `deepseek-flash` / `deepseek-v4-pro` |
| 编排 | Microsoft Agent Framework | 不变（核心） |
| 工具 | MCP Analytics Server | 不变（核心） |
| 前端 | Vite + React + Tailwind | 不变 |
| 后端 | FastAPI + Pydantic | 不变 |
| 实时 | WebSocket + 本地 replay bus | 不变 |
| 审计 | Cosmos DB serverless | **SQLite / JSONL**（Cosmos adapter 可选） |
| 可观测 | App Insights | **OpenTelemetry + 自定义 trace viewer**（App Insights exporter 可选） |
| 部署 | Azure Container Apps | **Render / Fly.io / VPS**；Container Apps + Bicep 可选 |
| CI | GitHub Actions | 不变 |
| 数据 | MatchForge 合成数据 | 不变（核心） |

### 2.1 DeepSeek 配置

```env
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-flash
DEEPSEEK_MODEL_DEEP=deepseek-v4-pro
```

- `deepseek-flash`：默认；便宜、快；适合 Analyst/Producer/Editor/翻译。
- `deepseek-v4-pro`：只给关键 moment 的 TacticalAnalyst / Director 复核；成本高一些，但关键场景值得。
- 价格（2026-10 官方）：Flash off-peak 输入 $0.15/M、输出 $0.60/M；Pro 输入 $0.66/M、输出 $1.98/M。按 demo 用量，开发+录制 < $10 很稳。
- 并发限制：Flash 2500、Pro 500；我们这点量不会碰到，但仍要 backoff/重试。

### 2.2 Agent Framework 接 DeepSeek

优先用 Responses client，直接传 `base_url`：

```python
import os

from agent_framework.openai import OpenAIChatClient

client = OpenAIChatClient(
    model="deepseek-flash",
    api_key=os.environ["DEEPSEEK_API_KEY"],
    base_url="https://api.deepseek.com",
)
```

- 当前安装的 Agent Framework 1.22.0 已支持 `base_url` 直连；`ai_model_id` 是旧版参数，不用。
- 如果 Responses 路径在本地版本上有兼容问题，退到 `OpenAIChatCompletionClient`（Chat Completions）+ 同一个 `base_url`；DeepSeek 两种 API 都支持。
- 旧版 fallback：用 `AsyncOpenAI(base_url=...)` 通过 `async_client` 传入（issue #647 的 workaround）。
- **工具**：用 Agent Framework 的本地 MCP 工具/function tools；DeepSeek 支持 function calling，但会忽略 hosted MCP，所以不要依赖托管 MCP。
- **结构化输出**：优先 JSON mode + Pydantic 校验；失败 repair 一次。不要假设模型一定返回合法 JSON。
- **并发**：`OpenAIChatClient` 支持同一 event loop 并发；每个 run 用独立 `Agent`/`AgentSession`。不要跨线程共享 client。
- **超时**：每个 agent 单独 timeout；DeepSeek 慢时走模板/缓存。
- **不要用 GitHub Models**：它已于 2026-07-30 完全退役。之前 PLAN.md 里的 GitHub Models fallback 作废。

### 2.3 Provider adapter

```text
src/matchmind/llm/
├─ base.py          # ChatProvider protocol
├─ deepseek.py      # AsyncOpenAI + Agent Framework client
├─ foundry.py       # optional FoundryChatClient adapter
└─ factory.py       # LLM_PROVIDER -> provider
```

- 所有 agent 只依赖 `ChatProvider` / Agent Framework client，不直接读 env。
- `LLM_PROVIDER=foundry` 时，用同样的 messages/schema 接口；没有 Azure 就不启用。
- Demo mode 直接读缓存，不需要 key；评委可测试。
- 这样提交时能诚实说：“provider-agnostic; DeepSeek for the demo, Foundry adapter included.”

---

## 3. Solo 怎么推进（A/B/C 是帽子）

> 默认按强项分；如果实际技能不匹配，直接换 track，不要卡住。

| Track | 负责人 | 负责范围 | 必须交付 | 关键接口 |
|---|---|---|---|---|
| **A · Data / Analytics / Eval** | 你（solo） | MatchForge、指标引擎、labels、评估 | 5 场合成数据、xG/xT/pressure/pass quality/control-chaos/momentum/speed、60 个 labeled moments、eval 表 | `Event`, `FeatureSnapshot`, `Labels` schema |
| **B · Agents / Backend / Infra** | 你（solo） | Agent Framework workflow、DeepSeek adapter、MCP、FastAPI/WS、部署 | 5-agent graph、verifier、retry/fallback、public demo URL、trace | `InsightCandidate`, `VerificationResult`, `OverlayCue`, API |
| **C · Frontend / Design / Video** | 你（solo） | Studio、Overlay、Fan、视觉、视频 | 三端 UI、广播级 overlay、3 种画像/语言、2 分钟视频 | `OverlayCue`, `FanCard`, design tokens |
| **Shared** | 全员 | 契约、集成、提交 | D0 定 schema/API；每天 13:00 集成；D5 提交 | — |

**Solo 模式**：下面 A/B/C 是你依次戴的帽子，不是三个人；按 A→B→C 推进，不要并行等别人。

**角色建议**：

- 如果三人是“1 后端 + 1 前端 + 1 算法/数据”，按 A/B/C 直接分。
- 如果两人偏后端、一人偏前端：A 兼 eval/数据卡，B 兼部署，C 兼视频。
- 指定 1 人做 **representative**（提交人），默认是发起报名的人；D5 由他/她点提交。
- 每天 09:00 15 分钟 standup；13:00 合并一次；18:00 按 demo 脚本走一遍。

---

## 4. 5 天详细任务（solo：A/B/C 顺序执行）

> 你每天 8-10 小时；下面 A/B/C 是任务块，不是三个人。每天按 D0→D5 推进；一个 gate 不过就先补 gate，不加新功能。

### D0 · 今晚 10/22（2-3h/人）：打通 + 契约

| A | B | C |
|---|---|---|
| MatchForge v0：1 场、~1,200 事件、1 个 hero moment | repo 骨架、`.env`、DeepSeek smoke test、Agent Framework hello agent | 设计 tokens、Studio 线框、Overlay 组件清单 |
| 事件 schema + 1 个指标测试 | FastAPI hello + WS skeleton | 静态 Studio shell（假数据） |

**Gate**：`make data` 出 1 场 JSONL；DeepSeek 返回一条 JSON；Studio 能打开；三人 schema 对齐。

### D1 · 周五 10/23：数据 + 指标 + 第一个 insight

| A | B | C |
|---|---|---|
| 3 场数据 + tracking + labels + validators | MCP server + TacticalAnalyst v0 + provider adapter | Studio：pitch、ticker、rundown 列表 |
| xG/xT/pressure/pass quality/control-chaos/momentum | API/WS 推送 event/state/insight | Overlay：lower-third + stat card |

**Gate**：从 replay 到第一条 verified insight，点击能看 evidence。

### D2 · 周六 10/24：全 agent graph + 双端 v0

| A | B | C |
|---|---|---|
| 全指标 + 60 个 moment labels + 重算工具 | 5-agent graph：Analyst/Producer/Editor/Verifier/Director；retry/fallback | Rundown/evidence UI + Fan 三档 + overlay 队列 |
| eval harness 骨架 | prompt version + trace + demo cache | 语言切换 EN/ES/ZH |

**Gate**：hero moment 全链路跑通；verifier 能 reject 一条错误 claim；overlay 能上屏。

### D3 · 周日 10/25：部署 + 性能

| A | B | C |
|---|---|---|
| data card + 分布校验 + eval baseline | 本地 tunnel/反代到 8010；健康检查；keepalive；OpenTelemetry | Fan 响应式 + player focus + speed alert；RTL 可选 |
| 评估集跑通 | 延迟/成本埋点；demo mode 无 key | overlay 透明源在 OBS 测试 |

**Gate**：公网 URL 可访问；评委路径无 key 可走；p95 在预算内。

### D4 · 周一 10/26：打磨 + 评估 + 视频

| A | B | C |
|---|---|---|
| 60 个 moment 评估报告；baseline 对比 | 性能/错误处理/安全；最终部署 | UX 打磨；录视频 v1；截图/GIF |
| 人工抽检 20 条 claim | README 技术部分 | 视频剪辑/字幕 |

**Gate**：2 分钟粗剪；连续 5 次 demo 不崩；README 可让评委 90 秒跑通。

### D5 · 周二 10/27：提交

| 你 |
|---|
| 最终视频；提交描述；repo public；链接 incognito 测试；**23:00 CST 前提交**；保存确认 |

### D6 · 周三 10/28 上午

只修链接/视频可见性/错别字；官方截止 14:59 CST；最晚 13:00 完成复核。

---

## 5. 部署方案（本地优先）

### 5.0 本地（现在）

- `make dev` 启动 `uvicorn` 在 `:8010`；`/healthz`、`/docs` 已验证。
- `.env` 里是 zshrc 的 DeepSeek key；权限 600，`.gitignore` 覆盖。
- 不要占用 `:8000`（Caddy 在用）；如需对外，用反代或 tunnel 到 8010。

### 5.1 公网（提交前必须）

- 规则要求评委可访问的 demo；本地 8010 只能自己看。
- 最省事：Cloudflare Tunnel / ngrok 把 8010 暴露；D3 先跑通，D4 固定链接。
- 更稳：Caddy 反代到已有域名；或 Render/Fly/VPS 跑 Docker。
- demo 要活到 2026-11-10（评审结束）；tunnel 进程/机器不能关。

## 5.2 Azure / 云宿主（可选）

### 5.1 先花 30 分钟试 Azure（可选）

- 试开 Azure free account；如果能开，D3 用 Container Apps + 可选 Foundry adapter。
- 同时问主办方/Reactor 是否有 Azure credits 或 Foundry sandbox；有就用，没有不阻塞。
- **不要**为了等 Azure 停下 D0-D2。

### 5.2 默认宿主

| 选项 | 优点 | 缺点 | 建议 |
|---|---|---|---|
| **Render Starter** | Docker、WebSocket、GitHub 自动部署、$7/mo | 免费档会 sleep；付费需卡 | 首选，最省事 |
| **Fly.io** | Docker、全球边缘、WebSocket | 需卡；配置稍多 | 备选 |
| **香港/新加坡轻量云** | 支付方便、稳定、可控 | 要自己配 Caddy/HTTPS | 如果 Render/Fly 支付不顺 |
| **Azure Container Apps** | 最贴合 hackathon | 需要 Azure | 有 free account 就上 |

- 单 Docker 镜像：FastAPI + 静态前端 + MCP route + WebSocket。
- HTTPS 必须（overlay/WS）；用宿主域名或 Caddy + 域名。
- 健康检查 `/healthz`；容器 512MB-1GB 足够。
- demo 要活到 **2026-11-10**（评审结束）；付费实例最稳，免费档加 cron ping。
- 部署脚本 / `Dockerfile` / `render.yaml` 放 repo；Bicep 保留为 Azure 生产路径。

### 5.3 Demo mode

- 公网默认 `DEMO_MODE=replay`：读预生成 insight/cue，无 key 可跑。
- `DEMO_MODE=live`：DeepSeek 实时；用于录制/演示。
- 评审说明写清两种模式；不要让评委配置 key。

---

## 6. 提交口径（诚实且有利）

### 6.1 技术描述

> MatchMind is orchestrated with **Microsoft Agent Framework** and a custom **MCP analytics server**. The model layer is provider-agnostic: the public demo runs on **DeepSeek's OpenAI-compatible API** for cost and latency, and the repository includes a **Microsoft Foundry adapter** plus **Azure Bicep** for one-command production deployment. The multi-agent graph, shared state, verifier loop, and graceful degradation are framework-level and do not depend on a single model vendor.

### 6.2 类别声明

> **Primary category: Best Multi-Agent System.** Five specialized agents coordinate through a Microsoft Agent Framework graph workflow: a Tactical Analyst, a Story Producer, parallel Audience Editors, an independent Fact Checker, and a Director. They share typed state, hand off explicitly, verify every claim against event-level evidence, and degrade gracefully when a model or tool fails.

### 6.3 不要写

- 不要写 “deployed on Microsoft Foundry / Azure” 除非真的部署了。
- 不要写 “uses Azure OpenAI / Cosmos DB / App Insights” 除非 live demo 真的用了。
- 可以写 “Foundry-ready / Azure-ready / Bicep included / adapter included”，并给出 repo 路径。

### 6.4 评分策略调整

| 评分项 | 目标 | 说明 |
|---|---:|---|
| Technological Implementation | 4.0/5 | 工程/数据/测试强；Microsoft cloud 深度弱于有 Azure 的队伍 |
| Agentic Design | 4.7/5 | 主战场：5 agents、graph、MCP、verifier、fallback、trace |
| Real-World Impact | 4.3/5 | 广播/流媒体/低级别联赛；延迟/成本/多语言 |
| UX & Presentation | 4.6/5 | 三端 + 广播 overlay + 2 分钟视频 |
| Adherence to Category | 5/5 | 明确 Best Multi-Agent System |
| **总分目标** | **4.5/5** | Grand 需要演示特别强；category 是现实目标 |

---

## 7. 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|
| 个人报名/提交信息缺失 | 低 | 高 | 提交前核对姓名/邮箱/representative |
| DeepSeek API 慢/限流/挂 | 中 | 高 | backoff + timeout + 模板/cache；demo mode 不依赖实时 |
| 没有 Azure，Grand 评分吃亏 | 高 | 中 | 主攻 Multi-Agent；提交里强调 Agent Framework/MCP；保留 Foundry adapter |
| local-only demo 评委打不开 | 高 | 致命 | D3 必须接 tunnel/反代；D4 用 incognito 验证公网 URL |
| 宿主 cold start/被墙 | 中 | 高 | 付费实例；香港/新加坡节点；健康检查 + cron ping |
| 一个人上下文切换/时间不够 | 高 | 高 | 垂直切片；每天一个 gate；砍 Should；不并行开新坑 |
| 视频超 2:00 | 中 | 高 | D4 粗剪；脚本 1:50；字幕；不堆架构 |
| 数据不真实 | 中 | 中 | 分布校验；hand-check；data card |
| 范围蔓延 | 高 | 高 | Must/Should/Could；D2 gate 不过就砍 |
| IP/商标 | 中 | 高 | 虚构球队；无真实画面/logo；名称检索 |

---

## 8. 今天 90 分钟（solo 顺序）

### 你（15 分钟）

- 报名已完成；本地 `:8010` 已跑，`make smoke` 已 PASS。
- 打开 `/docs`，确认 API 可用。
- 决定今天先做 MatchForge 还是先搭 Studio shell（建议 MatchForge）。

### Task A（45 分钟）

- 写 `Event` / `FeatureSnapshot` / `Labels` schema（Pydantic）。
- MatchForge v0：1 场、1,200 事件、1 个 hero moment；输出 `data/demo/`。

### Task B（15 分钟，已完成）

- 已完成：repo 骨架、`.env`、`Dockerfile`。
- 已完成：DeepSeek raw + Agent Framework smoke 都 PASS（`OpenAIChatClient(base_url=...)`）。
- 下一步只需在改动后重跑 `make smoke`。

### Task C（30 分钟）

- 设计 tokens（深色广播、lime accent、tabular numerals）。
- Studio 线框：pitch + ticker + rundown + program monitor。
- Overlay 组件清单：lower-third、stat card、momentum ribbon、pressure map、speed alert。

### 可选（30 分钟）

- 试 Cloudflare Tunnel / ngrok 把 8010 暴露；D3 前必须有一个公网 URL。

---

## 9. 需要确认

1. **公网方案**：Cloudflare Tunnel / ngrok / Caddy 反代 / 便宜 VPS，哪个方便？提交前必须有公网 URL。
2. **每天时间**：未来 5 天每天几小时？决定 Must 还是 Minimum scope。
3. **目标确认**：Best Multi-Agent 为主、Grand 为上限，是否同意？

---

## 10. 相关文件

- [PLAN.md](./PLAN.md)：完整概念、架构、数据 schema、视频脚本、提交清单（Azure 版参考）。
- [README.md](./README.md)：英文项目种子。
- `.env.example`：DeepSeek / Foundry / demo 配置模板。
- 官方规则：[OFFICIAL RULES.md](https://github.com/microsoft/insidethegamehackathon/blob/main/OFFICIAL%20RULES.md)
- DeepSeek API：[Your First API Call](https://api-docs.deepseek.com/)
- Agent Framework OpenAI provider：[OpenAI](https://learn.microsoft.com/en-us/agent-framework/integrations/by-component/model-providers/openai)
- Agent Framework base_url workaround：[issue #647](https://github.com/microsoft/agent-framework/issues/647)
