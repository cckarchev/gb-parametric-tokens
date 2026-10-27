import styles from "./Button.module.css";

type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export const Button = ({
  label,
  onClick,
  variant = "secondary",
  disabled,
}: ButtonProps) => {
  const variantClass =
    variant === "primary" ? styles.primary : styles.secondary;

  return (
    <button
      type="button"
      className={`${styles.base} ${variantClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};
