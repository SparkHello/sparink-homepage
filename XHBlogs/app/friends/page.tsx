import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { friendsData } from "../../data/friends";
import { siteConfig } from "../../siteConfig";
import "../../components/atelier/extras.css";

export const metadata = {
  title: "朋友与邻居",
  description: "互联网上，值得再去拜访的地方。",
};

export default function FriendsPage() {
  return (
    <section className="page-wrap extra-page">
      <header className="extra-heading">
        <span className="eyebrow">GOOD COMPANY / 朋友与邻居</span>
        <h1>
          互联网，
          <br />
          <em>也有好邻居。</em>
        </h1>
        <p>这里会收藏那些有趣、用心，值得再次拜访的个人网站。</p>
      </header>
      {friendsData.length ? (
        <div className="friend-list">
          {friendsData.map((friend) => (
            <a
              href={friend.url}
              target="_blank"
              rel="noreferrer"
              key={friend.id}
              className="journal-entry"
            >
              <img
                className="friend-avatar"
                src={friend.avatar}
                alt=""
                loading="lazy"
              />
              <div>
                <h2>{friend.name}</h2>
                <p>{friend.description}</p>
              </div>
              <ArrowUpRight aria-hidden="true" />
            </a>
          ))}
        </div>
      ) : (
        <div className="extra-empty">
          <span className="extra-empty-mark" aria-hidden="true">
            ↔
          </span>
          <h2>很高兴，在这里遇见你。</h2>
          <p>
            友链列表还在整理。如果你也有一个认真经营的小站，欢迎来打个招呼。
          </p>
          <a className="text-link" href={`mailto:${siteConfig.social.email}`}>
            写封邮件 <ArrowUpRight size={17} />
          </a>
        </div>
      )}
      <Link href="/" className="extra-back">
        ← 回到首页
      </Link>
    </section>
  );
}
