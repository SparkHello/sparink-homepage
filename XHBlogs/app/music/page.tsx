import MusicClient from "./MusicClient";
import "../../components/atelier/compact-pages.css";

export const metadata = {
  title: "听听歌",
  description: "一些喜欢听的歌。",
};

export default function MusicPage() {
  return <MusicClient />;
}
