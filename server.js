// A simple Node.js Express server to handle API requests
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Dummy Data ---
// In a real app, this would be a database
const bakeries = [
  { id: 1, name: "مخبز رويال", location: "بيت بوس", image: "assets/images/1.jpg" },
  { id: 2, name: "مخبز الشفاء", location: "شارع تعز", image: "assets/images/2.jpg" },
  { id: 3, name: "مخبز النور", location: "حدة", image: "assets/images/1.jpg" },
  { id: 4, name: "مخبز الواحة", location: "شارع الستين", image: "assets/images/2.jpg" },
  { id: 5, name: "مخبز اليمن السعيد", location: "شارع 24", image: "assets/images/1.jpg" },
];

const products = {
  1: [
    { id: 101, title: 'كيكة الشوكولاتة', subtitle: 'كيكة غنية بالكريمة', price: 15, image: 'assets/images/7.png' },
    { id: 102, title: 'كرواسون بالجبن', subtitle: 'كرواسون هش ولذيذ', price: 8, image: 'assets/images/8.png' },
    { id: 103, title: 'خبز صاج طازج', subtitle: 'مخبوز يومياً', price: 5, image: 'assets/images/4.webp' },
  ],
  2: [
    { id: 201, title: 'معجنات مشكلة', subtitle: 'أشكال ونكهات مختلفة', price: 20, image: 'assets/images/7.png' },
    { id: 202, title: 'جاتوه فواكه', subtitle: 'طبقات من الفواكه والكريمة', price: 25, image: 'assets/images/8.png' },
  ],
  3: [
    { id: 301, title: 'بيتزا صغيرة', subtitle: 'بيتزا بالخضار والزيتون', price: 12, image: 'assets/images/7.png' },
  ],
  4: [
    { id: 401, title: 'كيكة عيد ميلاد', subtitle: 'حسب الطلب', price: 50, image: 'assets/images/7.png' },
    { id: 402, title: 'كوكيز الشوكولاتة', subtitle: 'هش ولذيذ', price: 7, image: 'assets/images/8.png' },
  ],
  5: [
    { id: 501, title: 'خبز البرجر', subtitle: 'مخبوز طازج', price: 10, image: 'assets/images/7.png' },
  ],
};

const registeredUsers = [
  // A dummy user for testing
  { name: 'Test User', phone: '777111222', password: '123' },
];

let otpCodes = {}; // Store OTP codes in memory

// --- API Endpoints ---

// Get all bakeries
app.get('/api/bakeries', (req, res) => {
  res.json(bakeries);
});

// Get products for a specific bakery
app.get('/api/bakeries/:bakeryId/products', (req, res) => {
  const bakeryId = parseInt(req.params.bakeryId);
  console.log(`Fetching products for bakery ID: ${bakeryId}`);
  
  const bakeryProducts = products[bakeryId] || [];
  res.json(bakeryProducts);
});

// **Updated: Endpoint for user registration with phone and password**
app.post('/api/register', (req, res) => {
  const { name, phone, password } = req.body;
  console.log('Received registration request:');
  console.log(`Name: ${name}, Phone: ${phone}, Password: ${password}`);

  // Server-side validation for phone number (9 digits, starts with 7)
  const phoneRegex = /^7\d{8}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
  }

  // Check if phone number is already registered
  const userExists = registeredUsers.find(user => user.phone === phone);
  if (userExists) {
    return res.status(409).json({ success: false, message: 'This phone number is already registered.' });
  }

  // Save the new user (in-memory for now)
  const newUser = { name, phone, password };
  registeredUsers.push(newUser);

  console.log('User registered successfully:');
  console.log(newUser);
  console.log('Current registered users:', registeredUsers);

  res.status(201).json({ success: true, message: 'User registered successfully!' });
});

// **New: Endpoint for user login with phone and password**
app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  console.log('Received login request:');
  console.log(`Phone: ${phone}, Password: ${password}`);

  // Find the user by phone and password
  const user = registeredUsers.find(user => user.phone === phone && user.password === password);

  if (user) {
    console.log('Login successful for user:', user.name);
    return res.status(200).json({ success: true, message: 'Login successful!' });
  } else {
    console.log('Login failed: Invalid credentials.');
    return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
  }
});

// Endpoint to generate a new OTP
app.post('/api/generate-otp', (req, res) => {
  const { phoneNumber } = req.body;
  // In a real app, you would generate a random code and send it via SMS
  const otpCode = '123456'; // For testing purposes, a fixed code
  otpCodes[phoneNumber] = otpCode;
  console.log(`Generated OTP for ${phoneNumber}: ${otpCode}`);
  res.status(200).json({ success: true, message: 'OTP sent successfully!' });
});

// Endpoint to verify the OTP
app.post('/api/verify-otp', (req, res) => {
  const { phoneNumber, otpCode } = req.body;
  console.log(`Verifying OTP for ${phoneNumber} with code ${otpCode}`);

  if (otpCodes[phoneNumber] === otpCode) {
    delete otpCodes[phoneNumber]; // Remove the code after successful verification
    res.status(200).json({ success: true, message: 'OTP verified successfully!' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP code.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});