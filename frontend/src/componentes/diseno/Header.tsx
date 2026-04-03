import type { ReactNode } from "react";
import logo from "@/assets/FSDblanco.png";
import styles from "./Header.module.css";

interface HeaderProps {
  /** Elementos de navegación (enlaces, botones) */
  navegacion?: ReactNode;
  /** Elementos adicionales a la derecha del header (botones, menú, etc.) */
  acciones?: ReactNode;
}

const Header = ({ navegacion, acciones }: HeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <img
          src={logo}
          alt="Fundación Mario Santo Domingo"
          className={styles.logo}
        />
      </div>
      {navegacion && <nav className={styles.navegacion}>{navegacion}</nav>}
      <div className={styles.spacer} />
      {acciones && <div className={styles.acciones}>{acciones}</div>}
    </header>
  );
};

export default Header;
