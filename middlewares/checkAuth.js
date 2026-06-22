import jwt from 'jsonwebtoken';
// ES Modules-এ লোকাল ফাইল ইম্পোর্ট করার সময় শেষে .js দেওয়া বাধ্যতামূলক
import User from '../schemas/UserSchema.js';

// ১. প্রটেক্ট মিডলওয়্যার (Token Verification)
export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid' });
  }
};

// ২. রোল অথরাইজেশন মিডলওয়্যার (Role Check)
export const authorizeTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'Teacher') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Teacher role required' });
  }
};