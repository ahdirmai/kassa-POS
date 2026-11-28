import http from "node:http";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { setSocketServer } from "./lib/socket.js";
import { getLiveUserAuth } from "./lib/rbac-cache.js";
import { closePinLockoutRedis } from "./lib/pin-lockout.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const authToken =
      typeof socket.handshake.auth?.token === "string"
        ? socket.handshake.auth.token
        : typeof socket.handshake.headers.authorization === "string" &&
            socket.handshake.headers.authorization.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.slice(7)
          : null;
    if (!authToken) {
      return next(new Error("UNAUTHORIZED"));
    }
    const decoded = jwt.verify(authToken, env.JWT_ACCESS_SECRET) as { id: number };
    const live = await getLiveUserAuth(decoded.id);
    if (!live) {
      return next(new Error("USER_INACTIVE"));
    }
    socket.data.user = live;
    return next();
  } catch {
    return next(new Error("TOKEN_INVALID"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user as { outletId: number } | undefined;
  if (!user) {
    socket.disconnect(true);
    return;
  }
  const outletId = user.outletId;
  const station = socket.handshake.query.station ? String(socket.handshake.query.station) : null;

  socket.join(`orders:outlet:${outletId}`);
  socket.join(`tables:outlet:${outletId}`);
  if (station) {
    socket.join(`kds:outlet:${outletId}:${station}`);
  } else {
    socket.join(`kds:outlet:${outletId}:ALL`);
  }
});

setSocketServer(io);

server.listen(env.API_PORT, () => {
  console.log(`Tumpu POS API berjalan di http://localhost:${env.API_PORT}`);
});

async function shutdown() {
  server.close();
  await closePinLockoutRedis();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
