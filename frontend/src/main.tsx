/**
 * main.tsx — punto de entrada principal del frontend
 *
 * este archivo inicializa la aplicación de react y la monta en el dom.
 * se encarga de cargar los estilos globales y renderizar el componente raíz app.
 */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

