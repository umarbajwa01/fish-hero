import { useEffect, useRef } from "react";
import { createExperience } from "../scene/createExperience.js";

export default function KoiCanvas({ theme, scroll, reduced, wireframe, paused, onReady }) {
  const host = useRef(null);
  const experience = useRef(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  useEffect(() => {
    experience.current = createExperience(host.current, {
      scroll,
      reducedMotion: reduced,
      onReady: () => onReadyRef.current(),
    });
    return () => {
      experience.current?.dispose();
      experience.current = null;
    };
  }, [scroll]);
  useEffect(() => experience.current?.setTheme(theme), [theme]);
  useEffect(() => experience.current?.setWireframe(wireframe), [wireframe]);
  useEffect(() => experience.current?.setPaused(paused), [paused]);
  useEffect(() => experience.current?.setReducedMotion(reduced), [reduced]);
  return <div className="koi-layer" ref={host} aria-hidden="true" />;
}
