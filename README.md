# Tavla.be 🎲

Tavla.be is a modern, real-time online backgammon platform built with Next.js, MongoDB, and Pusher.

## 🚀 Getting Started

Follow these instructions to set up the project and run it in your local development environment.

### Prerequisites

- Node.js (or [Bun](https://bun.sh/))
- MongoDB database
- Pusher account (for real-time multiplayer features)
- Apple Developer Account (for Sign in with Apple)
- Google Cloud Console Account (for Google OAuth)
- Firebase Project (for Firebase Cloud Messaging / Offline Notifications)

### Installation

1. Clone the repository and install dependencies:

```bash
bun install
```

2. Configure environment variables:
Create a `.env.local` file in the root directory and configure the necessary variables (MongoDB URI, Pusher credentials, OAuth secrets, Firebase configs, etc.). See the `.env.sample` or refer to your existing setup.

### Authentication Setup

Tavla.be uses NextAuth.js (Auth.js) for handling authentications. To ensure OAuth flows (especially Apple) work properly, you need to set up the client secrets correctly.

**Apple Sign-In Setup:**
NextAuth v5 (Auth.js) automatically generates the required client secret on the fly if you provide the proper credentials. You do not need to manually generate or manage a static `APPLE_CLIENT_SECRET`.

Make sure the following variables are defined in your `.env.local` (as explained in `APPLE.md`):
- `APPLE_CLIENT_ID`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY`

### Local Development with HTTPS (Required for OAuth)

Google and Apple OAuth providers require a valid domain and a secure context (HTTPS) even for local development. Testing these flows on `http://localhost:3000` will result in redirection errors or blocked callbacks.

The most robust approach for local testing on a Mac is to use a custom local domain (`dev.tavla.be`), generate a local SSL certificate using `mkcert`, and route traffic through a reverse proxy like `Caddy`.

1. **Map Local Domain:**
   Edit your hosts file to point `dev.tavla.be` to your local machine:
   ```bash
   sudo nano /etc/hosts
   ```
   Add the following line:
   ```text
   127.0.0.1 dev.tavla.be
   ```

2. **Generate Local SSL Certificates:**
   Install `mkcert` (and `nss` for Firefox support if needed) via Homebrew, and generate certificates for your local domain:
   ```bash
   brew install mkcert nss
   mkcert -install
   mkcert dev.tavla.be
   ```
   This will generate two files in your current directory:
   - `dev.tavla.be.pem`
   - `dev.tavla.be-key.pem`

3. **Set Up a Local Reverse Proxy (Caddy):**
   Install Caddy via Homebrew:
   ```bash
   brew install caddy
   ```
   Create a file named `Caddyfile` in the directory where your certificates are located, and add the following configuration:
   ```caddyfile
   dev.tavla.be {
     reverse_proxy localhost:3000
     tls ./dev.tavla.be.pem ./dev.tavla.be-key.pem
   }
   ```
   Run the proxy:
   ```bash
   caddy run
   ```

### Testing OAuth Locally

1. **Start Next.js:**
   Run the Next.js development server on its default port:
   ```bash
   bun dev
   ```

2. **Configure Environment:**
   Update your `.env.local` to point to the secure local domain:
   ```env
   NEXTAUTH_URL="https://dev.tavla.be"
   ```


   ```next.config.ts
   module.exports = {
     allowedDevOrigins: ['dev.tavla.be'],
   }
   ```

3. **Update Provider Consoles:**
   Go to your Google Cloud Console and Apple Developer Portal, and update your allowed redirect URIs to point to your new secure local domain:
   - Google Redirect URI: `https://dev.tavla.be/api/auth/callback/google`
   - Apple Redirect URI: `https://dev.tavla.be/api/auth/callback/apple`

4. **Test the Flow:**
   Open your browser and navigate to `https://dev.tavla.be`. Click "Sign in with Apple / Google". Because you are using a real domain structure + HTTPS callback, the OAuth providers will process the request successfully and redirect back to your local environment without issues.

## 🛠 Features
- **Real-Time Gameplay:** Smooth, synchronized state updates between opponents powered by Pusher.
- **OAuth Providers:** Quick and secure sign-in via Google and Apple.
- **Game Replay:** Stores match snapshots to MongoDB to allow replaying finished games via the `/replay` route.
- **Custom QR Invitations:** Play against friends through fast QR code game challenges.
