import type { Metadata } from "next";
import provenance from "../../../third_party/stockfish/19.0.1/provenance.json";
import components from "../../../third_party/runtime-components.json";

export const metadata: Metadata = { title: "Open source licenses | Marcus" };
const directComponents = new Set([
  "next",
  "react",
  "react-dom",
  "chess.js",
  "react-chessboard",
]);

export default function OpenSourcePage() {
  return (
    <main id="main" className="shell license-page">
      <header>
        <p className="eyebrow">Acknowledgments</p>
        <h1>Open source licenses</h1>
        <p>Marcus uses the work of open source authors and contributors.</p>
      </header>
      <section aria-labelledby="engine-license-title">
        <h2 id="engine-license-title">Stockfish.js {provenance.version}</h2>
        <p>
          The lite, single-threaded chess engine runs on your device as a Web
          Worker. Stockfish.js is by Nathan Rugg, Chess.com and contributors,
          based on Stockfish by T. Romstad, M. Costalba, J. Kiiski, G. Linscott
          and the Stockfish developers. The embedded lite network is by Chris
          Bao (sscg13).
        </p>
        <p>
          The engine is free software under the GNU General Public License,
          version 3. Its source files retain their individual notices, including
          permissions for later GPL versions where stated. It is provided
          without warranty. Your applicable rights to use, study, modify and
          redistribute it are preserved.
        </p>
        <ul>
          <li>
            <a href="/engine/COPYING.txt">Read the engine’s GPL license</a>
          </li>
          <li>
            <a href="/engine/AUTHORS.txt">Authors and contributors</a>
          </li>
          <li>
            <a href="/engine/NOTICE.txt">
              Engine version and attribution notice
            </a>
          </li>
          <li>
            <a href={provenance.sourceArchive.publicPath} download>
              Download the exact corresponding source
            </a>
          </li>
          <li>
            <a href="/engine/SOURCE.txt">
              Source acquisition and build instructions
            </a>
          </li>
          <li>
            <a href="/engine/manifest.json">Version and checksum manifest</a>
          </li>
        </ul>
        <p>
          The source download includes the exact upstream source, neural
          network, build scripts, locked build dependencies and license notices,
          at no additional charge. The JavaScript and WASM are unmodified
          upstream release files. Both were reproduced byte-for-byte from these
          inputs.
        </p>
        <p>
          Source archive SHA-256: <code>{provenance.sourceArchive.sha256}</code>
        </p>
      </section>
      <section aria-labelledby="component-license-title">
        <h2 id="component-license-title">Other components</h2>
        <ul>
          {components.packages
            .filter((pkg) => directComponents.has(pkg.name))
            .map((pkg) => (
              <li key={pkg.name}>
                <strong>{pkg.name}</strong> {pkg.version} — {pkg.license}
              </li>
            ))}
        </ul>
        <p>
          <a href="/licenses/OPEN_SOURCE_LICENSES.txt">
            Read component licenses and copyright notices
          </a>
          , including transitive and bundled software and Emscripten runtime
          notices. A{" "}
          <a href="/licenses/components.json">machine-readable inventory</a> is
          also available.
        </p>
        <p>
          These notices apply to their named components. They do not select a
          license for the Marcus application.
        </p>
      </section>
    </main>
  );
}
