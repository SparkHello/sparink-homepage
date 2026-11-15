"use client";

import { useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import MemorySculpture from "../../components/atelier/MemorySculpture";
import "../../components/atelier/extras.css";
import "../../components/atelier/compact-pages.css";

export default function ExperimentPage() {
  const [paused, setPaused] = useState(false);
  const [variant, setVariant] = useState<"orbit" | "flow">("orbit");
  return (
    <main className="page-wrap extra-page experiment-page quiet-page">
      <header className="extra-heading">
        <h1>随便玩玩</h1>
        <p>拖一拖，换个角度看看。</p>
      </header>
      <div className="experiment-stage">
        <MemorySculpture paused={paused} variant={variant} />
        <div className="experiment-controls">
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            aria-pressed={paused}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
            {paused ? "继续旋转" : "暂停旋转"}
          </button>
          <button
            type="button"
            onClick={() => setVariant(variant === "orbit" ? "flow" : "orbit")}
          >
            <RotateCcw size={16} />
            {variant === "orbit" ? "切换流动形态" : "切换环绕形态"}
          </button>
        </div>
      </div>
    </main>
  );
}
