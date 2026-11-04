<div align="center">

# 🛡️ LinkVigil

**Client-side URL threat scanner & phishing shield.**
Detect homograph attacks, typosquatting, malware droppers, and deceptive links before you click.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MIT License](https://img.shields.io/badge/License-MIT-06B6D4?style=for-the-badge)](LICENSE)

</div>

---

## Overview

LinkVigil analyzes a URL entirely in the browser: no backend, no account, and no URL database. Only the hostname is sent to public DNS-over-HTTPS resolvers for lookups; the full URL, path, and query string stay on your device.

## Features

- **URL anatomy breakdown**: splits input into protocol, subdomain, root domain, TLD, and query string to expose deceptive nesting.
- **0–100 risk score** with a verdict:
  - 🟢 **Safe (0–19)**
  - 🟡 **Suspicious (20–59)**: risky TLD, high entropy, low TTL, or plain HTTP
  - 🔴 **Dangerous (60–100)**: URLhaus match, IDN homograph, brand typosquat, or raw-IP dropper
- **Findings checklist** with extracted evidence and recommendations for each triggered check.
- **Domain telemetry**: IP resolution, DNSSEC status, TLD class, entropy, TLS posture.
- **Shareable permalinks** (`?url=https://...`), Web Share API, and a copyable Markdown threat report.
- **One-click test presets** for common attack types.

## Detection Engines

| Engine | What it checks |
| :--- | :--- |
| **Heuristics** | Homographs/Punycode, Levenshtein brand typosquatting (distance ≤ 2), Shannon entropy (DGA detection, H ≥ 3.8), risky TLDs |
| **DNS-over-HTTPS** | Cloudflare / Google DoH lookups, DNSSEC (`AD` flag), NXDOMAIN sinkholes, TTL analysis |
| **IP intelligence** | RFC1918 / loopback / link-local detection, raw-IP hosts |
| **URLhaus** | abuse.ch malware URL signatures |

Results from all engines are combined into a single multi-factor risk score.

## Test Scenarios

| URL | Category | Expected score |
| :--- | :--- | :--- |
| `https://www.google.com` | Safe | 0 |
| `https://xn--pple-43d.com/login` | Homograph | 85 |
| `http://paypal-security-update.top/login` | Typosquatting | 90 |
| `http://185.220.101.4:8080/payload.exe` | Malware C2 | 95 |
| `https://login.microsoft.com.portal.click` | Phishing | 80 |
| `https://c0inbase-vx99qa8z71.sbs/claim` | DGA / obfuscation | 85 |

## Getting Started

**Requirements:** Node.js 18+

```bash
git clone https://github.com/mohamed-abouzeid-h/LinkVigil.git
cd LinkVigil
npm install
npm run dev        # http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

## Project Structure

```
linkvigil/
├── src/
│   ├── App.tsx
│   ├── components/    # UI: input bar, scanning animation, result card, findings, domain details
│   ├── engines/       # scoring, heuristics, DNS, IP, URLhaus
│   ├── data/          # brand dictionary, TLD risk data, sample URLs
│   └── types/
├── public/
└── LICENSE
```

## Author & License

Created by **Mohamed Abouzeid**. Released under the [MIT License](LICENSE).
