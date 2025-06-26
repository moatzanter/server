// A simple Node.js Express server to handle API requests
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio'); // 1. Import Twilio

const app = express();
const port = process.env.PORT || 3000; // استخدم هذا ليتوافق مع Render

// Twilio credentials
// **IMPORTANT: Store these in environment variables (e.g., .env file) in a real app!**
const accountSid = 'AC894277f12b623c74718bfa085cd8e04a'; // Replace with your Account SID
const authToken = '9af1c7576b53ab69b83d4a6702cc77cf';         // Replace with your Auth Token
const twilioPhoneNumber = '+1 478 758 4853';        // Replace with your Twilio phone number

const client = new twilio(accountSid, authToken); // 2. Initialize Twilio client

// Data source (dummy data for demonstration)
const bakeries = [
  {
    id: 1,
    name: "مخبز رويال",
    location: "بيت بوس",
    image: "assets/images/1.jpg" // Note: This path is for Flutter assets
  },
  {
    id: 2,
    name: "مخبز الشفاء",
    location: "شارع تعز",
    image: "assets/images/2.jpg"
  },
  {
    id: 3,
    name: "مخبز النور",
    location: "حدة",
    image: "assets/images/1.jpg"
  },
  {
    id: 4,
    name: "مخبز الواحة",
    location: "شارع الستين",
    image: "assets/images/2.jpg"
  },
  {
    id: 5,
    name: "مخبز العاصمة",
    location: "التحرير",
    image: "assets/images/3.jpg"
  },
  {
    id: 6,
    name: "مخبز الربيع",
    location: "صنعاء القديمة",
    image: "assets/images/3.jpg"
  },
];

const products = {
  1: [
    { id: 101, title: 'كيكة شوكولاتة', subtitle: 'كيكة غنية بالكريمة', price: 15, bakeryId: 1, description: 'كيكة شهية', image: 'assets/images/1.jpg' },
    { id: 102, title: 'كرواسون بالجبن', subtitle: 'طازج ولذيذ', price: 5, bakeryId: 1, description: 'كرواسون مقرمش', image: 'assets/images/2.jpg' }
  ],
  2: [
    { id: 201, title: 'خبز يمني', subtitle: 'خبز طازج يومياً', price: 2, bakeryId: 2, description: 'خبز التنور الشهي', image: 'assets/images/3.jpg' }
  ],
  3: [], // قائمة فارغة للمخبز رقم 3
  4: [], // قائمة فارغة للمخبز رقم 4
  5: [], // قائمة فارغة للمخبز رقم 5
  6: [], // قائمة فارغة للمخبز رقم 6
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

// Endpoint to register a user (using phone number for simplicity)
app.post('/api/register', (req, res) => {
  const { name, phoneNumber } = req.body;
  console.log(`Registration attempt for: ${name}, ${phoneNumber}`);
  // In a real app, you would save user data to a database here.
  // For this demo, we'll just return a success message.
  if (name && phoneNumber) {
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Name and phone number are required' });
  }
});

// **New Endpoint to request OTP**
app.post('/api/request-otp', (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  // Generate a 4-digit OTP
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Store the OTP with a timestamp for verification
  otpStore.set(phoneNumber, { code: otpCode, createdAt: Date.now() });

  // Send the OTP via Twilio
  client.messages
    .create({
      body: `Your verification code is: ${otpCode}`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    })
    .then((message) => {
      console.log(`OTP sent to ${phoneNumber}. SID: ${message.sid}`);
      res.status(200).json({ success: true, message: 'OTP sent successfully' });
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
    return res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});