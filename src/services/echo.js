import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;
window.Pusher.logToConsole = true;

class EchoService {
  instance = null;
  token = null;

  getInstance() {
    const token = localStorage.getItem("token");

    console.log("🔑 Echo token exists:", !!token);

    if (!token) {
      console.warn("⚠️ No token found. Echo not initialized.");
      return null;
    }

    // إعادة استخدام نفس الـ instance
    if (this.instance && this.token === token) {
      console.log("♻️ Reusing existing Echo instance");
      return this.instance;
    }

    // تنظيف أي instance قديمة
    if (this.instance) {
      console.log("🧹 Destroying previous Echo instance");
      this.instance.disconnect();
      this.instance = null;
    }

    this.token = token;

    console.log("🚀 Initializing Echo...");

    this.instance = new Echo({
      broadcaster: "pusher",
      key: "9b85ecf4278b5add7a38",
      cluster: "mt1",
      forceTLS: true,
      enabledTransports: ["ws", "wss"],

      authEndpoint:
        "https://caffeinecoveapi-production-a107.up.railway.app/broadcasting/auth",

      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    });

    console.log("✅ Echo initialized", this.instance);

    const pusher = this.instance?.connector?.pusher;

    if (pusher) {
      console.log("✅ Pusher instance created");

      pusher.connection.bind("state_change", (states) => {
        console.log("📡 Pusher state:", states);
      });

      pusher.connection.bind("connected", () => {
        console.log("🟢 Pusher connected");
      });

      pusher.connection.bind("disconnected", () => {
        console.log("🔴 Pusher disconnected");
      });

      pusher.connection.bind("error", (err) => {
        console.error("❌ Pusher error:", err);
      });
    } else {
      console.error("❌ Pusher connector not found");
    }

    return this.instance;
  }

  disconnect() {
    if (this.instance) {
      console.log("🧹 Disconnecting Echo");
      this.instance.disconnect();
    }

    this.instance = null;
    this.token = null;
  }
}

const echoService = new EchoService();

export default echoService;
