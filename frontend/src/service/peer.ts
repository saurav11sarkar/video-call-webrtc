class PeerService {
  peer: RTCPeerConnection
  private onIceCb?: (candidate: RTCIceCandidateInit) => void
  private onTrackCb?: (stream: MediaStream) => void

  constructor() {
    // WebRTC Peer Connection তৈরি করা হচ্ছে
    // STUN সার্ভার ব্যবহার করে NAT traversal এর জন্য
    this.peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }, // Google STUN সার্ভার
        { urls: "stun:global.stun.twilio.com:3478" }, // Twilio STUN সার্ভার
      ],
    })

    // ICE Candidate পাওয়ার সময় callback চালানো
    this.peer.onicecandidate = (event) => {
      if (event.candidate && this.onIceCb) {
        this.onIceCb(event.candidate.toJSON())
      }
    }

    // Remote stream পাওয়ার সময় callback চালানো
    this.peer.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (remoteStream && this.onTrackCb) {
        this.onTrackCb(remoteStream)
      }
    }

    // Connection state পরিবর্তন হলে লগ করা
    this.peer.onconnectionstatechange = () => {
      console.log("📡 Connection state:", this.peer.connectionState)
    }
  }

  // Local media stream (ক্যামেরা/মাইক) peer connection এ যোগ করা
  addStream(stream: MediaStream) {
    const senders = this.peer.getSenders()
    stream.getTracks().forEach((track) => {
      const existingSender = senders.find((s) => s.track?.kind === track.kind)
      if (!existingSender) {
        this.peer.addTrack(track, stream)
      }
    })
  }

  // Offer তৈরি করা (কল শুরু করার জন্য)
  async getOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peer.createOffer()
    await this.peer.setLocalDescription(offer)
    return offer
  }

  // Answer তৈরি করা (কল গ্রহণ করার জন্য)
  async getAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await this.peer.createAnswer()
    await this.peer.setLocalDescription(answer)
    return answer
  }

  // Remote answer সেট করা
  async setRemoteAnswer(answer: RTCSessionDescriptionInit) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(answer))
  }

  // ICE Candidate যোগ করা
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.warn("Failed to add ICE candidate", err)
    }
  }

  // ICE Candidate callback সেট করা
  onIceCandidate(cb: (candidate: RTCIceCandidateInit) => void) {
    this.onIceCb = cb
  }

  // Track callback সেট করা
  onTrack(cb: (stream: MediaStream) => void) {
    this.onTrackCb = cb
  }

  // Peer connection বন্ধ করা
  dispose() {
    this.peer.close()
  }
}

// Singleton instance তৈরি করা
const peerService = new PeerService()
export default peerService
