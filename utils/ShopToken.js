// create token and saving that in cookies
const sendShopToken = (user, statusCode, res) => {
    const token = user.getJwtToken();
  
    // Options for cookies - Fixed for better compatibility
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    };
  
    console.log("Setting seller cookie with options:", options);
  
    res.status(statusCode).cookie("seller_token", token, options).json({
      success: true,
      user,
      token,
    });
};
  
  export default sendShopToken;



  