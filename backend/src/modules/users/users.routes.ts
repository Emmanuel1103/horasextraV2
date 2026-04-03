import { Router } from "express";
import * as usersController from "./users.controller";
// import { authMiddleware } from "../../middleware/auth"; // We will need this

const router = Router();

// TODO: Add auth middleware to protect these routes
router.get("/me", usersController.getMe);
router.get("/", usersController.getAll);
router.patch("/:id/role", usersController.updateRole);

export default router;
