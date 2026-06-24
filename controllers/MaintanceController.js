import { User, Section, Lab, Score } from "../schemas/UserSchema.js"; 


export const getAllUsers = async (req, res) => {
  try {
 
    const users = await User.find().populate('sectionId', 'name'); 
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const findOrCreateTeacherSection = async (teacherId) => {
  let section = await Section.findOne({ teacherIds: { $exists: true, $not: { $size: 0 } } });
  
  if (!section) {

    section = await Section.create({
      name: `Section-${Date.now()}`, 
      joinToken: `CSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      teacherIds: [teacherId]
    });
  } else {

    if (!section.teacherIds.includes(teacherId)) {
      section.teacherIds.push(teacherId);
      await section.save();
    }
  }
  
  return section;
};


export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; 

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldRole = user.role;


    if (role === 'Teacher') {

      const section = await findOrCreateTeacherSection(user._id);
      

      user.sectionId = section._id;

      await Score.deleteMany({ studentId: user._id });

      
      await user.save();
      
      console.log(`✅ User ${user.name} promoted to Teacher and assigned to Section ${section._id}`);
    }

    else if (role === 'Student') {

      if (user.sectionId) {
        await Section.updateOne(
          { _id: user.sectionId },
          { $pull: { teacherIds: user._id } }
        );
      }

      user.sectionId = null;

      await Score.deleteMany({ studentId: user._id });
      
      await user.save();
      
      console.log(`✅ User ${user.name} demoted to Student and removed from section.`);
    }

    else {

      user.role = role;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sectionId: user.sectionId
      }
    });

  } catch (error) {
    console.error("Role update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Score.deleteMany({ studentId: userId });


    await user.deleteOne();
    
    res.status(200).json({ success: true, message: 'User and their scores deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetAllSystem = async (req, res) => {
  try {

    await User.deleteMany({ role: { $ne: 'Maintance' } }); 
    await Section.deleteMany({});
    await Lab.deleteMany({});
    await Score.deleteMany({});

    res.status(200).json({ success: true, message: 'System reset: All Users (except Maintance), Sections, Labs, and Scores have been wiped.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};