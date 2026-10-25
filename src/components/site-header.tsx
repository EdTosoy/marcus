import Link from "next/link";
import { Icon } from "./icon";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="wordmark" aria-label="Quiet Chess home">
          <Icon name="rook" size={25} />
          Quiet Chess
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/">The lesson</Link>
          <Link href="/learn">Learning practice</Link>
          <Link href="/board">Practice board</Link>
        </nav>
        <span className="header-note">A little more understanding.</span>
      </div>
    </header>
  );
}
