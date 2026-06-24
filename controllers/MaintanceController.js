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
  // এমন একটি সেকশন খুঁজুন যাতে অন্তত একজন টিচার আছে
  let section = await Section.findOne({ teacherIds: { $exists: true, $not: { $size: 0 } } });
  
  if (!section) {
    // কোনো টিচার-যুক্ত সেকশন নেই → নতুন তৈরি করুন
    section = await Section.create({
      name: `Section-${Date.now()}`,
      joinToken: `CSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      teacherIds: [teacherId]
    });
  } else {
    // যদি টিচারটি ইতিমধ্যে এই সেকশনের তালিকায় না থাকে, তবে যোগ করুন
    if (!section.teacherIds.includes(teacherId)) {
      section.teacherIds.push(teacherId);
      await section.save();
    }
  }
  
  return section;
};

// ==========================================
// ২. ইউজার রোল আপডেট (সংশোধিত)
// ==========================================
export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; 

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 🔥 প্রধান ফিক্স: সব ব্রাঞ্চে রোল সেট করতে হবে
    if (role === 'Teacher') {
      // ১. রোল সেট করুন
      user.role = role;  // ← আগে ছিল না

      // ২. সেকশন খুঁজুন/তৈরি করুন
      const section = await findOrCreateTeacherSection(user._id);
      user.sectionId = section._id;

      // ৩. স্টুডেন্ট হিসাবে থাকা অবস্থায় যেসব স্কোর ছিল, তা ডিলিট করুন (টিচারের স্কোর দরকার নেই)
      await Score.deleteMany({ studentId: user._id });

      // ৪. সেভ করুন
      await user.save();
      
      console.log(`✅ User ${user.name} promoted to Teacher and assigned to Section ${section._id}`);
    } 
    else if (role === 'Student') {
      // ১. রোল সেট করুন
      user.role = role;  // ← আগে ছিল না

      // ২. যদি আগে কোনো সেকশনের টিচার ছিলেন, তবে সেই সেকশন থেকে টিচার লিস্ট থেকে সরান
      if (user.sectionId) {
        await Section.updateOne(
          { _id: user.sectionId },
          { $pull: { teacherIds: user._id } }
        );
      }

      // ৩. সেকশন থেকে বের করে দিন
      user.sectionId = null;

      // ৪. পুরোনো স্কোর ডিলিট করুন (নতুন সেকশনে জয়েন করলে নতুন স্কোর পাবেন)
      await Score.deleteMany({ studentId: user._id });

      // ৫. সেভ করুন
      await user.save();
      
      console.log(`✅ User ${user.name} demoted to Student and removed from section.`);
    } 
    else {
      // অন্যান্য রোল (Maintance) – শুধু রোল পরিবর্তন, সেকশন অপরিবর্তিত
      user.role = role;
      await user.save();
    }

    // সফল রেসপন্স
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