"use client";

import { useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import MemorySculpture from "../../components/atelier/MemorySculpture";
import "../../components/atelier/extras.css";

export default function ExperimentPage() {
  const [paused, setPaused] = useState(false);
  const [variant, setVariant] = useState<"orbit" | "flow">("orbit");
  return (
    <section className="page-wrap extra-page experiment-page">
      <header className="extra-heading">
        <span className="eyebrow">EXPERIMENT 001 / 形态实验</span>
        <h1>
          让秩序，
          <br />
          <em>有一点意外。</em>
        </h1>
        <p>
          无数条路径，汇成一个整体。试着移动指针，从另一个角度观察这个不断变化的形体。
        </p>
      </header>
      <div className="experiment-stage">
        <span className="experiment-label extra-mono">
          SPARINK — MEMORY FORM
        </span>
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
      <div className="experiment-caption">
        <span className="extra-mono">CODE AS MATERIAL.</span>
        <p>
          一个关于连接与记忆的视觉练习。每条线都有自己的轨迹，也都是整体的一部分。
        </p>
      </div>
    </section>
  );
}
