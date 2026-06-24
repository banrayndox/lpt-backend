import { User, Section, Lab, Score } from "../schemas/UserSchema.js";


export const joinSectionByToken = async (req, res) => {
  const { joinToken } = req.body;

  try {
    const section = await Section.findOne({ joinToken });
    if (!section) {
      return res.status(400).json({ success: false, message: 'Invalid join token' });
    }

    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }


    if (student.sectionId) {
      const oldLabs = await Lab.find({ sectionId: student.sectionId });
      const oldLabIds = oldLabs.map(l => l._id);
      await Score.deleteMany({ studentId: student._id, labId: { $in: oldLabIds } });
    }


    student.sectionId = section._id;
    await student.save();


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
    console.error("Join section error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getDashboardData = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate('sectionId');
    if (!student) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!student.sectionId) {
      return res.status(200).json({
        success: true,
        result: { user: student } 
      });
    }

  
    const labsList = await Lab.find({ sectionId: student.sectionId._id });

 
    const userScores = await Score.find({ studentId: student._id });

  
    const user_labs = labsList.map(lab => {
      const scoreObj = userScores.find(s => s.labId.toString() === lab._id.toString());
      return {
        lab: lab,          
        score: scoreObj ? scoreObj.score : 0
      };
    });

   
    const totalSolved = userScores.reduce((sum, s) => sum + s.score, 0);
    const totalPossibleProblems = labsList.reduce((sum, l) => sum + l.totalProblems, 0);

    
    const allStudents = await User.find({ sectionId: student.sectionId._id });
    const allScores = await Score.find({
      studentId: { $in: allStudents.map(s => s._id) }
    });

    const leaderboard = allStudents.map(s => {
      const sTotal = allScores
        .filter(score => score.studentId.toString() === s._id.toString())
        .reduce((sum, sc) => sum + sc.score, 0);
      return {
        userId: { _id: s._id, name: s.name },
        solved_problems: sTotal
      };
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
    console.error("Dashboard data error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select('-password')
      .populate('sectionId', 'name description');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile"
    });
  }
};