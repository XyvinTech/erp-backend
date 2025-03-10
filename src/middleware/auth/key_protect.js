const response_handler = require("../../helpers/response_handler");

const key_protect = async (req, res, next) => {
  try {
    //? Check for API key
    const apiKey = req.headers["api-key"];
    if (!apiKey) {
      return response_handler(res, 401, "No API key provided.");
    }
    if (apiKey !== process.env.API_KEY) {
      return response_handler(res, 401, "Invalid API key.");
    }
    next();
  } catch (error) {
    return response_handler(
      res,
      500,
      `Failed to match API key. ${error.message}`
    );
  }
};

module.exports = key_protect;
