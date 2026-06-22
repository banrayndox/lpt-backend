import jwt from 'jsonwebtoken';
import axios from 'axios';
// ES Modules-এ লোকাল ফাইল ইম্পোর্ট করার সময় শেষে .js দেওয়া বাধ্যতামূলক
import User from '../schemas/UserSchema.js';

// ১. Google OAuth Login / Register (Custom Button / Access Token Friendly)
export const googleLogin = async (req, res) => {
  const { idToken } = req.body; // ফ্রন্টএন্ড থেকে আসা টোকেনটি এখানে রিসিভ হচ্ছে

  try {
    // 🔄 গুগলের অফিশিয়াল ইউজারইনহো এন্ডপয়েন্ট থেকে ডেটা আনা হচ্ছে
    // এটি ফ্রন্টএন্ডের কাস্টম বাটন (useGoogleLogin) থেকে আসা access_token কে নিখুঁতভাবে ভেরিফাই করে
    const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`);
    
    // গুগল রেসপন্স থেকে sub (যা আমাদের googleId), name এবং email বের করা হলো
    const { sub: googleId, name, email } = googleRes.data;

    if (!googleId) {
      return res.status(400).json({ success: false, message: 'Invalid token data from Google' });
    }

    // ডেটাবেজে চেক করা এই ইউজার আগে থেকেই আছে কিনা
    let user = await User.findOne({ googleId });

    if (!user) {
      // ডেটাবেজের প্রথম ইউজার স্বয়ংক্রিয়ভাবে 'Teacher' (Admin) রোল পাবেন
      const isFirstUser = (await User.countDocuments({})) === 0;
      
      user = await User.create({
        googleId,
        name,
        email,
        role: isFirstUser ? 'Teacher' : 'Student'
      });
    }

    // JWT টোকেন জেনারেট করা (৩০ দিন মেয়াদী)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

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
  } catch (error) {
    console.error('Google Server Login Error:', error.response?.data || error.message);
    res.status(400).json({ 
      success: false, 
      message: 'Google login failed', 
      error: error.response?.data?.error_description || error.message 
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