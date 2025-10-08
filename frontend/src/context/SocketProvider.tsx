import type React from "react"

import { createContext, useContext, useMemo } from "react"
import { io, type Socket } from "socket.io-client"

// Socket Context তৈরি করা হয়েছে
const socketContext = createContext<Socket | null>(null)

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  // Socket connection তৈরি করা হচ্ছে (শুধুমাত্র একবার)
  // আপনার ব্যাকএন্ড সার্ভারের URL এখানে দিন
  const socket = useMemo(() => io("http://localhost:8080"), [])

  return <socketContext.Provider value={socket}>{children}</socketContext.Provider>
}

// Custom hook - যেকোনো কম্পোনেন্ট থেকে socket ব্যবহার করার জন্য
export const useSocket = () => {
  const socket = useContext(socketContext)
  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return socket
}

export default SocketProvider
