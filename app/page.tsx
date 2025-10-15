"use client";

import Link from "next/link";

const steps = [
  {
    title: "Add the Bot",
    description:
      "Invite @ShaadiFrameBot to your Telegram chats or start a direct conversation."
  },
  {
    title: "Capture Your Angles",
    description:
      "Send 4-6 clear photos covering close-up, half-body, and full-body perspectives."
  },
  {
    title: "Choose /Generate",
    description:
      "Use /new to begin a session, drop your reference photos, then run /generate."
  },
  {
    title: "Receive Wedding Shots",
    description:
      "ShaadiFrame AI delivers a curated set of 10-15 Indian wedding portfolio portraits."
  }
];

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "4rem",
        padding: "6rem 1.5rem",
        maxWidth: "960px",
        margin: "0 auto",
        lineHeight: 1.6
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div
          style={{
            padding: ".5rem 1.25rem",
            borderRadius: "999px",
            background:
              "linear-gradient(120deg, rgba(233,30,99,0.1), rgba(33,150,243,0.1))",
            width: "fit-content",
            fontSize: ".9rem",
            fontWeight: 600,
            letterSpacing: ".03em",
            textTransform: "uppercase"
          }}
        >
          Wedding Portrait AI
        </div>
        <h1
          style={{
            fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
            margin: 0,
            fontWeight: 700
          }}
        >
          ShaadiFrame — create a cinematic Indian wedding portfolio from your
          Telegram photos.
        </h1>
        <p style={{ fontSize: "1.1rem", maxWidth: "620px", margin: 0 }}>
          Upload your everyday pictures and ShaadiFrame stages you in designer
          sherwanis, lehengas, and modern Indian wedding venues. Built for quick
          talent decks, pre-wedding teasers, and destination ceremonies.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link
            href="https://t.me/ShaadiFrameBot"
            style={{
              background:
                "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #14b8a6 100%)",
              color: "#fff",
              padding: "0.85rem 1.45rem",
              borderRadius: "0.75rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 16px 32px rgba(139,92,246,0.25)"
            }}
          >
            Start Telegram Bot
          </Link>
          <Link
            href="#how-it-works"
            style={{
              border: "1px solid rgba(26,23,21,0.15)",
              padding: "0.85rem 1.45rem",
              borderRadius: "0.75rem",
              fontWeight: 600
            }}
          >
            How it works
          </Link>
        </div>
      </header>

      <section
        id="how-it-works"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.5rem"
        }}
      >
        {steps.map((step) => (
          <article
            key={step.title}
            style={{
              padding: "1.5rem",
              borderRadius: "1rem",
              background: "#fff",
              border: "1px solid rgba(26,23,21,0.08)",
              boxShadow: "0 16px 32px rgba(26,23,21,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem"
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
              {step.title}
            </h3>
            <p style={{ margin: 0, color: "rgba(26,23,21,0.75)" }}>
              {step.description}
            </p>
          </article>
        ))}
      </section>

      <section
        style={{
          padding: "2.5rem",
          borderRadius: "1.5rem",
          background:
            "linear-gradient(135deg, rgba(236,72,153,0.12), rgba(56,189,248,0.14))",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem"
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.75rem" }}>
          Production-ready pipeline in minutes
        </h2>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", gap: "1rem", display: "grid" }}>
          <li>
            <strong>Face-locked diffusion:</strong> Instant-ID + Flux models
            anchored on your provided references.
          </li>
          <li>
            <strong>Location library:</strong> Palace resorts, Jaipur heritage,
            modern Mumbai rooftops, Goan beaches, and more.
          </li>
          <li>
            <strong>Wardrobe styling:</strong> Mix of sherwanis, tuxedos, pastel
            lehengas, and couture drapes auto-rotated across shots.
          </li>
          <li>
            <strong>High-res delivery:</strong> 1024px+ PNGs delivered directly
            to your Telegram chat in under 2 minutes.
          </li>
        </ul>
        <p style={{ margin: 0 }}>
          Configure credentials via Vercel environment variables and link your
          bot webhook to <code>/api/telegram/webhook</code>. The agent handles
          session orchestration, queueing, and generation retries automatically.
        </p>
      </section>

      <footer
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(26,23,21,0.08)",
          paddingTop: "1.5rem"
        }}
      >
        <span>&copy; {new Date().getFullYear()} ShaadiFrame AI</span>
        <Link href="https://t.me/ShaadiFrameBot">Open Telegram</Link>
      </footer>
    </main>
  );
}
