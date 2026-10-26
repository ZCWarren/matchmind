# Dependency audit

Checked with the committed lockfiles.

```bash
cd web && npm audit
cd ../video && npm audit --omit=dev
uv run --with pip-audit pip-audit --progress-spinner off
```

Results:

- `npm audit` (web, production and dev): **0 vulnerabilities**.
- `npm audit --omit=dev` (video): **0 vulnerabilities**. The Remotion zod override is pinned to a patched release.
- `pip-audit`: **no known vulnerabilities**.
  - The local `matchmind` package is not on PyPI and is skipped by the audit.

Runtime surface:

- Python 3.12, FastAPI, Pydantic v2, Microsoft Agent Framework, OpenAI SDK.
- Vite + React 19 + TypeScript frontend.
- No browser-side secrets; the public demo is a static export.
