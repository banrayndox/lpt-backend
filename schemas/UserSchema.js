import mongoose from 'mongoose';

const LabDefinitionSchema = new mongoose.Schema({
  id: { type: String, required: true },       // e.g., "lab1"
  title: { type: String, required: true },    // e.g., "Lab 1 — Intro to C"
  date: { type: String, required: true },     // e.g., "2026-06-21"
  totalProblems: { type: Number, required: true, default: 4 }
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
 
  scores: { 
    type: Map, 
    of: Number, 
    default: {} 
  },

teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  joinToken: { type: String, default: "CSE-A-2026" },
  labs: [LabDefinitionSchema]

}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;