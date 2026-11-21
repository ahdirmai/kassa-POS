import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth-store";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

let socket: Socket | null = null;
let lastToken: string | null = null;
let lastStation: string | undefined;

export function getSocket(station?: string): Socket {
  const token = useAuthStore.getState().accessToken;
  if (socket && (lastToken !== token || lastStation !== station)) {
    socket.disconnect();
    socket = null;
  }
  if (!socket) {
    lastToken = token;
    lastStation = station;
    socket = io(SOCKET_URL, {
      auth: { token: token ?? "" },
      query: { ...(station ? { station } : {}) },
      autoConnect: Boolean(token),
      reconnectionAttempts: 10,
    });
  }
  return socket;
}
