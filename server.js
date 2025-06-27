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

// --- Dummy Data (In-memory storage) ---
// In a real app, this would be a database like MongoDB or PostgreSQL
const bakeries = [
  { id: 1, name: "مخبز رويال", location: "بيت بوس", image: "assets/images/1.jpg" },
  { id: 2, name: "مخبز الشفاء", location: "شارع تعز", image: "assets/images/2.jpg" },
  { id: 3, name: "مخبز النور", location: "حدة", image: "assets/images/1.jpg" },
  { id: 4, name: "مخبز الواحة", location: "شارع الستين", image: "assets/images/2.jpg" },
  { id: 5, name: "مخبز اليمن السعيد", location: "شارع 24", image: "assets/images/1.jpg" },
];

const products = {
  1: [
    { id: 101, title: 'كيكة الشوكولاتة', subtitle: 'كيكة غنية بالكريمة', price: 15, image: 'assets/images/1.jpg', description: 'كيكة اسفنجية لذيذة بنكهة الشوكولاتة الفاخرة.' },
    { id: 102, title: 'خبز فرنسي', subtitle: 'خبز طازج ومقرمش', price: 3, image: 'assets/images/2.jpg', description: 'خبز باجيت فرنسي تقليدي، مثالي للساندويتشات.' },
    { id: 103, title: 'معجنات مشكلة', subtitle: 'تشكيلة متنوعة من المعجنات', price: 10, image: 'assets/images/3.jpg', description: 'مجموعة من المعجنات الشهية بحشوات مختلفة.' },
    { id: 104, title: 'كوكيز برقائق الشوكولاتة', subtitle: 'مقرمش من الخارج وطري من الداخل', price: 5, image: 'assets/images/2.jpg', description: 'كوكيز محضر بعناية ومحشو برقائق الشوكولاتة.' },
  ],
  2: [
    { id: 201, title: 'خبز صاج', subtitle: 'خبز يمني تقليدي', price: 2, image: 'assets/images/1.jpg', description: 'خبز صاج طازج ومثالي للأطباق اليمنية.' },
    { id: 202, title: 'بسبوسة بالقشطة', subtitle: 'حلى شرقي أصيل', price: 8, image: 'assets/images/3.jpg', description: 'بسبوسة طرية ومسقية بالشيرة مع طبقة من القشطة.' },
    { id: 203, title: 'كرواسون بالجبنة', subtitle: 'كرواسون هش ولذيذ', price: 4, image: 'assets/images/2.jpg', description: 'كرواسون محشو بالجبنة الطازجة.' },
  ],
  3: [
    { id: 301, title: 'دونات مغطاة بالسكر', subtitle: 'دونات طازجة يوميًا', price: 2, image: 'assets/images/2.jpg', description: 'دونات طرية ومغطاة بالسكر الناعم.' },
    { id: 302, title: 'كعك العيد', subtitle: 'كعك تقليدي بنكهات مختلفة', price: 7, image: 'assets/images/1.jpg', description: 'كعك هش ومذاقه رائع، مناسب لكل المناسبات.' },
  ],
  4: [
    { id: 401, title: 'بيتزا صغيرة', subtitle: 'بيتزا سريعة ومناسبة للجميع', price: 6, image: 'assets/images/1.jpg', description: 'بيتزا صغيرة بحشوة الخضروات والجبنة.' },
    { id: 402, title: 'كيكة الفواكه', subtitle: 'كيكة منعشة بالفواكه الموسمية', price: 20, image: 'assets/images/2.jpg', description: 'كيكة خفيفة مزينة بالفواكه الطازجة.' },
  ],
  5: [
    { id: 501, title: 'خبز بلدي', subtitle: 'خبز تقليدي محلي', price: 1, image: 'assets/images/3.jpg', description: 'خبز بلدي ساخن وطازج من الفرن.' },
    { id: 502, title: 'بقلاوة', subtitle: 'حلى شرقي مقرمش بالعسل', price: 12, image: 'assets/images/1.jpg', description: 'طبقات من العجين الرقيق محشوة بالمكسرات ومسقية بالعسل.' },
  ],
};

const registeredUsers = []; // Stores registered user data (name, phone, password)

// --- API Endpoints ---

// Endpoint to get all bakeries
app.get('/api/bakeries', (req, res) => {
  res.json(bakeries);
});

// ... (الكود السابق) ...

// **New: In-memory storage for OTP codes**
const otpStorage = {}; // Stores { phoneNumber: otpCode }

// **New Endpoint: Generate and send OTP code**
app.post('/api/generate-otp', (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber || !/^7\d{8}$/.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
  }

  // Generate a 6-digit random OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store the OTP code in memory (for a real app, use a database with an expiration time)
  otpStorage[phoneNumber] = otpCode;

  console.log(`Generated OTP for ${phoneNumber}: ${otpCode}`);

  // In a real application, you would use a service like Twilio or Vonage to send an SMS.
  // We'll just return a success message for this dummy server.
  res.status(200).json({ success: true, message: 'OTP code sent successfully!', otp: otpCode });
});

// **New Endpoint: Verify OTP code**
app.post('/api/verify-otp', (req, res) => {
  const { phoneNumber, otpCode } = req.body;
  
  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP code are required.' });
  }

  // Check if the OTP code exists and matches the stored one
  if (otpStorage[phoneNumber] && otpStorage[phoneNumber] === otpCode) {
    // Correct OTP, clear it from storage after verification
    delete otpStorage[phoneNumber];
    res.status(200).json({ success: true, message: 'OTP verified successfully!' });
  } else {
    // Incorrect or expired OTP
    res.status(401).json({ success: false, message: 'Invalid or expired OTP code.' });
  }
});

// ... (الكود السابق) ...

// Endpoint to get products for a specific bakery
app.get('/api/bakeries/:bakeryId/products', (req, res) => {
  const bakeryId = parseInt(req.params.bakeryId);
  console.log(`Fetching products for bakery ID: ${bakeryId}`);
  
  const bakeryProducts = products[bakeryId] || [];
  res.json(bakeryProducts);
});

// **Updated: Endpoint for user registration**
// Now saves name, phone, and password
app.post('/api/register', (req, res) => {
  const { name, phone, password } = req.body;
  console.log('Received registration request:');
  console.log(`Name: ${name}, Phone: ${phone}, Password: ${password ? '*****' : 'N/A'}`);

  // Server-side validation
  const phoneRegex = /^7\d{8}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format. Must start with 7 and be 9 digits.' });
  }

  // Check if the phone number is already registered
  const userExists = registeredUsers.find(user => user.phone === phone);
  if (userExists) {
    return res.status(409).json({ success: false, message: 'This phone number is already registered.' });
  }
  
  // Validate password length
  if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  // Save the new user (in-memory)
  const newUser = { name, phone, password };
  registeredUsers.push(newUser);

  console.log('User registered successfully:');
  console.log(newUser);
  console.log('Current registered users:', registeredUsers);
  
  res.status(200).json({ success: true, message: 'User registered successfully!' });
});

// **New: Endpoint for user login**
// Verifies user's phone number and password
app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  console.log('Received login request:');
  console.log(`Phone: ${phone}, Password: ${password ? '*****' : 'N/A'}`);

  // Find the user by phone number
  const user = registeredUsers.find(user => user.phone === phone);

  if (!user) {
    // User not found
    return res.status(404).json({ success: false, message: 'Phone number not found.' });
  }

  // Check if the password matches
  if (user.password !== password) {
    // Incorrect password
    return res.status(401).json({ success: false, message: 'Incorrect password.' });
  }
  
  // Login successful
  console.log('User logged in successfully:', user.name);
  res.status(200).json({ success: true, message: 'Login successful!', user: { name: user.name, phone: user.phone } });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});