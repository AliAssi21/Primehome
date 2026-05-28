import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import ordersRouter from "./orders";
import cartRouter from "./cart";
import wishlistRouter from "./wishlist";
import couponsRouter from "./coupons";
import settingsRouter from "./settings";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(cartRouter);
router.use(wishlistRouter);
router.use(couponsRouter);
router.use(settingsRouter);
router.use(adminRouter);

export default router;
