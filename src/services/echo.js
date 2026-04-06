import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

// ✅ تأكد من وجود الـ keys
console.log("PUSHER KEY:", import.meta.env.VITE_PUSHER_KEY);
console.log("PUSHER CLUSTER:", import.meta.env.VITE_PUSHER_CLUSTER);

const echo = new Echo({
  broadcaster: "pusher",
  key: process.env.REACT_APP_PUSHER_KEY,
  cluster: process.env.REACT_APP_PUSHER_CLUSTER,
  forceTLS: true,
});

// ✅ بعد التهيئة
window.Pusher.logToConsole = true;

export default echo;
