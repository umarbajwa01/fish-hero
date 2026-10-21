import { useEffect, useRef } from "react";
import { THEMES } from "../themes.js";

export default function ServicesPanel({
  open,
  onClose,
  theme,
  onThemeChange,
  wireframe,
  onWireframeChange,
  onReplay,
}) {
  const dialog = useRef(null);
  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal();
    else if (!open && dialog.current.open) dialog.current.close();
  }, [open]);
  return (
    <dialog
      className="services-panel"
      ref={dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      aria-labelledby="services-title"
    >
      <div className="panel-content">
        <div className="panel-top">
          <span>THE ART OF MAKING</span>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close services"
          >
            ×
          </button>
        </div>
        <h2 id="services-title">
          A little craft.
          <br />A lot of possibility.
        </h2>
        <div className="service-list">
          <div>
            <span>01</span>
            <p>Brand identity</p>
            <span aria-hidden="true">↗</span>
          </div>
          <div>
            <span>02</span>
            <p>Digital experiences</p>
            <span aria-hidden="true">↗</span>
          </div>
          <div>
            <span>03</span>
            <p>Creative development</p>
            <span aria-hidden="true">↗</span>
          </div>
        </div>
        <div className="panel-settings">
          <p className="eyebrow">MAKE IT YOURS</p>
          <div
            className="palette-options"
            role="group"
            aria-label="Colour palette"
          >
            {Object.entries(THEMES).map(([id, palette]) => (
              <button
                key={id}
                aria-pressed={theme === id}
                onClick={() => onThemeChange(id)}
              >
                <i className={`swatch ${id}`} aria-hidden="true" />
                {palette.label}
              </button>
            ))}
          </div>
          <div className="panel-actions">
            <button
              className="text-button"
              onClick={() => onWireframeChange(!wireframe)}
              aria-pressed={!!wireframe}
            >
              See the skeleton <span aria-hidden="true">↗</span>
            </button>
            <button className="text-button" onClick={onReplay}>
              Watch original reference <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
        <button className="panel-back" onClick={onClose}>
          Back to the koi <span aria-hidden="true">↗</span>
        </button>
      </div>
    </dialog>
  );
}
