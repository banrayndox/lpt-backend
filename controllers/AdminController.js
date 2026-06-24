import crypto from 'crypto';
import { User, Section, Lab, Score } from "../schemas/UserSchema.js";


export const getGradesAndUsers = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    let section = await Section.findOne({ teacherIds: teacher._id });


    if (!section) {
      section = await Section.create({
        name: `${teacher.name.split(' ')[0]}-Section`, 
        joinToken: `CSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        teacherIds: [teacher._id]
      });
      await User.findByIdAndUpdate(teacher._id, { sectionId: section._id });
    }


    const labs = await Lab.find({ sectionId: section._id });
    const students = await User.find({ sectionId: section._id, role: 'Student' });


    const studentIds = students.map(s => s._id);
    const allScores = await Score.find({ studentId: { $in: studentIds } });

    const scoresMap = {};
    allScores.forEach(score => {
      if (!scoresMap[score.studentId]) scoresMap[score.studentId] = {};
      scoresMap[score.studentId][score.labId.toString()] = score.score;
    });

    const studentsWithScores = students.map(s => ({
      ...s.toObject(),
      scores: scoresMap[s._id] || {}
    }));

    res.status(200).json({
      success: true,
      joinToken: section.joinToken,
      labs,
      users: studentsWithScores
    });

  } catch (error) {
    console.error("Error in getGradesAndUsers:", error);
    res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};


export const addTodayLab = async (req, res) => {
  const { title, date, totalProblems, scores } = req.body; 

  try {
    const teacher = await User.findById(req.user.id);
    const section = await Section.findOne({ teacherIds: teacher._id });

    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    const newLab = await Lab.create({
      sectionId: section._id,
      title,
      date,
      totalProblems: totalProblems || 4
    });


    const students = await User.find({ sectionId: section._id, role: 'Student' });

    for (let student of students) {
      const scoreValue = (scores && scores[student._id] !== undefined) ? scores[student._id] : 0;
      await Score.create({
        studentId: student._id,
        labId: newLab._id,
        score: Math.min(scoreValue, totalProblems) 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Lab added successfully',
      lab: newLab
    });
  } catch (error) {
    console.error("Error in addTodayLab:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const updateStudentMarks = async (req, res) => {
  const { studentId } = req.params;
  const { updatedScores } = req.body; 

  try {

    for (const [labId, scoreValue] of Object.entries(updatedScores)) {
      await Score.findOneAndUpdate(
        { studentId, labId },
        { score: scoreValue },
        { upsert: true, new: true }
      );
    }
    res.status(200).json({ success: true, message: 'Scores updated successfully' });
  } catch (error) {
    console.error("Error in updateStudentMarks:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeUser = async (req, res) => {
  try {
    const userId = req.params.id;

    await Score.deleteMany({ studentId: userId });

    await User.findByIdAndDelete(userId);
    res.status(200).json({ success: true, message: 'Student and their data removed' });
  } catch (error) {
    console.error("Error in removeUser:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const regenerateJoinToken = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    const section = await Section.findOne({ teacherIds: teacher._id });

    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    section.joinToken = `CSE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await section.save();

    res.status(200).json({ success: true, joinToken: section.joinToken });
  } catch (error) {
    console.error("Error in regenerateJoinToken:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const clearSection = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    const section = await Section.findOne({ teacherIds: teacher._id });

    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

   
    const labIds = await Lab.find({ sectionId: section._id }).distinct('_id');
  
    await Score.deleteMany({ labId: { $in: labIds } });

    await Lab.deleteMany({ sectionId: section._id });
  
    await User.updateMany(
      { sectionId: section._id, role: 'Student' },
      { $set: { sectionId: null } }
    );

    res.status(200).json({ success: true, message: 'All labs and scores for this section cleared' });
  } catch (error) {
    console.error("Error in clearSection:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};