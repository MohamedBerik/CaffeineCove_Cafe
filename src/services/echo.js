import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getActiveBranchId } from "../utils/activeBranch";

window.Pusher = Pusher;

class EchoService {
  instance = null;
  token = null;

  getInstance() {
    const token = localStorage.getItem("token");

    if (!token) return null;

    if (this.instance && this.token === token) {
      return this.instance;
    }

    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
    }

    this.token = token;

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
        },
      },
    });
    window.Echo = this.instance;

    console.log("✅ Echo initialized");

    return this.instance;
  }

  disconnect() {
    if (this.instance) {
      this.instance.disconnect();
    }

    this.instance = null;
    this.token = null;
  }
}

const echoService = new EchoService();

const echo = echoService.getInstance();

if (echo) {
  echo.channel("security-feed").listen(".security.updated", (e) => {
    console.log("🚨 SECURITY EVENT", e);
  });
}

export default echoService;
