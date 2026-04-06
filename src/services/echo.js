// services/echo.js

import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "pusher",
  key: "your-key",
  cluster: "mt1",
  forceTLS: true,
});

export default echo;
