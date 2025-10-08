// Socket.io সার্ভার - রিয়েল-টাইম কমিউনিকেশনের জন্য
import { Server } from "socket.io"
import type { Server as HTTPServer } from "http"

// ইউজার ম্যাপিং টাইপ
interface UserData {
  email: string
  roomNo: string
  socketId: string
}

const socketServer = (server: HTTPServer) => {
  // Socket.io সার্ভার তৈরি করা হচ্ছে
  const io = new Server(server, {
    cors: {
      origin: "*", // সব অরিজিন থেকে কানেক্শন অনুমতি
      methods: ["GET", "POST"],
      credentials: true,
    },
    // পিং টাইমআউট এবং ইন্টারভাল সেট করা
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // ইউজার ম্যাপিং - ইমেইল থেকে সকেট আইডি
  const emailToSocketMap = new Map<string, string>()
  // সকেট আইডি থেকে ইউজার ডাটা
  const socketToUserMap = new Map<string, UserData>()
  // রুম থেকে ইউজার লিস্ট
  const roomToUsersMap = new Map<string, Set<string>>()

  // যখন কোনো ইউজার কানেক্ট হয়
  io.on("connection", (socket) => {
    console.log(`🟢 New user connected: ${socket.id}`)

    // রুমে জয়েন করার ইভেন্ট
    socket.on("room:join", (data: { email: string; roomNo: string }) => {
      const { email, roomNo } = data

      console.log(`👤 ${email} joining room: ${roomNo}`)

      // ইউজার ম্যাপিং সেভ করা
      emailToSocketMap.set(email, socket.id)
      socketToUserMap.set(socket.id, { email, roomNo, socketId: socket.id })

      // রুমে ইউজার যোগ করা
      if (!roomToUsersMap.has(roomNo)) {
        roomToUsersMap.set(roomNo, new Set())
      }
      roomToUsersMap.get(roomNo)?.add(socket.id)

      // সকেট রুমে জয়েন করা
      socket.join(roomNo)

      // রুমের অন্যদের জানানো যে নতুন ইউজার এসেছে
      socket.to(roomNo).emit("user:joined", {
        email,
        id: socket.id,
        roomNo,
      })

      // নিজেকে কনফার্মেশন পাঠানো
      io.to(socket.id).emit("room:join", {
        email,
        roomNo,
        success: true,
      })

      console.log(`✅ ${email} successfully joined room: ${roomNo}`)
    })

    // কল করার ইভেন্ট - অফার পাঠানো
    socket.on("call:user", (data: { to: string; offer: RTCSessionDescriptionInit }) => {
      const caller = socketToUserMap.get(socket.id)
      console.log(`📞 Call from ${caller?.email} to ${data.to}`)

      // যাকে কল করা হচ্ছে তাকে অফার পাঠানো
      io.to(data.to).emit("incoming:call", {
        from: socket.id,
        offer: data.offer,
        callerEmail: caller?.email,
      })
    })

    // কল উত্তর দেওয়ার ইভেন্ট - আনসার পাঠানো
    socket.on("call:answered", (data: { to: string; answer: RTCSessionDescriptionInit }) => {
      const answerer = socketToUserMap.get(socket.id)
      console.log(`✅ Call answered by ${answerer?.email}`)

      // যে কল করেছিল তাকে আনসার পাঠানো
      io.to(data.to).emit("call:answered", {
        from: socket.id,
        answer: data.answer,
      })
    })

    // ICE ক্যান্ডিডেট এক্সচেঞ্জ - নেটওয়ার্ক কানেক্শনের জন্য
    socket.on("ice-candidate", (data: { to: string; candidate: RTCIceCandidateInit }) => {
      // অন্য পিয়ারকে ICE ক্যান্ডিডেট পাঠানো
      io.to(data.to).emit("ice-candidate", {
        from: socket.id,
        candidate: data.candidate,
      })
    })

    // পিয়ার নেগোসিয়েশন - কানেক্শন রিনেগোসিয়েট করার জন্য
    socket.on("peer:nego:needed", (data: { to: string; offer: RTCSessionDescriptionInit }) => {
      console.log(`🔄 Peer negotiation needed from ${socket.id}`)

      io.to(data.to).emit("peer:nego:needed", {
        from: socket.id,
        offer: data.offer,
      })
    })

    // পিয়ার নেগোসিয়েশন সম্পন্ন
    socket.on("peer:nego:done", (data: { to: string; answer: RTCSessionDescriptionInit }) => {
      console.log(`✅ Peer negotiation done from ${socket.id}`)

      io.to(data.to).emit("peer:nego:final", {
        from: socket.id,
        answer: data.answer,
      })
    })

    // কল রিজেক্ট করার ইভেন্ট
    socket.on("call:rejected", (data: { to: string }) => {
      const rejector = socketToUserMap.get(socket.id)
      console.log(`❌ Call rejected by ${rejector?.email}`)

      io.to(data.to).emit("call:rejected", {
        from: socket.id,
      })
    })

    // ইউজার ডিসকানেক্ট হলে
    socket.on("disconnect", () => {
      const userData = socketToUserMap.get(socket.id)

      if (userData) {
        console.log(`🔴 User disconnected: ${userData.email}`)

        // ম্যাপ থেকে রিমুভ করা
        emailToSocketMap.delete(userData.email)
        socketToUserMap.delete(socket.id)

        // রুম থেকে রিমুভ করা
        const roomUsers = roomToUsersMap.get(userData.roomNo)
        if (roomUsers) {
          roomUsers.delete(socket.id)
          if (roomUsers.size === 0) {
            roomToUsersMap.delete(userData.roomNo)
          }
        }

        // রুমের অন্যদের জানানো
        socket.to(userData.roomNo).emit("user:left", {
          id: socket.id,
          email: userData.email,
        })
      } else {
        console.log(`🔴 Unknown user disconnected: ${socket.id}`)
      }
    })

    // এরর হ্যান্ডলিং
    socket.on("error", (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error)
    })
  })

  console.log("✅ Socket.io server initialized")
  return io
}

export default socketServer
