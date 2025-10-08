import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { BrowserRouter } from "react-router"
import SocketProvider from "./context/SocketProvider.tsx"

// React অ্যাপ্লিকেশন রেন্ডার করা হচ্ছে
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <StrictMode>
      {/* Socket.io connection সব কম্পোনেন্টে শেয়ার করার জন্য Provider */}
      <SocketProvider>
        <App />
      </SocketProvider>
    </StrictMode>
  </BrowserRouter>,
)
