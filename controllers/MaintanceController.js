import { User, Section, Lab, Score } from "../schemas/UserSchema.js"; 

// ১. সকল ইউজার দেখার জন্য
export const getAllUsers = async (req, res) => {
  try {
    // সেকশন আইডি পপুলেট করলে অ্যাডমিন সহজেই দেখতে পারবে কে কোন সেকশনে আছে
    const users = await User.find().populate('sectionId', 'name'); 
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. ইউজারের রোল পরিবর্তন করা
export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // 'Student', 'Teacher', 'Maintance'

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.role = role;
    await user.save();

    res.status(200).json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. ইউজার রিমুভ করা (সাথে তার স্কোরগুলোও ডিলিট করতে হবে)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // ১. ইউজারের স্কোরগুলো মুছে ফেলা (Data Integrity বজায় রাখতে)
    await Score.deleteMany({ studentId: userId });

    // ২. ইউজার ডিলিট করা
    await user.deleteOne();
    
    res.status(200).json({ success: true, message: 'User and their scores deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. সিস্টেম রিসেট (সব কালেকশন রিসেট করা)
export const resetAllSystem = async (req, res) => {
  try {
    // ডাটা লস প্রিভেন্ট করতে সব কালেকশন একসাথে ক্লিয়ার করা
    await User.deleteMany({ role: { $ne: 'Maintance' } }); // মেইনটেন্যান্স বা অ্যাডমিন বাদে সব মুছে ফেলবে
    await Section.deleteMany({});
    await Lab.deleteMany({});
    await Score.deleteMany({});

    res.status(200).json({ success: true, message: 'System reset: All Users (except Maintance), Sections, Labs, and Scores have been wiped.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};