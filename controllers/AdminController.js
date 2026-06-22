import crypto from 'crypto';
// ES Modules-এ লোকাল ফাইল ইম্পোর্ট করার সময় শেষে .js দেওয়া বাধ্যতামূলক
import User from '../schemas/UserSchema.js';

// ১. Grades ও Users ট্যাবের জন্য সব ডেটা একত্রীকরণ
export const getGradesAndUsers = async (req, res) => {
  try {
    // রিকোয়েস্ট পাঠানো টিচার (এডমিন) নিজেই req.user এ আছেন
    const teacher = await User.findById(req.user.id);
    const allUsers = await User.find({role: 'Student'});

    res.status(200).json({
      success: true,
      joinToken: teacher.joinToken,
      labs: teacher.labs,
      users: allUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. নতুন ল্যাব তৈরি করা (টিচারের 'labs' অ্যারেতে পুশ হবে)
export const addTodayLab = async (req, res) => {
  // 'initialScores' এর পরিবর্তে 'scores' ব্যবহার করুন
  const { title, date, totalProblems, scores } = req.body; 

  try {
    const teacher = await User.findById(req.user.id);
    const newLabId = `lab${teacher.labs.length + 1}`;

    teacher.labs.push({ id: newLabId, title, date, totalProblems });
    await teacher.save();

    const students = await User.find({ role: 'Student' });
    for (let student of students) {
      // এখানেও 'scores' ব্যবহার করুন
      const score = scores && scores[student._id] ? scores[student._id] : 0;
      student.scores.set(newLabId, score);
      await student.save();
    }

    res.status(201).json({ success: true, message: 'Lab added successfully', labs: teacher.labs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. সিঙ্গেল স্টুডেন্টের এক্সপ্যান্ডেড ড্রয়ার থেকে স্কোর এডিট ও আপডেট
export const updateStudentMarks = async (req, res) => {
  const { studentId } = req.params;
  const { updatedScores } = req.body;

  try {
    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    Object.keys(updatedScores).forEach(labId => {
      student.scores.set(labId, updatedScores[labId]);
    });

    await student.save();
    res.status(200).json({ success: true, message: 'Student marks updated successfully', data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. স্টুডেন্ট রিমুভ করা
export const removeUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (user.role === 'Teacher') {
      return res.status(400).json({ success: false, message: 'Action denied: Cannot remove teacher' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'Student profile deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৫. টিচার নিজের প্রোফাইলের জয়েন টোকেন রী-জেনারেট করবেন
export const regenerateJoinToken = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    const newToken = `CSE-C-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    
    teacher.joinToken = newToken;
    await teacher.save();

    // এখানে token এর বদলে joinToken পাঠাচ্ছি যাতে ফ্রন্টএন্ডে সরাসরি ইউজ করা যায়
    res.status(200).json({ success: true, joinToken: newToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৬. ডেঞ্জার জোন - ক্লিয়ার সেকশন (সব স্টুডেন্ট ডিলিট এবং টিচারের ল্যাব অ্যারে ফাঁকা করা)
export const clearSection = async (req, res) => {
  try {
    await User.deleteMany({ role: 'Student' });
    
    const teacher = await User.findById(req.user.id);
    teacher.labs = [];
    await teacher.save();

    res.status(200).json({ success: true, message: 'Danger zone: All students and labs wiped out' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};