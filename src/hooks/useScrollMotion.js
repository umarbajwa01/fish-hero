import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export function useScrollMotion(root, scroll, reduced) {
  useEffect(() => {
    if (reduced) {
      scroll.current = 0;
      return;
    }
    const lenis = new Lenis({
      duration: 1.12,
      smoothWheel: true,
      syncTouch: false,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (seconds) => lenis.raf(seconds * 1000);
    gsap.ticker.add(tick);
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.9,
          onUpdate: (self) => {
            scroll.current = self.progress;
          },
        },
      });
      timeline.to(
        ".hero-title",
        { scale: 1.1, yPercent: -7, letterSpacing: "-0.065em", ease: "none" },
        0,
      );
      timeline.to(
        ".constellation",
        { rotation: 7, scale: 1.04, yPercent: -5, ease: "none" },
        0,
      );
      timeline.to(".scroll-fill", { scaleX: 1, ease: "none" }, 0);
      timeline.to(".scroll-cue", { opacity: 0, y: -10, duration: 0.3 }, 0);
    }, root);
    return () => {
      context.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [root, scroll, reduced]);
}
