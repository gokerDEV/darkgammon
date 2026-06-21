# Darkgammon 🌗🎲

**Choose your side. Shift the horizon.**

Darkgammon is a solstice-inspired reinterpretation of backgammon, where two players represent **Light** and **Dark** and battle for control of the board.

Built for the [June Solstice Game Jam](https://dev.to/challenges/june-game-jam-2026-06-03).

[![Play Darkgammon](https://img.shields.io/badge/PLAY-DARKGAMMON-111111?style=for-the-badge)](https://darkgammon.tavla.be)
[![Challenge Submission](https://img.shields.io/badge/DEV-Challenge%20Submission-0A0A0A?style=for-the-badge&logo=devdotto)](https://dev.to/gokerdev/darkgammon-choose-your-side-1gpa)

## Play

**Live game:** [darkgammon.tavla.be](https://darkgammon.tavla.be)

Choose the Light Side or the Dark Side, invite an opponent, and fight through strategy, probability, timing, and a little help—or betrayal—from the dice.

## Video Demo

<!-- Replace YOUTUBE_VIDEO_ID in both URLs below. -->

[![Watch the Darkgammon gameplay demo](https://img.youtube.com/vi/A7-G2EyBb7k/maxresdefault.jpg)](https://www.youtube.com/watch?v=A7-G2EyBb7k)

> GitHub README files do not support playable YouTube iframes. The thumbnail above opens the video on YouTube.

## About the Game

Darkgammon began as a themed version of [tavla.be](https://tavla.be), a browser-based real-time backgammon platform.

The project was adapted for the June Solstice Game Jam by transforming the existing game into a conflict between Light and Dark.

Backgammon already fits the theme surprisingly well:

- The board has **24 points**, echoing the 24 hours of a day.
- The two players travel in opposite directions, like Light and Dark following one another through a continuous cycle.
- Pieces can be hit, sent backward, return to the board, travel home, and finally leave it.
- The game naturally revolves around cycles, balance, setbacks, timing, probability, and return.

Darkgammon brings that interpretation to the surface and turns each match into part of a wider battle between two sides.

## Light vs. Dark

Before entering a match, players choose a side:

### Light Side

Defend the longest day and push back the shadows.

### Dark Side

Bring on the longest night and let darkness take the board.

The opponent represents the opposing force. Every completed match contributes to the wider Light vs. Dark challenge.

The home page includes an hourly faction overview showing:

- how many players joined each side;
- how many matches each faction played;
- how many victories Light and Dark claimed during the current cycle.

## Features

- **Real-time online backgammon**
- **Light or Dark faction selection**
- **Invite-based multiplayer matches**
- **Hourly faction statistics**
- **Match replay**
- **Shareable video export**
- **Google and Apple authentication**
- **Player profiles**
- **Custom QR-code invitations**
- **Firebase notifications**

## Challenge Submission

Darkgammon was created for the **June Solstice Game Jam**.

The challenge version builds on the previously completed tavla.be foundation, which already provided:

- the backgammon engine;
- real-time multiplayer;
- invitations;
- match persistence;
- replay;
- client-side video export.

For the challenge, the project introduced:

- the Darkgammon identity;
- Light and Dark player factions;
- solstice-inspired visual design;
- side selection;
- thematic game language;
- hourly faction statistics;
- side-based match and victory tracking;
- a new home-page experience centered on the ongoing conflict.

Read the full submission:

**[Darkgammon: Choose Your Side](https://dev.to/gokerdev/darkgammon-choose-your-side-1gpa)**

## Built with Google AI

Darkgammon is submitted for the **Best Google AI Usage** category.

Google Antigravity and Gemini were used throughout the final-day development process to:

- shape the Light vs. Dark concept;
- connect the solstice theme with backgammon mechanics;
- define feature boundaries;
- plan the faction-selection flow;
- implement and refine the hourly challenge system;
- iterate on interface states and game copy;
- debug and complete the final integration.

AI was used as a development partner rather than as a runtime feature inside the game.

## Technology Stack

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [MongoDB](https://www.mongodb.com/)
- [Pusher](https://pusher.com/)
- [Firebase](https://firebase.google.com/)
- [Auth.js](https://authjs.dev/)
- [@goker/qr-code](https://www.npmjs.com/package/@goker/qr-code)

## Getting Started

### Prerequisites

- Node.js or [Bun](https://bun.sh/)
- MongoDB database
- Pusher account
- Firebase project
- Google Cloud Console project for Google OAuth
- Apple Developer account for Sign in with Apple

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/gokerDEV/darkgammon.git
cd darkgammon
bun install
```

Create a `.env.local` file in the project root and configure the required MongoDB, Pusher, Firebase, OAuth, and application variables.

Use `.env.sample` as the reference when available.

Start the development server:

```bash
bun dev
```

Then open:

```text
http://localhost:3000
```

## Authentication Setup

Darkgammon uses Auth.js for authentication.

### Apple Sign-In

Auth.js generates the Apple client secret dynamically when the required credentials are configured.

Add the following values to `.env.local`:

```env
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

See `APPLE.md` for the complete Apple configuration.

## Local HTTPS for OAuth

For local OAuth testing, use a secure custom development domain such as:

```text
https://dev.tavla.be
```

### 1. Map the Local Domain

Edit `/etc/hosts`:

```bash
sudo nano /etc/hosts
```

Add:

```text
127.0.0.1 dev.tavla.be
```

### 2. Generate Local Certificates

Install `mkcert`:

```bash
brew install mkcert nss
mkcert -install
mkcert dev.tavla.be
```

This creates:

```text
dev.tavla.be.pem
dev.tavla.be-key.pem
```

### 3. Configure Caddy

Install Caddy:

```bash
brew install caddy
```

Create a `Caddyfile`:

```caddyfile
dev.tavla.be {
  reverse_proxy localhost:3000
  tls ./dev.tavla.be.pem ./dev.tavla.be-key.pem
}
```

Run Caddy:

```bash
caddy run
```

### 4. Configure the Application

Update `.env.local`:

```env
NEXTAUTH_URL="https://dev.tavla.be"
ALLOWED_ORIGINS="dev.tavla.be,darkgammon.tavla.be,tavla.be"
```

Configure allowed development origins in `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [],
};

export default nextConfig;
```

### 5. Configure OAuth Redirect URIs

Google:

```text
https://dev.tavla.be/api/auth/callback/google
```

Apple:

```text
https://dev.tavla.be/api/auth/callback/apple
```

Start Next.js with `bun dev`, run Caddy, and open `https://dev.tavla.be`.

## QR Invitations

Each player profile includes a unique QR code. Players can share these codes in physical or digital spaces and receive match invitations from friends or new opponents.

QR codes are generated with:

**[@goker/qr-code](https://www.npmjs.com/package/@goker/qr-code)**

The longer-term idea is to let Light and Dark players defend their factions through QR challenges shared in cafés, events, universities, social profiles, and other physical or digital spaces.

A physical QR code can begin a digital battle.

## Author

Built by [goker](https://goker.me).

- DEV: [@gokerdev](https://dev.to/gokerDEV)
- GitHub: [gokerDEV](https://github.com/gokerDEV)

---

May the better side win.

Or at least roll doubles.
