import User from "../schemas/UserSchema.js";

// ১. সকল ইউজার দেখার জন্য (অ্যাডমিন ভিউ)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // পাসওয়ার্ড বাদে সব ডেটা
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. ইউজারের রোল পরিবর্তন করা (Student <-> Teacher)
export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // নতুন রোল: 'Student' অথবা 'Teacher'

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

// ৩. ইউজার রিমুভ বা ডিলিট করা
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetAllSystem = async (req, res) => {
  try {
    // ১. সব ইউজার ডিলিট করা (সতর্কতা: এটি সব ডাটা মুছে ফেলবে)
    await User.deleteMany({});
    
    // অথবা আপনি যদি শুধু স্টুডেন্ট মুছতে চান:
    // await User.deleteMany({ role: 'Student' });

    res.status(200).json({ success: true, message: 'System reset: All data has been wiped.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};