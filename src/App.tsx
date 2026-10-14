import { MouseEvent } from "react";

import { navigateTo } from "@/browser/navigateTo";
import { TokenEditor } from "@/components/token-editor/TokenEditor";

import styles from "./App.module.css";

const HOME_PATHNAME = "/";

export const App = () => {
  // A real link (so it can be opened in a new tab), but a plain click stays client-side: a full
  // page load would drop every guild's selection, which lives only in memory.
  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigateTo(HOME_PATHNAME);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <a href={HOME_PATHNAME} className={styles.homeLink} onClick={goHome}>
            <span className={styles.logo} aria-hidden="true" />
            Guild Ball Parametric Tokens
          </a>
        </h1>
      </header>

      <main className={styles.main}>
        <TokenEditor />
      </main>
    </div>
  );
};
