import { Route, Routes } from "react-router"
import Lobby from "./screens/Lobby"
import Room from "./screens/Room"

const App = () => {
  return (
    <div className="min-h-screen">
      {/* Routes: দুইটা পেজ - Lobby (হোম) এবং Room (ভিডিও কল) */}
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomNo" element={<Room />} />
      </Routes>
    </div>
  )
}

export default App
