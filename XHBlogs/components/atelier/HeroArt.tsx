"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
const Sculpture = dynamic(() => import("./MemorySculpture"), {
  ssr: false,
  loading: () => (
    <div className="sculpture-loading">
      <span />
      <span />
      <span />
    </div>
  ),
});
export default function HeroArt() {
  const [paused, setPaused] = useState(false);
  const [variant, setVariant] = useState<"orbit" | "flow">("orbit");
  return (
    <div className="hero-art">
      <div className="art-cross cross-one">+</div>
      <div className="art-cross cross-two">+</div>
      <div className="art-index eyebrow">
        FIG. 001 /{" "}
        {variant === "orbit" ? "CONNECTED THOUGHTS" : "A DIFFERENT PERSPECTIVE"}
      </div>
      <div className="sculpture-stage">
        <Sculpture paused={paused} variant={variant} />
      </div>
      <div className="art-bottom">
        <span className="eyebrow">
          思绪有形，探索无界。<small>DRAG TO EXPLORE</small>
        </span>
        <div className="art-controls">
          <button
            onClick={() => setVariant(variant === "orbit" ? "flow" : "orbit")}
            aria-label="切换雕塑形态"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "继续动画" : "暂停动画"}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
