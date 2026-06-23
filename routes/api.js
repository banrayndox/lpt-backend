import express from 'express';
const router = express.Router();

import * as authController from '../controllers/AuthController.js';
import * as userController from '../controllers/UserController.js';
import * as adminController from '../controllers/AdminController.js';
import { getAllUsers, updateUserRole, deleteUser, resetAllSystem } from '../controllers/MaintanceController.js';
import { protect, authorizeTeacher, authorizeAdmin } from '../middlewares/checkAuth.js';

router.post('/auth/google', authController.googleLogin);
router.get('/auth/me', protect, authController.getMe);

router.post('/user/join', protect, userController.joinSectionByToken);
router.get('/user/dashboard', protect, userController.getDashboardData);


router.get('/admin/overview', protect, authorizeTeacher, adminController.getGradesAndUsers);
router.post('/admin/labs', protect, authorizeTeacher, adminController.addTodayLab);
router.put('/admin/students/:studentId/marks', protect, authorizeTeacher, adminController.updateStudentMarks);
router.delete('/admin/users/:id', protect, authorizeTeacher, adminController.removeUser);
router.post('/admin/token/regenerate', protect, authorizeTeacher, adminController.regenerateJoinToken);
router.post('/admin/danger/clear', protect, authorizeTeacher, adminController.clearSection);

router.get('/users', protect, authorizeAdmin, getAllUsers);
router.patch('/users/:id/role', protect, authorizeAdmin, updateUserRole);
router.delete('/users/:id', protect, authorizeAdmin, deleteUser);
router.post('/reset-all', protect, authorizeAdmin, resetAllSystem);
export default router;