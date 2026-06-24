import mongoose from 'mongoose';


const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  joinToken: { type: String, required: true, unique: true },
  teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
});


const LabSchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  totalProblems: { type: Number, default: 4 }
});


const ScoreSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  score: { type: Number, default: 0 }
});


const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['Student', 'Teacher', 'Maintance'], 
    default: 'Student' 
  },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' } 
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Section = mongoose.model('Section', SectionSchema);
const Lab = mongoose.model('Lab', LabSchema);
const Score = mongoose.model('Score', ScoreSchema);

export { User, Section, Lab, Score };