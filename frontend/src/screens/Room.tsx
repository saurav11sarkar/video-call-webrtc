
import { useCallback, useEffect, useRef, useState } from "react"
import { useSocket } from "../context/SocketProvider"
import peerService from "../service/peer"
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, Maximize, MoreVertical } from "lucide-react"
import { useParams, useNavigate } from "react-router"

const Room = () => {
  // State management - সব স্টেট এক জায়গায়
  const [remoteSocketId, setRemoteSocketId] = useState("")
  const [myStream, setMyStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isInCall, setIsInCall] = useState(false)
  const [callStatus, setCallStatus] = useState("অপেক্ষা করা হচ্ছে...")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [incomingCall, setIncomingCall] = useState<{ from: string; offer: RTCSessionDescriptionInit } | null>(null)
  const [callerEmail, setCallerEmail] = useState("")

  const socket = useSocket()
  const navigate = useNavigate()
  const { roomNo } = useParams()

  // Video element references
  const myVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // নতুন ইউজার রুমে জয়েন করলে
  const handleUserJoin = useCallback(({ email, id }: { email: string; id: string }) => {
    console.log(`User joined: ${email}`)
    setRemoteSocketId(id)
    setCallStatus(`${email} রুমে জয়েন করেছে`)
  }, [])

  // ক্যামেরা এবং মাইক্রোফোন অ্যাক্সেস নেওয়া
  const getMediaStream = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user", // মোবাইলে ফ্রন্ট ক্যামেরা
        },
        audio: {
          echoCancellation: true, // ইকো বাতিল করা
          noiseSuppression: true, // শব্দ কমানো
          autoGainControl: true, // অটো ভলিউম কন্ট্রোল
        },
      })
      return stream
    } catch (err: any) {
      console.error("Media error:", err)
      alert("ক্যামেরা/মাইক্রোফোন অ্যাক্সেস করা যাচ্ছে না। অনুমতি দিন।")
      return null
    }
  }

  // অন্য ইউজারকে কল করা
  const handleCallUser = useCallback(async () => {
    if (!remoteSocketId) {
      alert("কোনো ইউজার পাওয়া যায়নি")
      return
    }

    setCallStatus("কল করা হচ্ছে...")
    const stream = await getMediaStream()
    if (!stream) return

    // Local stream সেটআপ করা
    peerService.addStream(stream)
    setMyStream(stream)
    if (myVideoRef.current) myVideoRef.current.srcObject = stream

    // ICE candidate হ্যান্ডলার
    peerService.onIceCandidate((candidate) => {
      socket.emit("ice-candidate", { to: remoteSocketId, candidate })
    })

    // Remote track পাওয়ার হ্যান্ডলার
    peerService.onTrack((rStream) => {
      setRemoteStream(rStream)
      setIsInCall(true)
      setCallStatus("কানেক্টেড")
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream
    })

    // Offer তৈরি করে পাঠানো
    const offer = await peerService.getOffer()
    socket.emit("call:user", { to: remoteSocketId, offer })
  }, [remoteSocketId, socket])

  const handleIncomingCall = useCallback(
    async (data: { from: string; offer: RTCSessionDescriptionInit; callerEmail?: string }) => {
      const { from, offer, callerEmail } = data
      setRemoteSocketId(from)
      setCallerEmail(callerEmail || "Unknown User")
      setIncomingCall({ from, offer })
      setCallStatus("ইনকামিং কল...")
    },
    [],
  )

  const acceptCall = async () => {
    if (!incomingCall) return

    const { from, offer } = incomingCall
    setCallStatus("কল গ্রহণ করা হচ্ছে...")

    const stream = await getMediaStream()
    if (!stream) return

    setMyStream(stream)
    if (myVideoRef.current) myVideoRef.current.srcObject = stream

    peerService.addStream(stream)

    peerService.onIceCandidate((candidate) => {
      socket.emit("ice-candidate", { to: from, candidate })
    })

    peerService.onTrack((rStream) => {
      setRemoteStream(rStream)
      setIsInCall(true)
      setCallStatus("কানেক্টেড")
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream
    })

    const answer = await peerService.getAnswer(offer)
    socket.emit("call:answered", { to: from, answer })
    setIncomingCall(null)
  }

  const rejectCall = () => {
    setIncomingCall(null)
    setCallStatus("কল প্রত্যাখ্যান করা হয়েছে")
    setTimeout(() => {
      navigate("/")
    }, 2000)
  }

  // কল answer হ্যান্ডল করা
  const handleAnswerCall = useCallback(async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
    try {
      await peerService.setRemoteAnswer(data.answer)
      setIsInCall(true)
      setCallStatus("কানেক্টেড")
    } catch (err) {
      console.error("Answer error:", err)
    }
  }, [])

  // Remote ICE candidate হ্যান্ডল করা
  const handleRemoteIce = useCallback((data: { from: string; candidate: RTCIceCandidateInit }) => {
    peerService.addIceCandidate(data.candidate)
  }, [])

  // ভিডিও চালু/বন্ধ করা
  const toggleVideo = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  // অডিও চালু/বন্ধ করা
  const toggleAudio = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  // ফুলস্ক্রিন টগল করা
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // কল শেষ করা
  const endCall = () => {
    // সব media tracks বন্ধ করা
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop())
      setMyStream(null)
    }
    if (remoteStream) {
      setRemoteStream(null)
    }
    setIsInCall(false)
    setCallStatus("কল শেষ হয়েছে")
    peerService.dispose()

    // লবিতে ফিরে যাওয়া
    setTimeout(() => {
      navigate("/")
    }, 2000)
  }

  // Socket event listeners সেটআপ
  useEffect(() => {
    socket.on("user:joined", handleUserJoin)
    socket.on("incoming:call", handleIncomingCall)
    socket.on("call:answered", handleAnswerCall)
    socket.on("ice-candidate", handleRemoteIce)

    return () => {
      socket.off("user:joined", handleUserJoin)
      socket.off("incoming:call", handleIncomingCall)
      socket.off("call:answered", handleAnswerCall)
      socket.off("ice-candidate", handleRemoteIce)
    }
  }, [socket, handleUserJoin, handleIncomingCall, handleAnswerCall, handleRemoteIce])

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden"
    >
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              {/* Animated phone icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6 animate-pulse">
                <Phone className="w-10 h-10 text-white animate-bounce" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-2">ইনকামিং কল</h2>
              <p className="text-white/80 text-lg mb-8">{callerEmail} আপনাকে কল করছে</p>

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  onClick={rejectCall}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                >
                  <PhoneOff className="w-5 h-5" />
                  প্রত্যাখ্যান
                </button>
                <button
                  onClick={acceptCall}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Phone className="w-5 h-5" />
                  গ্রহণ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - শুধু ডেস্কটপে দেখাবে */}
      <div className="hidden md:block absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">রুম #{roomNo}</h1>
            <div className="flex items-center gap-2 text-emerald-300">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm">{callStatus}</span>
              {isInCall && (
                <span className="ml-4 flex items-center gap-1">
                  {isAudioEnabled ? (
                    <>
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs">মাইক চালু</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4 text-red-400" />
                      <span className="text-xs">মাইক বন্ধ</span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
          {remoteSocketId && !isInCall && !incomingCall && (
            <button
              onClick={handleCallUser}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <Phone className="w-5 h-5" />
              কল শুরু করুন
            </button>
          )}
        </div>
      </div>

      {/* Video container - মোবাইল এবং ডেস্কটপ উভয়ের জন্য */}
      <div className="h-screen flex flex-col md:grid md:grid-cols-2 md:gap-4 md:p-4">
        {/* Remote video - মোবাইলে বড়, ডেস্কটপে সমান */}
        <div className="relative flex-1 md:flex-none bg-slate-900 md:rounded-2xl overflow-hidden">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-center">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-lg">
                  {remoteSocketId ? "রিমোট ভিডিওর জন্য অপেক্ষা করা হচ্ছে..." : "কোনো ইউজার নেই"}
                </p>
              </div>
            </div>
          )}
          {remoteStream && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-white font-semibold text-sm">রিমোট ইউজার</p>
            </div>
          )}

          {/* Mobile header - শুধু মোবাইলে দেখাবে */}
          <div className="md:hidden absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold">রুম #{roomNo}</h2>
                <div className="flex items-center gap-2 text-emerald-300 text-xs">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>{callStatus}</span>
                  {isInCall && (
                    <>
                      {isAudioEnabled ? (
                        <Mic className="w-3 h-3 text-emerald-400 ml-2" />
                      ) : (
                        <MicOff className="w-3 h-3 text-red-400 ml-2" />
                      )}
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-white/10 backdrop-blur-sm rounded-lg"
              >
                <MoreVertical className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Local video - মোবাইলে ছোট floating, ডেস্কটপে সমান */}
        <div className="absolute bottom-24 right-4 w-32 h-40 md:relative md:w-auto md:h-auto md:bottom-auto md:right-auto bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
          <video ref={myVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
          {!myStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <VideoOff className="w-8 h-8 md:w-16 md:h-16 text-slate-600" />
            </div>
          )}
          {!isVideoEnabled && myStream && (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 md:w-16 md:h-16 text-white" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs">
            <p className="text-white font-semibold">আপনি</p>
          </div>
          {myStream && (
            <div className="absolute top-2 right-2">
              {isAudioEnabled ? (
                <div className="p-1.5 bg-emerald-500 rounded-full">
                  <Mic className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="p-1.5 bg-red-500 rounded-full">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls - নিচে fixed */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Call button - যদি কল শুরু না হয় */}
          {remoteSocketId && !isInCall && !incomingCall && (
            <div className="mb-4 md:hidden">
              <button
                onClick={handleCallUser}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                কল শুরু করুন
              </button>
            </div>
          )}

          {/* Control buttons */}
          {isInCall && (
            <div className="flex items-center justify-center gap-3 md:gap-4">
              {/* Video toggle */}
              <button
                onClick={toggleVideo}
                className={`p-4 md:p-5 rounded-full transition-all transform active:scale-95 shadow-lg ${
                  isVideoEnabled ? "bg-slate-700/80 hover:bg-slate-600" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isVideoEnabled ? (
                  <Video className="w-5 h-5 md:w-6 md:h-6 text-white" />
                ) : (
                  <VideoOff className="w-5 h-5 md:w-6 md:h-6 text-white" />
                )}
              </button>

              {/* Audio toggle */}
              <button
                onClick={toggleAudio}
                className={`p-4 md:p-5 rounded-full transition-all transform active:scale-95 shadow-lg ${
                  isAudioEnabled ? "bg-slate-700/80 hover:bg-slate-600" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-5 h-5 md:w-6 md:h-6 text-white" />
                ) : (
                  <MicOff className="w-5 h-5 md:w-6 md:h-6 text-white" />
                )}
              </button>

              {/* End call */}
              <button
                onClick={endCall}
                className="p-4 md:p-5 rounded-full bg-red-600 hover:bg-red-700 transition-all transform active:scale-95 shadow-lg"
              >
                <PhoneOff className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>

              {/* Fullscreen - শুধু ডেস্কটপে */}
              <button
                onClick={toggleFullscreen}
                className="hidden md:block p-5 rounded-full bg-slate-700/80 hover:bg-slate-600 transition-all transform active:scale-95 shadow-lg"
              >
                <Maximize className="w-6 h-6 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Room
