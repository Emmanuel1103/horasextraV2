import type { ReactNode } from "react";
import styles from "./MainLayout.module.css";

interface MainLayoutProps {
  children: ReactNode;
  /** Sidebar para navegación lateral */
  sidebar?: ReactNode;
}

const MainLayout = ({ children, sidebar }: MainLayoutProps) => {
  return (
    <div className={styles.layout}>
      {sidebar}
      <div className={sidebar ? styles.layoutConSidebar : styles.layoutSinSidebar}>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
