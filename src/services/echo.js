import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getActiveBranchId } from "../utils/activeBranch";

window.Pusher = Pusher;

class EchoService {
  instance = null;
  token = null;
  branchId = null;

  getInstance() {
    const token = localStorage.getItem("token");
    const branchId = getActiveBranchId();

    if (!token) return null;

    // إذا كان هناك instance موجود والتوكن والفرع لم يتغيرا، أرجع الموجود
    if (this.instance && this.token === token && this.branchId === branchId) {
      return this.instance;
    }

    // إذا تغير التوكن أو الفرع، افصل القديم
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
    }

    this.token = token;
    this.branchId = branchId;

    this.instance = new Echo({
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
          "X-Branch-Id": branchId,
        },
      },
    });

    console.log("✅ Echo initialized", { branchId });
    return this.instance;
  }

  disconnect() {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
      this.token = null;
      this.branchId = null;
      console.log("❌ Echo disconnected");
    }
  }
}

const echoService = new EchoService();
export default echoService;
