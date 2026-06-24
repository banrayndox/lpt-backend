import mongoose from 'mongoose';

// ১. Section Schema: এখানে টোকেন এবং মাল্টিপল টিচার থাকবে
const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "CSE-A-2026"
  joinToken: { type: String, required: true, unique: true },
  teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // একাধিক টিচার যোগ করার সুবিধা
});

// ২. Lab Schema: ল্যাবের তথ্য সব স্টুডেন্টের জন্য কমন থাকবে
const LabSchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  totalProblems: { type: Number, default: 4 }
});

// ৩. Score Schema: মার্কস আলাদা রাখার ফলে যেকোনো টিচার আপডেট করলে তা সবার কাছে সেইম দেখাবে
const ScoreSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  score: { type: Number, default: 0 }
});

// ৪. User Schema: আপনার আগের স্ট্রাকচার অনুযায়ী মডিফাই করা
const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['Student', 'Teacher', 'Maintance'], // আপনার রিকোয়েস্ট অনুযায়ী
    default: 'Student' 
  },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' } // কোন সেকশনে আছে
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Section = mongoose.model('Section', SectionSchema);
const Lab = mongoose.model('Lab', LabSchema);
const Score = mongoose.model('Score', ScoreSchema);

export { User, Section, Lab, Score };