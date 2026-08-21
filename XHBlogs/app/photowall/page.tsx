import { siteConfig } from "../../siteConfig";
import PhotoWallClient from "./PhotoWallClient";

export const metadata = {
  title: "照片墙",
};

export default function PhotoWallPage() {
  return <PhotoWallClient />;
}
