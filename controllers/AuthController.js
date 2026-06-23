import jwt from 'jsonwebtoken';
import axios from 'axios';
// ES Modules-এ লোকাল ফাইল ইম্পোর্ট করার সময় শেষে .js দেওয়া বাধ্যতামূলক
import User from '../schemas/UserSchema.js';

export const googleLogin = async (req, res) => {
  const { idToken } = req.body;
  
  // ১. ইনপুট চেক
  console.log("--- DEBUG START: Google Login ---");
  console.log("Received idToken:", idToken ? "Token present" : "Token missing");

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Token is missing' });
  }

  try {
    // ২. গুগল থেকে ডেটা আনা
    console.log("Fetching user profile from Google...");
    const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`);
    console.log("Google API Response Data:", googleRes.data);
    
    const { sub: googleId, name, email } = googleRes.data;

    if (!googleId) {
      console.error("Error: No googleId found in response");
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }

    // ৩. ডাটাবেসে ইউজার খোঁজা
    console.log("Checking if user exists in MongoDB...");
    let user = await User.findOne({ googleId });

    if (!user) {
      console.log("User not found, preparing to create new user...");
      
      // ৪. প্রথম ইউজার কি না চেক করা
      const userCount = await User.countDocuments({});
      const isFirstUser = userCount === 0;
      console.log("Current user count in DB:", userCount, "| Is First User:", isFirstUser);

      // ৫. ইউজার তৈরি করা
      try {
        user = await User.create({
          googleId,
          name,
          email,
          role: isFirstUser ? 'Maintance' : 'Student'
        });
        console.log("User created successfully in DB:", user._id);
      } catch (dbError) {
        console.error("DB Create Error (Check Schema constraints):", dbError.message);
        throw dbError; // এটি ক্যাচ ব্লকে পাঠাবে
      }
    } else {
      console.log("Existing user found:", user._id, "Role:", user.role);
    }

    // ৬. JWT টোকেন জেনারেট করা
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );
    console.log("JWT token generated.");

    // ৭. রেসপন্স পাঠানো
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        scores: user.scores
      }
    });
    console.log("--- DEBUG END: Success ---");

  } catch (error) {
    // ডিবাগিং এরর হ্যান্ডলিং
    console.error("--- DEBUG ERROR BLOCK ---");
    console.error("Final Error Message:", error.message);
    
    res.status(500).json({ 
      success: false, 
      message: 'Google login failed', 
      debug: error.message, // ডিবাগিংয়ের সুবিধার্থে এরর পাঠানো হচ্ছে
      error: error.response?.data || 'Internal Server Error' 
    });
  }
};

// ২. Get Current User Profile Data
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};