import contentSettings from "./data/content-settings.json";
import musicLibrary from "./data/music.json";

/** Identity and the sections maintained through Sparink Studio. */
export const siteConfig = {
  title: "Sparink · 日记与相册",
  siteUrl: "https://sparink.net",
  authorName: "Sparink",
  bio: "在这里写日记、放照片，留住一些普通的日子。",
  avatarUrl: "/avatar.webp",
  social: {
    github: "https://github.com/SparkHello",
    email: "sparinkme@gmail.com",
  },
  features: {
    ...contentSettings,
    friends: false,
    lab: true,
  },
  cloudMusicIds: musicLibrary.map(({ id }) => id),
};
