"use client";
import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import Fireflies from './Fireflies';
import Sakura from './Sakura';
import WindyGrass from './WindyGrass';

// 与下面容器的 duration-1000 保持一致：淡出放完再卸载
const FADE_MS = 1000;

export default function BackgroundEffects() {
  const { isDark } = useTheme();

  // opacity:0 不会暂停 CSS 动画，藏起来的那一套仍然会满帧跑。
  // 所以只在切换主题的这一秒里两套并存做交叉淡入淡出，之后把旧的摘掉。
  const [isCrossFading, setIsCrossFading] = useState(false);
  const [prevIsDark, setPrevIsDark] = useState(isDark);

  if (prevIsDark !== isDark) {
    setPrevIsDark(isDark);
    setIsCrossFading(true);
  }

  useEffect(() => {
    if (!isCrossFading) return;
    const timer = setTimeout(() => setIsCrossFading(false), FADE_MS);
    return () => clearTimeout(timer);
  }, [isCrossFading]);

  return (
    <>
      {/* 核心魔法：根据 isDark 切换特效组件 */}
      <div className={`transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        {(isDark || isCrossFading) && <Fireflies />}
      </div>
      <div className={`transition-opacity duration-1000 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        {(!isDark || isCrossFading) && <Sakura />}
      </div>

      {/* 草地一直存在，但它内部会自动改变颜色 */}
      <WindyGrass />
    </>
  );
}
