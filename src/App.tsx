import { useState } from "react";

import styles from "./App.module.css";
import { BatchEditor } from "./components/batch/BatchEditor/BatchEditor";
import { TokenEditor } from "./components/editor/TokenEditor/TokenEditor";
import { Button } from "./components/primitives/Button/Button";

type View = "single" | "batch";

export const App = () => {
  const [view, setView] = useState<View>("batch");

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Guild Ball Parametric Tokens</h1>

        <nav className={styles.nav}>
          <Button
            label="Single token"
            variant={view === "single" ? "primary" : "secondary"}
            disabled={view === "single"}
            onClick={() => setView("single")}
          />
          <Button
            label="Batch"
            variant={view === "batch" ? "primary" : "secondary"}
            disabled={view === "batch"}
            onClick={() => setView("batch")}
          />
        </nav>
      </header>

      <main className={styles.main}>{view === "single" ? <TokenEditor /> : <BatchEditor />}</main>
    </div>
  );
};
