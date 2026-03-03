# 🔮 StefanOS V2

Real-time personal dashboard with live data, system metrics, and productivity tools.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)

![Dashboard Preview](https://via.placeholder.com/800x400/0d1117/58a6ff?text=StefanOS+V2+Dashboard)

## ✨ Features

### 📊 Real-time Monitoring
- **System Metrics** — CPU, memory, disk usage, and load average with historical sparklines
- **Service Health** — Monitor status of external services with response times
- **Live Weather** — Current conditions for Ganeasa with 30-second auto-refresh

### 🐙 GitHub Integration
- **Repository Stats** — Total repos, stars, forks, and top languages
- **Recent Activity** — Feed of latest commits, PRs, and issues
- **Open PRs** — Quick links to pending pull requests across all repos

### ✅ Task Management *(New!)*
- **Quick Todos** — Add, complete, and delete tasks directly from the dashboard
- **Persistent Storage** — Tasks saved to localStorage
- **Keyboard Shortcuts** — Press `T` to quickly add a new task

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `R` | Refresh all data |
| `1` | Switch to Overview tab |
| `2` | Switch to Activity tab |
| `3` | Switch to Services tab |
| `4` | Switch to Tasks tab *(New!)* |
| `T` | Quick add task *(New!)* |
| `?` | Show keyboard shortcuts help |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- GitHub Personal Access Token (for GitHub features)

### Installation

```bash
# Clone the repository
git clone https://github.com/dekolor/stefanos-v2.git
cd stefanos-v2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your GitHub token

# Run development server
npm run dev
```

Open [http://localhost:3000](httplocalhost:3000) to view the dashboard.

### Environment Variables

Create a `.env.local` file:

```env
# Required for GitHub integration
GITHUB_TOKEN=your_github_personal_access_token

# Optional: Service monitoring endpoints (comma-separated)
MONITOR_URLS=https://api.github.com,https://api.open-meteo.com
```

## 📁 Project Structure

```
stefanos-v2/
├── app/
│   ├── api/           # API routes for metrics, GitHub, services
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main dashboard
├── components/        # React components
│   ├── ErrorBoundary.tsx
│   └── KeyboardShortcuts.tsx
├── data/             # Static data
├── public/           # Static assets
└── README.md
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React 18](https://react.dev/) + Inline CSS (GitHub Dark theme)
- **WebSocket**: Real-time server metrics
- **APIs**: Open-Meteo (weather), GitHub API

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

Or connect your GitHub repository to [Vercel](https://vercel.com) for automatic deployments.

### Docker

```bash
# Build image
docker build -t stefanos-v2 .

# Run container
docker run -p 3000:3000 -e GITHUB_TOKEN=xxx stefanos-v2
```

### Self-Hosted

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📝 Roadmap

- [x] Real-time system metrics
- [x] Weather widget
- [x] GitHub activity feed
- [x] Service health monitoring
- [x] Keyboard shortcuts
- [x] Task/todo management
- [ ] Calendar integration
- [ ] News feed
- [ ] Dark/light theme toggle
- [ ] Mobile app (PWA)
- [ ] Custom widget system

## 🤝 Contributing

Contributions welcome! This is a personal dashboard but feel free to fork and customize for your own use.

## 📄 License

[MIT](LICENSE) © Stefan

---

Built with ⚡ by Stefan
