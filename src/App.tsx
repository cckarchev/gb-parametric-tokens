import styles from "./App.module.css";
import { TokenEditor } from "./components/token/TokenEditor/TokenEditor";

export const App = () => {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Guild Ball Parametric Tokens</h1>
      </header>

      <main className={styles.main}>
        <TokenEditor />
      </main>
    </div>
  );
};
