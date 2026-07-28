/**
 * Project routes — mounted at /api/projects. Manager-only.
 * Employees read their projects through /api/me/projects.
 */
import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authenticateUser } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from '../validators/project.validator.js';

const router = Router();

router.use(authenticateUser, authorizeRoles('MANAGER'));

// GET /api/projects
router.get(
  '/',
  validate({ query: listProjectsQuerySchema }),
  projectController.listProjects,
);

// POST /api/projects — create and assign
router.post('/', validate({ body: createProjectSchema }), projectController.createProject);

// PUT /api/projects/:id
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateProjectSchema }),
  projectController.updateProject,
);

// DELETE /api/projects/:id
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  projectController.deleteProject,
);

export default router;
