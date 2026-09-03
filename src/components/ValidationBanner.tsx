import { MinStrokeWidthValidation } from "../core/token/validation/validateMinStrokeWidth";
import styles from "./ValidationBanner.module.css";

export type ValidationBannerProps = {
  isValidating: boolean;
  validation: MinStrokeWidthValidation | undefined;
  warnings: string[];
};

export const ValidationBanner = ({ isValidating, validation, warnings }: ValidationBannerProps) => {
  const statusClassName = validation?.valid === false ? styles.error : styles.ok;

  return (
    <section className={styles.banner}>
      {isValidating && <p className={styles.status}>Checking printability...</p>}

      {!isValidating && validation && (
        <p className={`${styles.status} ${statusClassName}`}>
          Printability: {validation.valid ? "OK" : "FAILED"} ({validation.vanishedFeatureCount} of{" "}
          {validation.featureCount} features vanished)
        </p>
      )}

      {warnings.length > 0 && (
        <ul className={styles.warnings}>
          {warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      )}
    </section>
  );
};
