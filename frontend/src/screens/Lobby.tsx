"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import { useSocket } from "../context/SocketProvider"
import { useNavigate } from "react-router"
import { Video, Mail, Hash, ArrowRight, Users } from "lucide-react"

const Lobby = () => {
  // State management - ইমেইল এবং রুম নম্বর সংরক্ষণের জন্য
  const [email, setEmail] = useState("")
  const [roomNo, setRoomNo] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const socket = useSocket()
  const navigate = useNavigate()

  // ফর্ম সাবমিট হ্যান্ডলার - রুমে জয়েন করার জন্য
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // ভ্যালিডেশন চেক
    if (!email || !roomNo) {
      alert("অনুগ্রহ করে সব ফিল্ড পূরণ করুন!")
      return
    }

    setIsLoading(true)
    // সার্ভারে room:join ইভেন্ট পাঠানো
    socket.emit("room:join", { email, roomNo })
  }

  // রুমে জয়েন হওয়ার পর রুম পেজে রিডাইরেক্ট করা
  const handleJoinRoom = useCallback(
    (data: { email: string; roomNo: string }) => {
      console.log(`✅ ${data.email} joined room ${data.roomNo}`)
      navigate(`/room/${data.roomNo}`)
    },
    [navigate],
  )

  // Socket event listener সেটআপ করা
  useEffect(() => {
    socket.on("room:join", handleJoinRoom)

    // Cleanup function - component unmount হলে listener সরানো
    return () => {
      socket.off("room:join", handleJoinRoom)
    }
  }, [socket, handleJoinRoom])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      {/* Background decoration - ডিজাইনের জন্য */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main card container */}
      <div className="relative w-full max-w-md">
        {/* Header section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4">
            <Video className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">ভিডিও কল</h1>
          <p className="text-white/80 text-lg">রুমে জয়েন করুন এবং কল শুরু করুন</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ইমেইল অ্যাড্রেস</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="আপনার ইমেইল লিখুন"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-gray-800 placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Room number input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">রুম নম্বর</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="রুম নম্বর লিখুন"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-gray-800 placeholder:text-gray-400"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>জয়েন হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  <span>রুমে জয়েন করুন</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Info section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">একই রুম নম্বর দিয়ে অন্যরাও জয়েন করতে পারবে</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">সুরক্ষিত এবং এনক্রিপ্টেড ভিডিও কল</p>
        </div>
      </div>
    </div>
  )
}

export default Lobby
