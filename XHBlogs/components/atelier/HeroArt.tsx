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
      <div className="sculpture-stage">
        <Sculpture paused={paused} variant={variant} />
      </div>
      <div className="art-bottom">
        <span className="art-hint">拖一拖，让它转个身。</span>
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
            aria-pressed={paused}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
