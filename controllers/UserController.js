import { User, Section, Lab, Score } from "../schemas/UserSchema.js"; // নতুন মডেলে ইমপোর্ট করুন

export const joinSectionByToken = async (req, res) => {
  const { joinToken } = req.body;

  try {
    // ১. টোকেন দিয়ে সেকশন খুঁজুন
    const section = await Section.findOne({ joinToken });
    if (!section) {
      return res.status(400).json({ success: false, message: 'Invalid join token' });
    }

    // ২. স্টুডেন্টকে আপডেট করুন
    const student = await User.findByIdAndUpdate(
      req.user.id,
      { sectionId: section._id },
      { new: true }
    );

    // ৩. ঐ সেকশনের সব ল্যাবগুলোর জন্য জিরো স্কোর এন্ট্রি তৈরি করুন
    const sectionLabs = await Lab.find({ sectionId: section._id });
    for (const lab of sectionLabs) {
      await Score.findOneAndUpdate(
        { studentId: student._id, labId: lab._id },
        { score: 0 },
        { upsert: true }
      );
    }

    res.status(200).json({ success: true, message: 'Successfully joined section' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getDashboardData = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate('sectionId');
    if (!student.sectionId) return res.status(400).json({ message: "No section joined" });

    // ১. সেকশনের সব ল্যাব আনুন
    const labsList = await Lab.find({ sectionId: student.sectionId._id });
    
    // ২. স্টুডেন্টের সব স্কোর আনুন
    const userScores = await Score.find({ studentId: student._id });

    // ৩. ল্যাব এবং স্কোরের ম্যাপ তৈরি
    const user_labs = labsList.map(lab => {
      const scoreObj = userScores.find(s => s.labId.toString() === lab._id.toString());
      return {
        lab: lab,
        score: scoreObj ? scoreObj.score : 0
      };
    });

    // ৪. স্টুডেন্টের মোট সলভড প্রবলেম
    const totalSolved = userScores.reduce((sum, s) => sum + s.score, 0);
    const totalPossibleProblems = labsList.reduce((sum, l) => sum + l.totalProblems, 0);

    // ৫. লিডারবোর্ড (ঐ সেকশনের সব স্টুডেন্টদের জন্য)
    const allStudents = await User.find({ sectionId: student.sectionId._id });
    const allScores = await Score.find({ 
      studentId: { $in: allStudents.map(s => s._id) } 
    });

    const leaderboard = allStudents.map(s => {
      const sTotal = allScores
        .filter(score => score.studentId.toString() === s._id.toString())
        .reduce((sum, s) => sum + s.score, 0);
      return { userId: { _id: s._id, name: s.name }, solved_problems: sTotal };
    }).sort((a, b) => b.solved_problems - a.solved_problems);

    res.status(200).json({
      success: true,
      result: {
        user: student,
        user_labs,
        all_students_profile_in_this_section: leaderboard,
        total_problems: totalPossibleProblems,
        solved_problems: totalSolved 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


