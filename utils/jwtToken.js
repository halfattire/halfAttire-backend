// Create token and save in cookie
const sendToken = (user, statusCode, res) => {
  // Create JWT token
  const token = user.getJwtToken()

  // Options for cookies - Fixed for development
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  }

  console.log("Setting cookie with options:", options)
  console.log("Token being set:", token ? "Present" : "Missing")

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  })
}

export default sendToken
