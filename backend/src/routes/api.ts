import { Router } from "express";
import requestsRouter from "../modules/requests/requests.controller";
import authRouter from "../modules/auth/auth.routes";
import { default as configRouter, publicRouter as publicConfigRouter } from "../modules/system-config/system-config.controller";
import usersRouter from "../modules/users/users.routes";
// Import auth middleware (needs to be created if not exists, but for now we skip to keep moving)
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use("/auth", authRouter);
router.use("/public-config", publicConfigRouter); // Public endpoint

// Extraer endpoints de aprobación por link como públicos antes de proteger requests

router.get("/requests/approve-by-link/:token", (req, res, next) => {
    req.url = `/approve-by-link/${req.params.token}`;
    requestsRouter(req, res, next);
});

router.post("/requests/approve-by-link", (req, res, next) => {
    // Re-enrutar al handler específico del router existente
    req.url = '/approve-by-link';
    requestsRouter(req, res, next);
});

// Permitir creación pública de solicitudes desde el formulario de reporte.
router.post("/requests", (req, res, next) => {
    req.url = '/';
    requestsRouter(req, res, next);
});

router.use("/requests", requireAuth, requestsRouter);
router.use("/config", requireAuth, configRouter);
router.use("/users", requireAuth, usersRouter); // Protect user routes

router.get("/", (_req, res) => res.json({ ok: true, version: "1.0" }));

export default router;
