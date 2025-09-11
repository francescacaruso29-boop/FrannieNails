import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// monta React su #root
createRoot(document.getElementById("root")!).render(<App />);
