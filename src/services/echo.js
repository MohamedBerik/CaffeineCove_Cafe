import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

// ✅ تأكد من وجود الـ keys
console.log(process.env.REACT_APP_PUSHER_KEY);

const echo = new Echo({
  broadcaster: "pusher",
  key: process.env.REACT_APP_PUSHER_KEY,
  cluster: process.env.REACT_APP_PUSHER_CLUSTER,
  forceTLS: true,
});

// ✅ بعد التهيئة
window.Pusher.logToConsole = true;

export default echo;
