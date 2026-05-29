import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

let echoInstance = null;
let currentToken = null;

export function getEcho() {
  const token = localStorage.getItem("token");

  // إذا تغير التوكن، اقطع الاتصال القديم وأعد إنشاء instance جديدة
  if (echoInstance && token !== currentToken) {
    echoInstance.disconnect();
    echoInstance = null;
    currentToken = null;
  }

  if (!echoInstance) {
    currentToken = token;

    echoInstance = new Echo({
      broadcaster: "pusher",
      key: "9b85ecf4278b5add7a38",
      cluster: "mt1",
      forceTLS: true,
      authEndpoint:
        "https://caffeinecoveapi-production-a107.up.railway.app/broadcasting/auth",
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    });

    console.log(
      "✅ Echo initialized with token:",
      token?.substring(0, 10) + "...",
    );
  }

  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    currentToken = null;
    console.log("❌ Echo disconnected");
  }
}
