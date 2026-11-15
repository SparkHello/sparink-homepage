"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useState, type ComponentProps, type ReactNode } from "react";

type AlbumMemory = { selected: Record<string, number>; remember: (albumId: string, index: number) => void };
const AlbumMemoryContext = createContext<AlbumMemory>({ selected: {}, remember: () => {} });

/** Keep the photo someone was holding while moving between the home, shelf and album. */
export function AlbumNavigationProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const remember = useCallback((albumId: string, index: number) => {
    setSelected(previous => previous[albumId] === index ? previous : { ...previous, [albumId]: index });
  }, []);
  const value = useMemo(() => ({ selected, remember }), [selected, remember]);
  return <AlbumMemoryContext.Provider value={value}>{children}</AlbumMemoryContext.Provider>;
}

export function useAlbumNavigation() { return useContext(AlbumMemoryContext); }

export function AlbumCoverLink({ albumId, photoIndex, children, ...props }: Omit<ComponentProps<typeof Link>, "onNavigate"> & { albumId: string; photoIndex: number }) {
  const { remember } = useAlbumNavigation();
  return <Link {...props} transitionTypes={["album-open"]} onNavigate={() => remember(albumId, photoIndex)}>{children}</Link>;
}
