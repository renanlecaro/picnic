let roomsActivity = {};
let ipActivities = {};

// 100 actions per IP/room per minute max
const limit = 100;
setInterval(() => {
  roomsActivity = {};
  ipActivities = {};
}, 60 * 1000);

function shouldRateLimit(ip, roomId) {
  if (ip) {
    ipActivities[ip] = (ipActivities[ip] || 0) + 1;
    if (ipActivities[ip] > limit) {
      return true;
    }
  }
  if (roomId) {
    roomsActivity[roomId] = (roomsActivity[roomId] || 0) + 1;
    if (roomsActivity[roomId] > limit) {
      return true;
    }
  }

  return false;
}

module.exports = {
  shouldRateLimit,
};
