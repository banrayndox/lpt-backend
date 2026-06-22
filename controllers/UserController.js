
import User from "../schemas/UserSchema.js";

export const joinSectionByToken = async (req, res) => {
  const { joinToken } = req.body;

  try {
    // ১. টোকেন দিয়ে টিচার খুঁজুন
    const teacher = await User.findOne({ role: 'Teacher', joinToken: joinToken });
    if (!teacher) {
      return res.status(400).json({ success: false, message: 'Invalid join token' });
    }

    // ২. স্টুডেন্টকে ডাটাবেজ থেকে খুঁজে বের করুন
    const student = await User.findById(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // ৩. স্টুডেন্টের প্রোফাইলে টিচারের আইডি সেট করুন (এটিই সেকশন জয়েন হিসেবে কাজ করবে)
    student.teacherId = teacher._id; 

    // ৪. ল্যাব স্কোর ইনিশিয়ালাইজ করুন
    teacher.labs.forEach(lab => {
      const labId = String(lab.id); 
      if (!student.scores.has(labId)) {
        student.scores.set(labId, 0);
      }
    });

    await student.save();

    res.status(200).json({ success: true, message: 'Successfully joined section' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// UserController.js
export const getDashboardData = async (req, res) => {
  try {
    // ১. লগইন করা স্টুডেন্টকে খুঁজে বের করুন
    const student = await User.findById(req.user.id);
    // ২. টিচারকে খুঁজে বের করুন (ল্যাবের লিস্ট পাওয়ার জন্য)
    const teacher = await User.findOne({ role: 'Teacher' });
    
    const labsList = teacher ? teacher.labs : [];
    const totalPossibleProblems = labsList.reduce((sum, l) => sum + (l.totalProblems || 0), 0);

    // ৩. স্টুডেন্টের ল্যাব হিস্ট্রি ম্যাপ করা (নিজের স্কোর দেখার জন্য)

// ম্যাপের ভেতরে লুপের সময়
const user_labs = labsList.map(lab => {
  const labId = String(lab.id); 
  const score = student.scores.get(labId) || 0; 
  
  return {
    labId: { 
      title: lab.title, 
      date: lab.date,
      totalProblems: lab.totalProblems // এখানে টোটাল প্রবলেম যুক্ত করা হলো
    },
    score: score // স্টুডেন্ট কয়টি সলভ করেছে
  };
});

    // ৪. স্টুডেন্টের মোট সলভড প্রবলেম বের করা
    let totalSolved = 0;
    student.scores.forEach((val) => { totalSolved += val; });

    // ৫. লিডারবোর্ড (আগের মতোই)
    const allStudents = await User.find({ role: 'Student' });
    const leaderboard = allStudents.map(s => {
      let sTotal = 0;
      s.scores.forEach((val) => { sTotal += val; });
      return {
        userId: { _id: s._id, name: s.name },
        solved_problems: sTotal
      };
    }).sort((a, b) => b.solved_problems - a.solved_problems);

    // ৬. রেসপন্স পাঠানো
    res.status(200).json({
      success: true,
      result: {
        user: student,
        user_labs: user_labs, 
        all_students_profile_in_this_section: leaderboard,
        total_problems: totalPossibleProblems,
        solved_problems: totalSolved 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};