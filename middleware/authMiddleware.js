const { getSupabaseClient } = require("../config/supabase");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const supabase = getSupabaseClient(authHeader);
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const role = authUser.user_metadata?.role;

    req.user = {
      id: authUser.id,
      role: role,
      profile: authUser,
    };

    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res
      .status(500)
      .json({ error: "Internal server error during authentication" });
  }
};

module.exports = authenticate;
