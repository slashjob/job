"use client";

import { useEffect, type RefObject } from "react";

const first = (list: string) => list.split(/,(?![^(]*\))/)[0].trim();

const seconds = (value: string) => parseFloat(first(value)) * 1000;

const paceOf = (carrier: HTMLElement): KeyframeAnimationOptions => {
  const style = getComputedStyle(carrier);
  return {
    delay: seconds(style.transitionDelay),
    duration: seconds(style.transitionDuration),
    easing: first(style.transitionTimingFunction),
    fill: "backwards",
  };
};

export function useGlide(ref: RefObject<HTMLElement | null>, carrier: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => box.getBoundingClientRect().height;
    let settled = measure();
    let gliding: Animation | null = null;
    let changed = false;

    const glide = (from: number, to: number) => {
      if (still.matches || !carrier.current) return;
      const motion = box.animate([{ height: `${from}px` }, { height: `${to}px` }], paceOf(carrier.current));
      gliding = motion;
      motion.onfinish = () => {
        if (gliding === motion) gliding = null;
      };
    };

    const sizes = new ResizeObserver(() => {
      const moving = gliding;
      if (moving && !changed) return;
      changed = false;
      const from = moving ? measure() : settled;
      moving?.cancel();
      gliding = null;
      settled = measure();
      if (settled !== from) glide(from, settled);
    });
    const edits = new MutationObserver(() => {
      changed = true;
    });

    sizes.observe(box);
    edits.observe(box, { childList: true, subtree: true, attributes: true, characterData: true });
    return () => {
      sizes.disconnect();
      edits.disconnect();
      gliding?.cancel();
    };
  }, [ref, carrier]);
}
