import express from 'express';
const router = express.Router();

import * as authController from '../controllers/AuthController.js';
import * as userController from '../controllers/UserController.js';
import * as adminController from '../controllers/AdminController.js';

import { protect, authorizeTeacher } from '../middlewares/checkAuth.js';

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


export default router;