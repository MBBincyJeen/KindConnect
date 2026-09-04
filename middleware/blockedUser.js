const User = require("../models/User");

async function blockedUserGuard(req, res, next) {
  try {
    const targetId = req.params.teacherId || req.params.userId || req.body.targetId;
    if (!targetId) return next();

    const currentUser = await User.findById(req.session.user.id).select("blockedUsers");
    if (currentUser && currentUser.blockedUsers) {
      const isBlocked = currentUser.blockedUsers.some((id) => id.toString() === targetId);
      if (isBlocked) {
        if (req.accepts("html")) {
          return res.status(403).send("This user is blocked");
        }
        return res.status(403).json({ error: "This user is blocked" });
      }
    }

    const targetUser = await User.findById(targetId).select("blockedUsers");
    if (targetUser && targetUser.blockedUsers) {
      const blockedByTarget = targetUser.blockedUsers.some((id) => id.toString() === req.session.user.id);
      if (blockedByTarget) {
        if (req.accepts("html")) {
          return res.status(403).send("You cannot interact with this user");
        }
        return res.status(403).json({ error: "You cannot interact with this user" });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { blockedUserGuard };
