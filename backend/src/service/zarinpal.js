const axios = require('axios');


const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID;
// مطمئن شوید که URL ها برای API V4 صحیح هستند
const ZARINPAL_REQ_URL = 'https://api.zarinpal.com/pg/v4/payment/request.json';
const ZARINPAL_VERIFY_URL = 'https://api.zarinpal.com/pg/v4/payment/verify.json';


async function createPayment({ amount, description, callbackUrl }){
const body = {
merchant_id: MERCHANT_ID,
amount: amount, // به واحد ریال
callback_url: callbackUrl,
description: description
};
const res = await axios.post(ZARINPAL_REQ_URL, body, { headers: { 'Content-Type':'application/json' } });
return res.data; // ساختار پاسخ زرین‌پال: { data: { authority, ... }, errors: ... }
}


async function verifyPayment({ amount, authority }){
const body = { merchant_id: MERCHANT_ID, amount, authority };
const res = await axios.post(ZARINPAL_VERIFY_URL, body, { headers: { 'Content-Type':'application/json' } });
return res.data; // ساختار پاسخ: { data: { code, ref_id, ... }, errors: ... }
}


module.exports = { createPayment, verifyPayment };