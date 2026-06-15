# Nivya

MF-only mutual fund distribution platform prototype (Corporate MFD model). Groww-style mobile UI with mock NAV, portfolio, SIP, and order flows.

**Scope:** Mutual funds only — lumpsum, SIP, redeem, switch, portfolio. Not a stock broker.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Repository layout

| Path | Description |
|------|-------------|
| `nivya-app.jsx` | Single-file React prototype (MF-only demo) |
| `src/main.jsx` | Vite entry point |
| `NIVYA-MF-PLATFORM-REPORT.md` | Strategic, regulatory & technical architecture report |
| `HYBRID-E2E-PLAN.md` | Hybrid vendor + custom UX execution plan |

## Compliance note

Demo build uses placeholder `NIVYA_ARN = "ARN-XXXXXX"`. Replace with your live AMFI ARN before any production use.

## License

MIT — see [LICENSE](LICENSE).
