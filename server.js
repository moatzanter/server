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
    { id: 101, title: 'كيكة الشوكولاتة', subtitle: 'كيكة غنية بالكريمة', price: 15, image: 'assets/images/1.jpg', description: 'وصف المنتج' },
    { id: 102, title: 'كرواسون بالجبن', subtitle: 'طازج ومقرمش', price: 10, image: 'assets/images/2.jpg', description: 'وصف المنتج' },
  ],
  2: [
    { id: 201, title: 'خبز يمني', subtitle: 'خبز تقليدي', price: 5, image: 'assets/images/3.jpg', description: 'وصف المنتج' },
    { id: 202, title: 'كعك بالعسل', subtitle: 'محلى بالعسل الطبيعي', price: 8, image: 'assets/images/4.jpg', description: 'وصف المنتج' },
  ],
  3: [],
  4: [],
  5: [],
};

// **هنا سنحفظ المستخدمين المسجلين (في الذاكرة)**
// سنحفظ اسم المستخدم والرمز
const registeredUsers = [];
const otps = {}; // لحفظ رموز OTP (رقم الهاتف: الرمز)

// Endpoints
app.get('/', (req, res) => {
  res.send('API is running!');
});

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

// **تعديل: نقطة النهاية لتسجيل مستخدم جديد (بالاسم والرمز)**
app.post('/api/register', (req, res) => {
  const { name, password } = req.body;
  console.log('Received registration request:');
  console.log(`Name: ${name}, Password: ${password}`);

  // **التحقق من وجود الاسم مسبقاً**
  const userExists = registeredUsers.find(user => user.name === name);
  if (userExists) {
    return res.status(409).json({ success: false, message: 'This username is already taken.' });
  }

  // **حفظ المستخدم الجديد (في الذاكرة حالياً)**
  const newUser = { name, password };
  registeredUsers.push(newUser);

  console.log('User registered successfully:');
  console.log(newUser);
  console.log('Current registered users:', registeredUsers);
  
  res.status(201).json({ success: true, message: 'User registered successfully.' });
});


// **نقطة نهاية جديدة لتسجيل الدخول (login)**
app.post('/api/login', (req, res) => {
    const { name, password } = req.body;
    console.log('Received login request:');
    console.log(`Name: ${name}, Password: ${password}`);
  
    // البحث عن المستخدم
    const user = registeredUsers.find(user => user.name === name && user.password === password);
  
    if (user) {
      console.log('User logged in successfully:', user);
      res.status(200).json({ success: true, message: 'Login successful.' });
    } else {
      console.log('Login failed: Invalid credentials');
      res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }
});


// **نقطة نهاية لتوليد رمز OTP**
app.post('/api/generate-otp', (req, res) => {
  const { phoneNumber } = req.body;

  // **التحقق من صحة رقم الهاتف في الخادم (Server-side validation)**
  // (9 أرقام، تبدأ بـ 7)
  const phoneRegex = /^7\d{8}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
  }

  // توليد رمز مكون من 6 أرقام
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // حفظ الرمز مع رقم الهاتف (هذا مؤقت، في تطبيق حقيقي سيتم استخدام قاعدة بيانات)
  otps[phoneNumber] = otpCode;

  console.log(`Generated OTP for ${phoneNumber}: ${otpCode}`);

  // في التطبيق الحقيقي، هنا يتم إرسال الرمز عبر خدمة SMS
  // For now, we'll just send it in the response for testing
  res.status(200).json({ success: true, message: 'OTP sent successfully.', otp: otpCode });
});

// **نقطة نهاية للتحقق من رمز OTP**
app.post('/api/verify-otp', (req, res) => {
  const { phoneNumber, otpCode } = req.body;
  
  console.log(`Verifying OTP for ${phoneNumber}. Received code: ${otpCode}`);

  // التحقق مما إذا كان الرمز المرسل يطابق الرمز المحفوظ
  if (otps[phoneNumber] && otps[phoneNumber] === otpCode) {
    // قم بمسح الرمز بعد التحقق
    delete otps[phoneNumber];
    console.log(`OTP for ${phoneNumber} verified successfully.`);
    res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } else {
    console.log(`Verification failed for ${phoneNumber}. Incorrect code.`);
    res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});