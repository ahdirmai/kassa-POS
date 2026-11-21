import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { setSocketServer } from "./lib/socket.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const outletId = Number(socket.handshake.query.outletId ?? 1);
  const station = socket.handshake.query.station ? String(socket.handshake.query.station) : null;

  socket.join(`orders:outlet:${outletId}`);
  socket.join(`tables:outlet:${outletId}`);
  if (station) {
    socket.join(`kds:${station}`);
  } else {
    socket.join("kds:ALL");
  }
});

setSocketServer(io);

server.listen(env.API_PORT, () => {
  console.log(`Kassa POS API berjalan di http://localhost:${env.API_PORT}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
