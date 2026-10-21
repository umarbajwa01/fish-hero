import { useEffect, useRef, useState } from "react";
import KoiCanvas from "./components/KoiCanvas.jsx";
import Constellation from "./components/Constellation.jsx";
import ServicesPanel from "./components/ServicesPanel.jsx";
import FishColorFilters from "./components/FishColorFilters.jsx";
import { useMotionPreference } from "./hooks/useMotionPreference.js";
import { useScrollMotion } from "./hooks/useScrollMotion.js";
import { THEMES } from "./themes.js";

export default function App() {
  const root = useRef(null),
    scroll = useRef(0),
    referenceDialog = useRef(null);
  const [ready, setReady] = useState(false),
    [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("coral"),
    [wireframe, setWireframe] = useState(null);
  const [paused, setPaused] = useState(false),
    [referenceOpen, setReferenceOpen] = useState(false);
  const reduced = useMotionPreference();
  const palette = THEMES[theme];
  const motionPaused = paused || menuOpen || referenceOpen;
  useScrollMotion(root, scroll, reduced);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]').content =
      palette.background;
  }, [palette]);
  useEffect(() => {
    if (referenceOpen) {
      referenceDialog.current.showModal();
      referenceDialog.current
        .querySelector("video")
        .play()
        .catch(() => {});
    } else if (referenceDialog.current.open) {
      referenceDialog.current.querySelector("video").pause();
      referenceDialog.current.close();
    }
  }, [referenceOpen]);

  function viewReference() {
    setMenuOpen(false);
    setReferenceOpen(true);
  }
  return (
    <main
      className={`experience theme-${theme}${ready ? " is-ready" : ""}${reduced ? " reduce-motion" : ""}${motionPaused ? " is-motion-paused" : ""}`}
      ref={root}
    >
      <FishColorFilters />
      <a className="skip-link" href="#hero-copy">
        Skip to introduction
      </a>
      <div className="stage">
        <div className="atmosphere" aria-hidden="true" />
        <div className="paper-grain" aria-hidden="true" />
        <Constellation />
        <div className="hero-title-wrap">
          <h1 className="hero-title" id="hero-copy">
            Craft
          </h1>
        </div>
        <KoiCanvas
          theme={theme}
          scroll={scroll}
          reduced={reduced}
          wireframe={wireframe}
          paused={motionPaused}
          onReady={() => setReady(true)}
        />
        <header className="site-header">
          <button
            className="services-button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            <span className="hamburger" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="button-divider" aria-hidden="true" />
            <span>Services</span>
          </button>
        </header>
        <footer className="hero-footer">
          <div className="signature">
            <p>
              Branding shaped to endure and evolve
              <br className="desktop-break" /> with your ambition
            </p>
            <div className="wordmark" aria-label="Finsmith">
              FINSMITH<sup>®</sup>
            </div>
          </div>
          <div className="corner-controls">
            <span className="scroll-cue">
              <span aria-hidden="true">↓</span> Scroll to drift
            </span>
            <button
              className="motion-button"
              onClick={() => setPaused(!paused)}
              aria-label={
                paused ? "Resume scene animation" : "Pause scene animation"
              }
              aria-pressed={paused}
            >
              {paused ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 5 11 7-11 7Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14M16 5v14" />
                </svg>
              )}
            </button>
          </div>
        </footer>
        <div className="scroll-track" aria-hidden="true">
          <span className="scroll-fill" />
        </div>
        <div className="loading-state" aria-hidden={ready} aria-live="polite">
          <span className="loading-label">
            A LITTLE CRAFT IS COMING TO LIFE
          </span>
          <span className="loading-line" />
        </div>
        <span className="sr-only" role="status">
          {ready
            ? "Interactive koi ready. Move your pointer to guide the fish."
            : "Preparing the interactive koi."}
        </span>
      </div>
      <ServicesPanel
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        wireframe={wireframe}
        onWireframeChange={setWireframe}
        onReplay={viewReference}
      />
      <dialog
        className="reference-dialog"
        ref={referenceDialog}
        onCancel={() => setReferenceOpen(false)}
        aria-label="Original video reference"
      >
        <button
          className="reference-close"
          onClick={() => setReferenceOpen(false)}
          aria-label="Close reference video"
        >
          ×
        </button>
        <video
          src={palette.referenceVideo}
          controls
          playsInline
          loop
          muted
          preload="none"
        />
      </dialog>
    </main>
  );
}
