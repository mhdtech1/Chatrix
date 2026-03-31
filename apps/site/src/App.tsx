const deskModes = [
  {
    name: "Streamer Desk",
    copy: "Keep your own channel in focus with lightweight routing, send controls, and room health without drowning the chat feed in chrome.",
  },
  {
    name: "Mod Desk",
    copy: "Switch into a denser moderation workflow when you are managing raids, shared chat, or multiple channels at once.",
  },
  {
    name: "Viewer Desk",
    copy: "Drop the heavy controls and stay locked on the conversation when you just want to watch and follow the stream.",
  },
];

const featureCards = [
  {
    eyebrow: "One workspace",
    title: "Every major chat in one command center",
    copy: "Bring Twitch, Kick, YouTube, and TikTok into one desktop view so your team is not tab-hopping through a live show.",
  },
  {
    eyebrow: "Role aware",
    title: "The UI adapts to your lane",
    copy: "Chatrix senses whether you are the broadcaster, a moderator, or just watching and trims the desk to match the job.",
  },
  {
    eyebrow: "Live moderation",
    title: "Fast actions when things get messy",
    copy: "Timeouts, bans, mentions, search, and emergency controls stay close without burying the chat itself.",
  },
  {
    eyebrow: "Kick support",
    title: "Kick auth that feels like part of the app",
    copy: "Hosted broker support keeps the shared secret off the desktop build while making sign-in feel straightforward for end users.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Open the desk",
    copy: "Launch the desktop app, pick a platform, and open a channel tab in a couple of keystrokes.",
  },
  {
    step: "02",
    title: "Chatrix chooses the right layout",
    copy: "The app reacts to your role in the active channel and uses the desk that makes the most sense for that moment.",
  },
  {
    step: "03",
    title: "Run chat instead of chasing it",
    copy: "Send, moderate, search, filter, and watch room health from one place while keeping the feed readable.",
  },
];

const faqs = [
  {
    question: "What platforms does Chatrix support?",
    answer:
      "Chatrix is built around Twitch, Kick, YouTube, and TikTok with a shared message model and platform-specific auth and moderation flows where available.",
  },
  {
    question: "Is this a browser dashboard?",
    answer:
      "No. Chatrix is a desktop app, so the website is the front door for downloads, release notes, and product positioning.",
  },
  {
    question: "Does Kick require users to enter their own client secret?",
    answer:
      "No. Public builds use the hosted broker path so users sign in normally without handling developer credentials themselves.",
  },
  {
    question: "What about macOS Gatekeeper?",
    answer:
      "Unsigned builds can still show Gatekeeper warnings. The app can be opened manually today, and signed notarized releases are the long-term fix.",
  },
];

const releaseHighlights = [
  "Role-based desk switching",
  "Kick broker warm-up and auth stability work",
  "Cleaner workspace chrome and quieter Quick Mod defaults",
  "Intel Mac release support",
];

const downloadLinks = {
  mac: "https://github.com/mhdtech1/Chatrix/releases/latest/download/Chatrix-mac.dmg",
  windows:
    "https://github.com/mhdtech1/Chatrix/releases/latest/download/Chatrix-win.exe",
  github: "https://github.com/mhdtech1/Chatrix",
  releases: "https://github.com/mhdtech1/Chatrix/releases",
};

function App() {
  return (
    <div className="site-shell">
      <div className="site-noise" aria-hidden="true" />
      <header className="site-header">
        <a className="brand-mark" href="#top" aria-label="Chatrix home">
          <span className="brand-mark__dot" />
          <span className="brand-mark__text">
            <strong>Chatrix</strong>
            <span>Unified streaming desk</span>
          </span>
        </a>

        <nav className="site-nav" aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#desks">Desks</a>
          <a href="#faq">FAQ</a>
          <a className="site-nav__button" href={downloadLinks.releases}>
            Releases
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Desktop app for live shows that move fast</p>
            <h1>
              Run every live chat from one desk that actually stays readable.
            </h1>
            <p className="hero-lead">
              Chatrix brings Twitch, Kick, YouTube, and TikTok into a single
              command center for broadcasters, moderators, and teams who need to
              stay on top of the room without drowning in tab chaos.
            </p>

            <div className="hero-actions">
              <a className="button button--primary" href={downloadLinks.mac}>
                Download for macOS
              </a>
              <a
                className="button button--secondary"
                href={downloadLinks.windows}
              >
                Download for Windows
              </a>
              <a className="button button--ghost" href={downloadLinks.github}>
                View GitHub
              </a>
            </div>

            <div className="hero-meta">
              <span>Current public release: v1.0.9</span>
              <span>Electron desktop app</span>
              <span>Kick, Twitch, YouTube, TikTok</span>
            </div>
          </div>

          <div className="hero-stage" aria-label="Chatrix product preview">
            <div className="hero-stage__badge hero-stage__badge--left">
              <span>Role aware</span>
              <strong>Broadcaster / Mod / Viewer</strong>
            </div>
            <div className="hero-stage__badge hero-stage__badge--right">
              <span>Live auth path</span>
              <strong>Kick broker + local secure storage</strong>
            </div>

            <div className="app-frame">
              <div className="app-frame__topbar">
                <div>
                  <p>UNIFIED STREAMING DESK</p>
                  <strong>Chatrix</strong>
                </div>
                <div className="app-frame__controls">
                  <span>Twitch</span>
                  <span>mazendahroug</span>
                  <button type="button">Menu</button>
                </div>
              </div>

              <div className="app-frame__body">
                <div className="app-frame__primary">
                  <div className="app-frame__tabs">
                    <span className="app-pill app-pill--active">
                      kick/mazendahroug
                    </span>
                    <span className="app-pill">twitch/mazendahroug</span>
                    <span className="app-pill app-pill--quiet">merged</span>
                  </div>

                  <div className="app-frame__statusrow">
                    <span>246 messages</span>
                    <span>Desk: Mod</span>
                    <span>Adaptive perf on</span>
                  </div>

                  <div className="app-frame__feed">
                    <div className="chat-line-preview">
                      <strong>ViewerOne</strong>
                      <span>shared chat is moving again</span>
                    </div>
                    <div className="chat-line-preview chat-line-preview--accent">
                      <strong>Moderator</strong>
                      <span>role-aware desk switched to mod controls</span>
                    </div>
                    <div className="chat-line-preview">
                      <strong>ViewerTwo</strong>
                      <span>nice, way easier to read now</span>
                    </div>
                    <div className="chat-line-preview">
                      <strong>Streamer</strong>
                      <span>send a welcome message to all chats</span>
                    </div>
                  </div>

                  <div className="app-frame__composer">
                    <span>twitch/mazendahroug</span>
                    <span>Type a message...</span>
                    <button type="button">Send</button>
                  </div>
                </div>

                <aside className="app-frame__sidebar">
                  <div>
                    <strong>Mentions</strong>
                    <span>3 open</span>
                  </div>
                  <div>
                    <strong>Mod History</strong>
                    <span>Ban, timeout, unban</span>
                  </div>
                  <div>
                    <strong>User Card</strong>
                    <span>Session activity at a glance</span>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-grid" id="features">
          {featureCards.map((card) => (
            <article key={card.title} className="feature-card">
              <p className="eyebrow">{card.eyebrow}</p>
              <h2>{card.title}</h2>
              <p>{card.copy}</p>
            </article>
          ))}
        </section>

        <section className="release-band">
          <div>
            <p className="eyebrow">Shipped recently</p>
            <h2>Built in public. Tightening the desk every release.</h2>
          </div>
          <ul>
            {releaseHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="desks-section" id="desks">
          <div className="section-heading">
            <p className="eyebrow">Desk presets</p>
            <h2>The app shifts shape with the room you are in.</h2>
            <p>
              We are not forcing one giant mod console on every user. Chatrix
              can stay lean when you are watching and get denser only when you
              actually need to run the room.
            </p>
          </div>

          <div className="desk-grid">
            {deskModes.map((mode) => (
              <article key={mode.name} className="desk-card">
                <h3>{mode.name}</h3>
                <p>{mode.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="workflow-section">
          <div className="section-heading">
            <p className="eyebrow">How it works</p>
            <h2>Fast enough for live production.</h2>
          </div>
          <div className="workflow-grid">
            {workflow.map((item) => (
              <article key={item.step} className="workflow-card">
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-panel">
          <div>
            <p className="eyebrow">Download Chatrix</p>
            <h2>Get the desktop build and run your chats from one place.</h2>
            <p>
              Start with the latest release, then keep an eye on GitHub for the
              next round of polish, auth work, and moderation improvements.
            </p>
          </div>
          <div className="cta-panel__actions">
            <a className="button button--primary" href={downloadLinks.mac}>
              macOS DMG
            </a>
            <a
              className="button button--secondary"
              href={downloadLinks.windows}
            >
              Windows EXE
            </a>
            <a className="button button--ghost" href={downloadLinks.releases}>
              Release notes
            </a>
          </div>
        </section>

        <section className="faq-section" id="faq">
          <div className="section-heading">
            <p className="eyebrow">FAQ</p>
            <h2>The practical stuff.</h2>
          </div>
          <div className="faq-list">
            {faqs.map((item) => (
              <details key={item.question} className="faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <strong>Chatrix</strong>
          <span>Desktop chat command center for live teams.</span>
        </div>
        <div className="site-footer__links">
          <a href={downloadLinks.github}>GitHub</a>
          <a href={downloadLinks.releases}>Releases</a>
          <a href="mailto:hello@chatrix.app">Contact</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
