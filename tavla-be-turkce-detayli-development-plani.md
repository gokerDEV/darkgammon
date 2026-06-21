# Tavla.be — 4 Fazlı Development Planı

## Bağlam

`tavla.be` şu anda yayına alınmış, Next.js tabanlı bir web tavla oyunu. Mevcut yapı zaten canlı bir oyun akışına sahip:

- Kullanıcı ana sayfadan maç oluşturuyor.
- Maç için `/ni/[sessionId]` route’u açılıyor.
- Oyuncular Pusher üzerinden realtime olarak haberleşiyor.
- Oyun state’i client tarafında tutuluyor.
- Replay için snapshot’lar browser storage içinde biriktiriliyor.
- Oyun sonunda replay video export alınabiliyor.

Yeni hedef ise oyunu basit bir link paylaşım prototipinden çıkarıp, **profil tabanlı bir oyuncu sistemine** taşımak:

- Google Login
- Apple Login
- Profil oluşturma
- Profil sayfası
- Profile özel QR code
- QR üzerinden oyun daveti
- In-app notification
- Sonrasında kalıcı game session ve replay storage

Genel bekleme odası, random matchmaking, ranking veya lobby sistemi bu aşamada yok. Sistem basit kalmalı:

```txt
Oyuncu profili
  -> profile özel QR code
  -> QR üzerinden challenge gönderme
  -> challenge kabul edilince tavla maçı başlatma
```

---

## Mevcut Kod Durumu

Repo doğru şekilde `gokerDEV/tavla.be` altında, private repo olarak duruyor. Mevcut package yapısı Next.js üzerinde:

```txt
next dev
next build
next start
biome check
biome format --write
```

Mevcut stack:

```txt
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui / Radix UI
Pusher
pusher-js
html-to-image
mp4-muxer
WebCodecs VideoEncoder
Biome
```

Ana sayfa:

```txt
src/app/page.tsx
```

Oyun route’u:

```txt
src/app/ni/[sessionId]/page.tsx
```

Replay route’u:

```txt
src/app/replay/page.tsx
```

Profil hook’u:

```txt
src/lib/profile/useLocalProfile.ts
```

Realtime server action:

```txt
src/lib/games/tictactoe/session.functions.ts
```

Pusher server helper:

```txt
src/lib/realtime/pusher.server.ts
```

Pusher client hook:

```txt
src/lib/realtime/usePusher.ts
```

Realtime config route:

```txt
src/app/api/realtime-config/route.ts
```

---

## Mevcut Ana Problem

Oyuncu kimliği ve oyun state’i hâlâ browser storage’a bağlı.

Şu an profil tarafı şu localStorage key’leriyle çalışıyor:

```txt
pwm:userId
pwm:nickname
pwm:challengeMsg
pwm:giphyUrl
```

Oyun session tarafı:

```txt
pwm:bg-host:[sessionId]
pwm:bg-session:[sessionId]
```

Replay snapshot tarafı:

```txt
pwm:bg-snaps:[sessionId]
```

Bu yapı canlı web oyunu için hızlı prototip olarak yeterli, ama yeni hedefler için sorunlu:

- Google/Apple login ile gerçek kullanıcı bağlanamaz.
- Profil kalıcı değildir.
- QR code bir profile bağlanamaz.
- Notification gerçek kullanıcıya yönlendirilemez.
- Challenge DB’de takip edilemez.
- Replay yalnızca aynı browser session’ında güvenilir çalışır.
- Farklı cihazdan oyuna veya replay’e dönmek mümkün değildir.
- App tarafına geçildiğinde session restore zayıf kalır.

Bu yüzden yapılacak işin ana omurgası:

```txt
localStorage profile
  -> authenticated user profile

localStorage/sessionStorage game state
  -> MongoDB-backed session and snapshots

direct invite link
  -> profile QR -> challenge -> notification -> game session
```

---

# Faz 1 — Auth + MongoDB Foundation

## Amaç

Mevcut yayındaki oyunu bozmadan, kalıcı kullanıcı ve profil altyapısını eklemek.

Bu fazda oyun mekaniğine minimum dokunulmalı. Öncelik Google Login, Apple Login, MongoDB bağlantısı ve ilk profil modelinin kurulmasıdır.

## Eklenecek Paketler

```bash
bun add next-auth @auth/mongodb-adapter mongodb
```

Opsiyonel yardımcı paketler:

```bash
bun add nanoid
```

QR tarafı Faz 2’de ekleneceği için burada şart değil.

## Eklenecek Env Değerleri

```env
MONGODB_URI=

AUTH_SECRET=
AUTH_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
APPLE_ISSUER=
APPLE_KEY_ID=
APPLE_TEAM_ID=
APPLE_PRIVATE_KEY=

PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
```

## Yeni Dosya Yapısı

```txt
src/auth.ts
src/lib/db/mongodb.ts
src/lib/auth/session.ts
src/app/api/auth/[...nextauth]/route.ts
src/app/profile/setup/page.tsx
src/app/profile/page.tsx
src/app/api/profile/route.ts
src/app/api/profile/me/route.ts
```

## MongoDB Collections

Auth.js adapter collections:

```txt
users
accounts
sessions
verification_tokens
```

Uygulama collection’ı:

```txt
profiles
```

## Profile Modeli

```ts
type Profile = {
  _id: ObjectId;
  userId: ObjectId;

  handle: string;
  displayName: string;
  avatarUrl?: string;

  challengeMessage: string;
  victoryGifUrl?: string;

  qrToken: string;

  createdAt: Date;
  updatedAt: Date;
};
```

## Önemli Karar

`useLocalProfile` hemen silinmemeli.

Mevcut localStorage profili migration bridge olarak kullanılmalı:

```txt
nickname      -> displayName
challengeMsg  -> challengeMessage
giphyUrl       -> victoryGifUrl
```

Yani kullanıcı ilk defa Google/Apple ile login olduğunda, eski local bilgiler profile setup formunda öneri olarak gösterilebilir.

## Ana Sayfa Davranışı

Faz 1 sonunda ana sayfa şu karar ağacını kullanmalı:

```txt
Kullanıcı login değilse
  -> Google ile giriş
  -> Apple ile giriş

Kullanıcı login ama profili yoksa
  -> /profile/setup

Kullanıcı login ve profili varsa
  -> Tavla beni =) butonu
  -> Profilim
  -> QR kodum
```

## Kabul Kriterleri

- Google Login çalışır.
- Apple Login çalışır.
- Auth session server ve client tarafında okunabilir.
- Login sonrası profil yoksa kullanıcı profile setup’a yönlenir.
- Profil setup eski localStorage nickname/message/gif değerlerini önerebilir.
- Profil oluşturulduktan sonra profil MongoDB’ye yazılır.
- Mevcut `/ni/[sessionId]` oyun akışı bozulmaz.
- Mevcut replay export bu fazda bozulmaz.

---

# Faz 2 — Profil Sistemi + Profile Özel QR Code

## Amaç

Oyuncuyu anonim local kullanıcı olmaktan çıkarıp kalıcı profile taşımak.

Bu fazda her oyuncunun:

- Public profile sayfası
- Private profile dashboard’u
- Kalıcı QR token’ı
- QR code görseli
- Challenge entry point’i

olmalı.

## Yeni Route’lar

```txt
/profile
/u/[handle]
/qr/[token]
/profile/qr
```

## Yeni API Route’ları

```txt
GET  /api/profile/me
PATCH /api/profile/me
GET  /api/profile/[handle]
GET  /api/qr/[token]
```

## Public Profile Sayfası

Route:

```txt
/u/[handle]
```

İçerik:

```txt
Avatar
Display name
Handle
Challenge message
Tavla beni =) butonu
QR code
Profil linkini kopyala
```

## QR Route

Route:

```txt
/qr/[token]
```

QR doğrudan handle’a değil token’a gitmeli.

Sebep:

```txt
/u/[handle] değişebilir.
/qr/[token] kalıcı kalır.
```

Önerilen QR target:

```txt
https://tavla.be/qr/[qrToken]
```

Bu sayfa token’ı çözer ve ilgili profile challenge gönderme akışını başlatır.

## GamePlayer Modeline Geçiş

Mevcut player objesi local bilgi taşıyor:

```ts
type LocalPlayer = {
  localUserId: string;
  nickname: string;
  challengeMsg?: string;
  giphyUrl?: string;
};
```

Yeni akışlarda hedef model:

```ts
type GamePlayer = {
  userId: string;
  profileId: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  challengeMessage: string;
  victoryGifUrl?: string;
};
```

Faz 2’de aktif oyun state’i tamamen DB’ye taşınmak zorunda değil. Ama yeni challenge/profile akışlarında bu model kullanılmaya başlanmalı.

## QR Component

Eklenecek component:

```txt
src/components/profile/ProfileQrCard.tsx
src/components/profile/ProfileCard.tsx
```

Kullanılabilecek paket:

```bash
bun add qrcode
```

veya React component tercih edilirse:

```bash
bun add react-qr-code
```

## Kabul Kriterleri

- Her login olmuş kullanıcının bir profili vardır.
- Profile unique handle atanır.
- Profile kalıcı `qrToken` atanır.
- `/u/[handle]` public olarak açılır.
- `/qr/[token]` profile resolve eder.
- QR code taranınca doğru profile gider.
- Login olmayan kullanıcı QR sayfasını açabilir ama challenge göndermek için login’e yönlenir.
- Handle değişse bile QR bozulmaz.

---

# Faz 3 — QR Challenge + Notification Flow

## Amaç

Asıl ürün akışını kurmak:

```txt
Bir oyuncu başka bir oyuncunun QR kodunu okur,
ona tavla daveti gönderir,
hedef oyuncu notification alır,
kabul ederse oyun başlar.
```

Genel lobby yok. Random match yok. Bekleme odası yok.

## Ürün Akışı

```txt
1. Oyuncu A profilindeki QR kodu gösterir.
2. Oyuncu B QR kodu okur.
3. B /qr/[token] sayfasına gelir.
4. B login değilse Google/Apple login olur.
5. B “Tavla daveti gönder” butonuna basar.
6. Challenge MongoDB’ye pending olarak yazılır.
7. Oyuncu A profile channel üzerinden notification alır.
8. A kabul veya reddeder.
9. Kabul edilirse game session oluşturulur.
10. A ve B /ni/[sessionId] sayfasına yönlendirilir.
```

## Challenge Collection

```ts
type Challenge = {
  _id: ObjectId;

  fromProfileId: ObjectId;
  toProfileId: ObjectId;

  status:
    | "pending"
    | "accepted"
    | "declined"
    | "expired"
    | "cancelled";

  gameKind: "backgammon";
  sessionId?: string;

  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
};
```

## Notification Collection

```ts
type Notification = {
  _id: ObjectId;

  userId: ObjectId;
  profileId: ObjectId;

  type:
    | "challenge_received"
    | "challenge_accepted"
    | "challenge_declined"
    | "game_started";

  title: string;
  body: string;
  data: Record<string, unknown>;

  readAt?: Date;
  createdAt: Date;
};
```

## Challenge API’leri

```txt
POST /api/challenges
GET  /api/challenges/inbox
GET  /api/challenges/sent
POST /api/challenges/[id]/accept
POST /api/challenges/[id]/decline
POST /api/challenges/[id]/cancel
```

## Notification API’leri

```txt
GET  /api/notifications
POST /api/notifications/[id]/read
POST /api/notifications/read-all
```

## Pusher Channel Yapısı

Mevcut oyun channel’ı korunabilir:

```txt
bg-[sessionId]
```

Yeni profile channel:

```txt
profile-[profileId]
```

Event’ler:

```txt
notification:new
challenge:new
challenge:accepted
challenge:declined
game:started
```

## UI Component’leri

```txt
src/components/notifications/NotificationBell.tsx
src/components/notifications/NotificationDropdown.tsx
src/components/notifications/ChallengeToast.tsx
src/components/challenges/ChallengeRequestCard.tsx
src/components/challenges/ChallengeActions.tsx
```

## Challenge Kabul Edilince

Kabul akışı:

```txt
1. Challenge status accepted olur.
2. Yeni sessionId üretilir.
3. Host/player profile bilgileriyle game session hazırlanır.
4. Challenge içine sessionId yazılır.
5. Her iki tarafa notification gider.
6. Kullanıcılar /ni/[sessionId] route’una yönlendirilir.
```

Bu fazda session hâlâ compatibility layer olarak mevcut local/session mantığını kullanabilir. Ancak challenge ve notification DB’de kalıcı olmalı.

## Kabul Kriterleri

- QR üzerinden challenge gönderilebilir.
- Hedef oyuncu uygulama açıksa anlık notification alır.
- Challenge notification listesinde görünür.
- Challenge kabul edilebilir.
- Challenge reddedilebilir.
- Kabul edilince session oluşturulur.
- İki oyuncu `/ni/[sessionId]` içine gidebilir.
- Genel lobby eklenmez.
- Aynı hedef profile spam challenge gönderimi rate limit ile engellenir.
- Expired challenge tekrar kullanılamaz.

---

# Faz 4 — DB-backed Game Session + Replay Persistence

## Amaç

Oyun state’ini ve replay verisini browser storage’dan MongoDB’ye taşımak.

Bu fazdan sonra oyun production seviyesine yaklaşır:

- Refresh sonrası oyun kaybolmaz.
- Farklı cihazdan oyun restore edilebilir.
- Notification deep-link doğru state’e gider.
- Replay herhangi bir cihazdan açılabilir.
- Video export DB snapshot’larından üretilebilir.

## Mevcut Problem

Şu an oyun state’i localStorage’da:

```txt
pwm:bg-session:[sessionId]
pwm:bg-host:[sessionId]
```

Replay snapshot’ları sessionStorage’da:

```txt
pwm:bg-snaps:[sessionId]
```

Bunun sonuçları:

```txt
- Oyun yalnızca aynı browser’da güvenilir.
- Replay yalnızca aynı browser session’ında güvenilir.
- QR challenge ile başlayan maç kalıcı değildir.
- Kullanıcı başka cihazdan devam edemez.
- Notification ile açılan link source of truth taşımaz.
```

## GameSession Collection

```ts
type GameSession = {
  _id: ObjectId;

  sessionId: string;

  status:
    | "created"
    | "playing"
    | "finished";

  host: GamePlayer;
  player?: GamePlayer;

  state: BgState;

  winnerProfileId?: ObjectId;
  createdFromChallengeId?: ObjectId;

  createdAt: Date;
  updatedAt: Date;
  finishedAt?: Date;
};
```

## GameSnapshot Collection

```ts
type GameSnapshot = {
  _id: ObjectId;

  sessionId: string;
  seq: number;

  state: BgState;

  createdAt: Date;
};
```

## Session API’leri

```txt
POST /api/sessions
GET  /api/sessions/[sessionId]
PATCH /api/sessions/[sessionId]
POST /api/sessions/[sessionId]/join
POST /api/sessions/[sessionId]/leave
POST /api/sessions/[sessionId]/resign
```

## Snapshot API’leri

```txt
GET  /api/sessions/[sessionId]/snapshots
POST /api/sessions/[sessionId]/snapshots
```

## `/ni/[sessionId]` Değişimi

Mevcut davranış:

```txt
localStorage’dan session oku
state değişince localStorage’a yaz
Pusher ile state:update gönder
snapshot’ı sessionStorage’a ekle
```

Yeni davranış:

```txt
GET /api/sessions/[sessionId] ile session oku
state değişince PATCH /api/sessions/[sessionId]
snapshot için POST /api/sessions/[sessionId]/snapshots
Pusher ile sadece session:updated event’i gönder
diğer client güncel state’i API’den alır veya event payload ile sync olur
```

## Pusher’ın Rolü

Pusher artık source of truth olmamalı.

Doğru yapı:

```txt
Client action
  -> local validation
  -> server/API validation
  -> MongoDB update
  -> snapshot write
  -> Pusher event
  -> diğer client güncel state’i alır
```

Event önerileri:

```txt
session:updated
session:joined
session:finished
peer:ping
peer:leave
```

## Replay Route Değişimi

Mevcut route:

```txt
/replay?s=[sessionId]
```

Önerilen route:

```txt
/replay/[sessionId]
```

Yeni replay API:

```txt
GET /api/replay/[sessionId]
```

Response:

```ts
type ReplayPayload = {
  session: GameSession;
  snapshots: GameSnapshot[];
};
```

## Video Export

Mevcut video export korunmalı. Çünkü ürünün en kritik parçası bu.

Şu an route içinde çalışan logic ayrıştırılmalı:

```txt
src/lib/replay/buildReplayRecord.ts
src/lib/replay/exportWebMp4.ts
src/components/replay/ReplayComposer.tsx
src/components/replay/ReplayControls.tsx
```

Mevcut yapı:

```txt
html-to-image
VideoEncoder
mp4-muxer
```

korunmalı, sadece data source localStorage/sessionStorage yerine MongoDB olmalı.

## Kabul Kriterleri

- Oyun state’i MongoDB’den yüklenir.
- Oyun refresh sonrası devam eder.
- Oyuncu farklı cihazdan session’a dönebilir.
- QR challenge ile başlayan maç DB’ye bağlıdır.
- Replay herhangi bir cihazdan açılabilir.
- Replay snapshot’ları MongoDB’den okunur.
- MP4 export çalışmaya devam eder.
- Pusher sadece realtime sync için kullanılır.
- localStorage/sessionStorage production source of truth olmaktan çıkar.

---

# Önerilen PR Sırası

## PR 1 — Auth and Profile Foundation

```txt
Auth.js, MongoDB, Google Login, Apple Login ve profile onboarding eklenir.
```

İçerik:

```txt
MongoDB client
Auth.js config
Google provider
Apple provider
Profile model
Profile setup page
Session helper
Local profile migration bridge
```

## PR 2 — Public Profiles and QR Codes

```txt
Public profile sayfaları ve stable QR invite URL’leri eklenir.
```

İçerik:

```txt
/profile
/u/[handle]
/qr/[token]
QR token generation
QR display component
Profile card
Challenge entry point
```

## PR 3 — Challenges and Notifications

```txt
QR tabanlı challenge request ve in-app notification flow eklenir.
```

İçerik:

```txt
Challenge collection
Notification collection
Challenge APIs
Notification APIs
Profile-level Pusher channel
Notification bell/dropdown
Challenge accept/decline flow
```

## PR 4 — Persistent Sessions and Replay Data

```txt
Game session ve replay snapshot verileri browser storage’dan MongoDB’ye taşınır.
```

İçerik:

```txt
Game session collection
Game snapshot collection
Session APIs
Snapshot APIs
/ni/[sessionId] DB-backed loading
/replay/[sessionId] DB-backed replay
Replay export refactor
```

---

# Uygulama Önceliği

Önerilen sıra:

```txt
1. Auth + MongoDB + profile onboarding
2. Public profile + QR token
3. Challenge + notification flow
4. DB-backed sessions + DB-backed replay
```

Bu sıra mantıklı çünkü mevcut web oyunu zaten yayında. İlk adımda gameplay’i kırmadan identity/profile katmanı kurulmalı. Ardından QR ve challenge flow eklenmeli. En son session ve replay persistence DB’ye taşınmalı.

---

# Bu 4 Fazın Dışında Kalacaklar

Şimdilik scope dışı kalmalı:

```txt
Global lobby
Random matchmaking
Ranking / ladder
Friend system
Chat
Multiple games
Coins / betting / rewards
Native iOS package
Server-side video rendering
```

Bunlar ancak profil tabanlı QR challenge akışı stabil olduktan sonra düşünülmeli.

---

# Kritik Notlar

## 1. LocalStorage hemen silinmemeli

Mevcut live web oyun bozulmasın diye localStorage önce migration bridge olarak kullanılmalı.

## 2. QR handle’a değil token’a gitmeli

Handle değişebilir. QR token kalıcı olmalı.

## 3. Pusher source of truth olmamalı

Pusher sadece realtime bildirim taşımalı. Gerçek state MongoDB’de olmalı.

## 4. Replay export korunmalı

Video export ürünün en güçlü parçası. Refactor edilmeli ama kaldırılmamalı.

## 5. App Store öncesi Phase 4 bitmeli

Apple Store / native app tarafına geçmeden önce session ve replay DB-backed hale gelmeli. Aksi halde app içinde restore, notification deep-link ve replay güvenilir çalışmaz.
