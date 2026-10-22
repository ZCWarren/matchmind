# Performance

Fast-path measurements: 60 requests per route via FastAPI TestClient.
No model calls; cached insight and deterministic analytics only.

| Route | p50 | p95 |
|---|---:|---:|
| `/api/matches` | 7.49 ms | 16.55 ms |
| `/api/matches/{id}/moments` | 3.56 ms | 12.0 ms |
| `/api/matches/{id}/features` | 7.32 ms | 19.43 ms |
| `/api/matches/{id}/insights (cached)` | 2.11 ms | 2.98 ms |

## Slow path

- Live graph samples: 3
- p50: 61.3s
- max: 70.0s
- Model calls per insight: 13

The Studio and public demo read cached fixtures. Live generation is
available locally and is intentionally not part of the public static demo.
