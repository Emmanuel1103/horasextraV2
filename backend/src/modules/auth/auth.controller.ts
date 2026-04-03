
import { Request, Response } from "express";
import axios from "axios";
import qs from "qs";
import { logger } from "../../utils/logger";

const TENANT_ID = process.env.TENANT_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:8000/api/auth/callback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

export const login = (req: Request, res: Response) => {
    const authorizationUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`;
    const params = {
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        response_mode: "query",
        scope: `openid profile email ${CLIENT_ID}/.default`,
        state: "12345",
        prompt: "select_account"
    };

    const url = `${authorizationUrl}?${qs.stringify(params)}`;
    res.redirect(url);
};

export const callback = async (req: Request, res: Response) => {
    const { code, state, error, error_description } = req.query;

    if (error) {
        logger.error({ error, error_description }, "Error en callback de autenticación");
        return res.redirect(`${FRONTEND_URL}?error=${error_description}`);
    }

    if (!code) {
        return res.status(400).send("Authorization code missing");
    }

    try {
        const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
        const tokenParams = {
            client_id: CLIENT_ID,
            scope: `openid profile email ${CLIENT_ID}/.default`,
            code: code as string,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
            client_secret: CLIENT_SECRET,
        };

        const response = await axios.post(tokenUrl, qs.stringify(tokenParams), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const { access_token, id_token, expires_in } = response.data;

        // Decode id_token to get user info immediately
        const jwt = require("jsonwebtoken");
        const decoded: any = jwt.decode(id_token);
        const email = decoded.email || decoded.preferred_username;
        const name = decoded.name;
        const oid = decoded.oid; // Object ID from Entra ID

        // Sync user in our DB
        const { syncUser } = require("../users/users.service");
        await syncUser(email, name, oid);

        res.redirect(`${FRONTEND_URL}/gestion-horas-extras?token=${access_token}&id_token=${id_token}`); // Pass id_token too if needed, or usually access_token is enough for API access if it's for same audience

    } catch (error: any) {
        logger.error({
            msg: "Error intercambiando token",
            error: error.response?.data || error.message
        });
        res.redirect(`${FRONTEND_URL}?error=token_exchange_failed`);
    }
};
