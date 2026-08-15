import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import qrcode from "qrcode-terminal";

let sock;

export function getSocket() {
  return sock;
}

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(
    process.env.AUTH_DIR || "./auth_info"
  );

  sock = makeWASocket({
    auth: state,
    browser: Browsers.ubuntu("Meu Assistente"),
    logger: pino({ level: "silent" }),
    markOnlineOnConnect: false,
    syncFullHistory: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\n=== ESCANEIE ESTE QR CODE NO WHATSAPP ===\n");
      qrcode.generate(qr, { small: true });
      console.log("\nWhatsApp > Configurações > Aparelhos conectados > Conectar aparelho\n");
    }

    if (connection === "open") {
      console.log("WhatsApp conectado.");
    }

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log("WhatsApp desconectado.", { statusCode, shouldReconnect });

      if (shouldReconnect) {
        setTimeout(startWhatsApp, 5000);
      } else {
        console.log("Sessão encerrada. Apague a pasta auth_info e conecte novamente.");
      }
    }
  });

  return sock;
}
