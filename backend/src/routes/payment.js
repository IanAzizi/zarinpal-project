//backend/src/routes/payment.js
const express = require("express");
const router = express.Router();
const { createPayment, verifyPayment } = require("../service/zarinpal"); // FIX: Corrected path from services to service
const Transaction = require("../models/Transaction"); // Import the Transaction model
const Unit = require("../models/Unit"); // Assuming Unit model is primary for billing update
const { authMiddleware } = require("../middleware/auth"); // FIX: Use imported auth middleware

// شروع فرایند پرداخت
// body: { unitId, totalToCharge, payments: [{ billingMonthId, amount }] }
// billingMonthId refers to the embedded ID in the Unit model
router.post("/start", authMiddleware, async (req, res) => {
 // req.user is available here due to authMiddleware
 const { unitId, totalToCharge, payments } = req.body;
 
 if (!unitId || !totalToCharge || !payments || totalToCharge <= 0) {
 return res.status(400).json({ ok: false, error: 'Missing unitId, amount, or payments data' });
}

  // The transaction must be created before calling Zarinpal
  const newTransaction = new Transaction({
    user: req.user._id,
    unitId,
    payments: payments.map(p => ({ 
      billingMonthId: p.billingMonthId, 
      amount: p.amount 
    })),
    totalAmount: totalToCharge,
    status: 'pending'
  });
  await newTransaction.save();

  // The callback URL MUST include the transaction ID or Authority (we use the saved _id)
  const callbackUrl = `${process.env.BASE_URL}/api/payment/verify?transactionId=${newTransaction._id.toString()}`;
  const description = `پرداخت بدهی واحد ${unitId} - تراکنش: ${newTransaction._id}`;

  try {
    const z = await createPayment({
      amount: totalToCharge,
      description,
      callbackUrl,
    });

    if (z.data && z.data.authority) {
      const authority = z.data.authority;
      const paymentUrl = `https://www.zarinpal.com/pg/StartPay/${authority}`;

      // Update the transaction with Zarinpal's authority
      newTransaction.authority = authority;
      await newTransaction.save();

      return res.json({ ok: true, authority, paymentUrl });
    }

    // If Zarinpal request fails, mark transaction as failed immediately
    newTransaction.status = 'failed';
    await newTransaction.save();
    res.status(400).json({ ok: false, error: 'Zarinpal request failed', raw: z });

  } catch (e) {
    console.error(e);
    // If network error, mark transaction as failed
    if (newTransaction.isNew || newTransaction.status === 'pending') {
      newTransaction.status = 'failed';
      await newTransaction.save();
    }
    res.status(500).json({ ok: false, error: e.message });
  }
});

// endpoint verify که زرین‌پال بعد از پرداخت به آن برمی‌گردد
router.get("/verify", async (req, res) => {
  // Authority is returned by Zarinpal. transactionId is from our custom callback URL.
  const { Authority, Status, transactionId } = req.query;

  // 1. Check Zarinpal status
  if (Status !== "OK") {
    // Redirect the user back to the frontend with failure status
    return res.send("پرداخت توسط کاربر لغو شد یا موفقیت‌آمیز نبود.");
  }

  // 2. Retrieve Transaction from DB using the ID we passed in the callback
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    return res.status(404).send("تراکنش در سیستم یافت نشد.");
  }

  // 3. SECURITY CHECK: Ensure Authority matches the one we stored
  if (transaction.authority !== Authority) {
    return res.status(401).send("Authority دریافتی با تراکنش ذخیره شده همخوانی ندارد.");
  }

  // 4. Final Verification with Zarinpal (using the saved totalAmount)
  try {
    const result = await verifyPayment({
      // CRITICAL: Use the amount saved in the database, NOT from req.query
      amount: transaction.totalAmount, 
      authority: Authority,
    });

    if (result.data && result.data.code === 100) {
      // Payment Successful (Status 100)

      // A. Update Transaction Status
      transaction.status = 'paid';
      transaction.refId = result.data.ref_id;
      await transaction.save();

      // B. Apply Payment to Unit Bills (Update Unit's billingMonths)
      const unit = await Unit.findById(transaction.unitId);
      if (unit) {
        for (const p of transaction.payments) {
          const billMonth = unit.billingMonths.id(p.billingMonthId); // Use mongoose embedded doc method
          if (billMonth) {
            billMonth.remaining = Math.max(0, billMonth.remaining - p.amount);
          }
        }
        await unit.save();
      }
          
      // FIX: Redirect back to frontend success page
      // The user should be redirected to a dedicated success page on the frontend
      return res.redirect(`${process.env.FRONTEND_URL}/payment/success?refId=${result.data.ref_id}&amount=${transaction.totalAmount}`);
    }
    
    // Payment Failed (Status other than 100)
    transaction.status = 'failed';
    await transaction.save();
    // FIX: Redirect back to frontend failure page
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?resultCode=${result.data ? result.data.code : 999}`);

  } catch (e) {
    console.error("Verification Error:", e);
    
    // Mark transaction as failed if it was pending
    if (transaction.status === 'pending') {
      transaction.status = 'failed';
      await transaction.save();
    }
    
    // FIX: Redirect back to frontend error page
    res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
  }
});

module.exports = router;
