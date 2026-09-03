import styles from "./Button.module.css";

export type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export const Button = ({ label, onClick, variant = "secondary", disabled }: ButtonProps) => {
  return (
    <button
      type="button"
      className={variant === "primary" ? styles.primary : styles.secondary}
      onClick={onClick}
      disabled={disabled}>
      {label}
    </button>
  );
};
