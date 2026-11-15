import PhotoWallClient from "./PhotoWallClient";
import "../../components/atelier/secondary.css";

export const metadata = {
  title: "光影与日常",
  description: "Sparink 的旅行、猫咪与生活相册。",
  alternates: { canonical: "/photowall" },
};

export default function PhotoWallPage() {
  return <PhotoWallClient />;
}
