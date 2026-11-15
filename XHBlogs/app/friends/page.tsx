import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { friendsData } from "../../data/friends";
import { siteConfig } from "../../siteConfig";
import "../../components/atelier/extras.css";
import "../../components/atelier/compact-pages.css";

export const metadata = {
  title: "朋友",
  description: "想常去看看的个人网站。",
};

export default function FriendsPage() {
  return (
    <main className="page-wrap extra-page quiet-page quiet-friends">
      <header className="extra-heading">
        <h1>朋友</h1>
        <p>想常去看看的个人网站。</p>
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
          <p>还在慢慢收集。你也有自己的小站的话，可以写信给我。</p>
          <a className="text-link" href={`mailto:${siteConfig.social.email}`}>
            写封邮件 <ArrowUpRight size={17} />
          </a>
        </div>
      )}
      <Link href="/" className="extra-back">
        ← 回到首页
      </Link>
    </main>
  );
}
