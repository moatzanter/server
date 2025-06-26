// A simple Node.js Express server to handle API requests
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio'); // 1. Import Twilio

const app = express();
const port = process.env.PORT || 3000;

// Twilio credentials
// **IMPORTANT: Store these in environment variables (e.g., .env file) in a real app!**
// **قم بتحديث هذه المتغيرات بمعلومات حسابك الخاصة**
const accountSid = 'AC894277f12b623c74718bfa085cd8e04a'; // Replace with your Account SID
const authToken = '9af1c7576b53ab69b83d4a6702cc77cf';         // Replace with your Auth Token
const twilioPhoneNumber = '+1 478 758 4853';        // Replace with your Twilio phone number

const client = new twilio(accountSid, authToken); // 2. Initialize Twilio client

// Dummy data for products (from your original file)
const bakeries = [
  // ... your bakeries data ...
];

const products = {
  // ... your products data ...
};

// A simple in-memory store for OTPs (for demonstration)
// In a real app, use a database like Redis or MongoDB with TTL (Time-To-Live)
const otpStore = new Map();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- API Endpoints ---

// Endpoint to get all bakeries
app.get('/api/bakeries', (req, res) => {
  console.log('GET /api/bakeries request received');
  res.json(bakeries);
});

// Endpoint to get products by bakery ID
// **هذا هو المسار الصحيح الذي يجب أن يتطابق مع Flutter**
app.get('/api/bakeries/:bakeryId/products', (req, res) => {
  const bakeryId = parseInt(req.params.bakeryId);
  console.log(`Request received for products of bakery ID: ${bakeryId}`);
  
  const bakeryProducts = products[bakeryId] || []; // Return empty array if not found
  res.json(bakeryProducts);
});

// **Endpoint to send OTP via SMS**
app.post('/api/send-otp', (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store the OTP with a timestamp for verification
  otpStore.set(phoneNumber, { code: otp, createdAt: Date.now() });

  // Add the country code (e.g., +967 for Yemen)
  const fullPhoneNumber = `+${phoneNumber}`; // Make sure the client sends the full international number, or add it here
  
  console.log(`Generated OTP: ${otp} for ${fullPhoneNumber}`);

  // Use Twilio to send the SMS
  client.messages
    .create({
      body: `رمز التحقق الخاص بك هو: ${otp}`, // Your OTP message
      from: twilioPhoneNumber,
      to: fullPhoneNumber,
    })
    .then((message) => {
      console.log(`SMS sent successfully! SID: ${message.sid}`);
      res.json({ success: true, message: 'OTP sent successfully' });
    })
    .catch((error) => {
      console.error('Error sending SMS:', error);
      res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
    });
});

// **New Endpoint to verify OTP**
app.post('/api/verify-otp', (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
  }

  const storedOtpData = otpStore.get(phoneNumber);

  if (!storedOtpData) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  const { code, createdAt } = storedOtpData;
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Check if OTP has expired
  if (Date.now() - createdAt > fiveMinutes) {
    otpStore.delete(phoneNumber); // Clean up expired OTP
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
  }

  // Check if the provided OTP matches the stored one
  if (code === otp) {
    otpStore.delete(phoneNumber); // OTP is verified, remove it from the store
    return res.json({ success: true, message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});