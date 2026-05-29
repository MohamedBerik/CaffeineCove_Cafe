import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getActiveBranchId } from "../utils/activeBranch";

window.Pusher = Pusher;

let echoInstance = null;
let currentToken = null;
let currentBranchId = null;

export function getEcho() {
  const token = localStorage.getItem("token");
  const branchId = getActiveBranchId();

  // إعادة إنشاء Echo إذا تغير التوكن أو الفرع
  if (
    echoInstance &&
    (token !== currentToken || branchId !== currentBranchId)
  ) {
    echoInstance.disconnect();
    echoInstance = null;
    currentToken = null;
    currentBranchId = null;
  }

  if (!echoInstance) {
    currentToken = token;
    currentBranchId = branchId;

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
          "X-Branch-Id": branchId, // ✅ يُمكّن الـ backend من عزل الفروع
        },
      },
    });

    console.log("✅ Echo initialized", { branchId });
  }

  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    currentToken = null;
    currentBranchId = null;
    console.log("❌ Echo disconnected");
  }
}
