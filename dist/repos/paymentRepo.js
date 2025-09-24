"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaypalOrder = exports.createPayment = exports.updatePaymentStatus = exports.savePayment = void 0;
const payments_1 = __importDefault(require("../models/payments"));
const mongoose_1 = __importDefault(require("mongoose"));
// stripe payment block start
const savePayment = (payment) => __awaiter(void 0, void 0, void 0, function* () {
    const newPayment = new payments_1.default(payment);
    return yield newPayment.save();
});
exports.savePayment = savePayment;
// to update sessionId
const updatePaymentStatus = (sessionId, status, paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🔍 updatePaymentStatus called with:", {
        sessionId,
        status,
        paymentId,
    });
    if (paymentId) {
        // ✅ Ensure ObjectId conversion
        const objectId = new mongoose_1.default.Types.ObjectId(paymentId);
        console.log("🔄 Updating by paymentId (ObjectId):", objectId);
        return yield payments_1.default.findByIdAndUpdate(objectId, {
            status,
            stripeSessionId: sessionId,
        }, { new: true });
    }
    else {
        // fallback
        console.log("🔄 Updating by sessionId:", sessionId);
        return yield payments_1.default.findOneAndUpdate({ stripeSessionId: sessionId }, {
            status,
            stripeSessionId: sessionId,
        }, { new: true });
    }
});
exports.updatePaymentStatus = updatePaymentStatus;
// Stripe payment block end
// PayPal payment block start
const createPayment = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = new payments_1.default(data);
    return yield payment.save();
});
exports.createPayment = createPayment;
const updatePaypalOrder = (paypalOrderId, status) => __awaiter(void 0, void 0, void 0, function* () {
    return yield payments_1.default.findOneAndUpdate({ paypalOrderId }, { status }, { new: true });
});
exports.updatePaypalOrder = updatePaypalOrder;
