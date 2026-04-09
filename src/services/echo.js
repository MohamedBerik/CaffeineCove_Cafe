import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "pusher",
  key: "9b85ecf4278b5add7a38",
  cluster: "mt1",
  forceTLS: true,

  authEndpoint:
    "https://caffeinecoveapi-production-a107.up.railway.app/broadcasting/auth",

  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      Accept: "application/json",
    },
  },
});

export default echo;
