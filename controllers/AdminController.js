import crypto from 'crypto';
import { User, Section, Lab, Score } from "../schemas/UserSchema.js"

// ১. গ্রেড এবং ইউজার লিস্ট আনা (এখন সেকশন ভিত্তিক)
export const getGradesAndUsers = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    const section = await Section.findOne({ teacherIds: teacher._id });
    if (!section) return res.status(404).json({ message: "No section found" });

    const labs = await Lab.find({ sectionId: section._id });
    const students = await User.find({ sectionId: section._id, role: 'Student' });

    res.status(200).json({
      success: true,
      joinToken: section.joinToken,
      labs,
      users: students
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. নতুন ল্যাব তৈরি করা
export const addTodayLab = async (req, res) => {
  const { title, date, totalProblems } = req.body;
  try {
    const teacher = await User.findById(req.user.id);
    const section = await Section.findOne({ teacherIds: teacher._id });

    const newLab = await Lab.create({ sectionId: section._id, title, date, totalProblems });

    // ঐ সেকশনের সব স্টুডেন্টের জন্য জিরো স্কোর এন্ট্রি তৈরি করা
    const students = await User.find({ sectionId: section._id });
    for (let student of students) {
      await Score.create({ studentId: student._id, labId: newLab._id, score: 0 });
    }

    res.status(201).json({ success: true, message: 'Lab added successfully', lab: newLab });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. স্টুডেন্ট মার্কস আপডেট
export const updateStudentMarks = async (req, res) => {
  const { studentId } = req.params;
  const { updatedScores } = req.body; // e.g., { labId1: 5, labId2: 10 }

  try {
    for (const [labId, scoreValue] of Object.entries(updatedScores)) {
      await Score.findOneAndUpdate(
        { studentId, labId },
        { score: scoreValue },
        { upsert: true }
      );
    }
    res.status(200).json({ success: true, message: 'Scores updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. স্টুডেন্ট রিমুভ করা
export const removeUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await Score.deleteMany({ studentId: userId }); // স্কোরের অনাথ ডাটা মুছে ফেলা
    await User.findByIdAndDelete(userId);
    res.status(200).json({ success: true, message: 'Student and their data removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৫. জয়েন টোকেন রী-জেনারেট করা
export const regenerateJoinToken = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    const section = await Section.findOne({ teacherIds: teacher._id });
    
    section.joinToken = `CSE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await section.save();

    res.status(200).json({ success: true, joinToken: section.joinToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৬. সেকশন ডাটা ক্লিন করা
export const clearSection = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    const section = await Section.findOne({ teacherIds: teacher._id });

    await Score.deleteMany({ labId: { $in: await Lab.find({ sectionId: section._id }).distinct('_id') } });
    await Lab.deleteMany({ sectionId: section._id });
    await User.updateMany({ sectionId: section._id, role: 'Student' }, { $set: { sectionId: null } });

    res.status(200).json({ success: true, message: 'All labs and scores for this section cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};