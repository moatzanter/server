// A simple Node.js Express server to handle API requests
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const otpGenerator = require('otp-generator'); // New: Import OTP generator library

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
    { id: 101, title: 'كيكة الشوكولاتة', subtitle: 'كيكة غنية بالكريمة', price: 15, image: 'assets/images/7.png', description: 'كيكة شوكولاتة فاخرة مع طبقات من الكريمة الغنية. مثالية للمناسبات الخاصة.', bakeryId: 1 },
    { id: 102, title: 'خبز يمني', subtitle: 'خبز طازج ومقرمش', price: 2, image: 'assets/images/8.png', description: 'خبز يمني تقليدي مخبوز على الطريقة القديمة.', bakeryId: 1 },
  ],
  2: [
    { id: 201, title: 'معجنات الجبنة', subtitle: 'عجينة ذهبية محشوة بالجبنة', price: 10, image: 'assets/images/7.png', description: 'معجنات هشة ومحشوة بأجود أنواع الجبن، مثالية للفطور أو العشاء.', bakeryId: 2 },
    { id: 202, title: 'بقلاوة بالفستق', subtitle: 'حلويات شرقية تقليدية', price: 20, image: 'assets/images/8.png', description: 'بقلاوة فاخرة مصنوعة من الفستق الحلبي الطازج.', bakeryId: 2 },
    { id: 203, title: 'كرواسون شوكولاتة', subtitle: 'كرواسون فرنسي محشو', price: 5, image: 'assets/images/1.jpg', description: 'كرواسون طازج ومقرمش محشو بالشوكولاتة.', bakeryId: 2 },
  ],
  3: [
    { id: 301, title: 'كيكة الفواكه', subtitle: 'منعشة ولذيذة', price: 18, image: 'assets/images/7.png', description: 'كيكة خفيفة مزينة بالفواكه الطازجة.', bakeryId: 3 },
  ],
  4: [
    { id: 401, title: 'كعك العسل', subtitle: 'مذاق العسل الطبيعي', price: 8, image: 'assets/images/8.png', description: 'كعك محلى بالعسل الطبيعي، مثالي مع الشاي.', bakeryId: 4 },
  ],
  5: [
    { id: 501, title: 'خبز الخميرة البلدية', subtitle: 'خبز صحي ولذيذ', price: 3, image: 'assets/images/7.png', description: 'خبز مصنوع من الخميرة البلدية الطبيعية.', bakeryId: 5 },
    { id: 502, title: 'كنافة نابلسية', subtitle: 'بالجبنة والعسل', price: 25, image: 'assets/images/8.png', description: 'كنافة على الطريقة النابلسية التقليدية.', bakeryId: 5 },
  ],
};

const registeredUsers = [];

// New: In-memory store for OTP codes
const otpStore = {}; // { phoneNumber: { code: '123456', expires: timestamp } }

// --- API Endpoints ---

// Endpoint to get all bakeries
app.get('/api/bakeries', (req, res) => {
  res.json(bakeries);
});

// Endpoint to get products for a specific bakery
app.get('/api/bakeries/:bakeryId/products', (req, res) => {
  const bakeryId = parseInt(req.params.bakeryId);
  console.log(`Fetching products for bakery ID: ${bakeryId}`);
  
  const bakeryProducts = products[bakeryId] || [];
  res.json(bakeryProducts);
});

// New: Endpoint to generate and store OTP code (without sending SMS)
app.post('/api/generate-otp', (req, res) => {
  const { phoneNumber } = req.body;
  
  // Server-side validation for the phone number
  const phoneRegex = /^7\d{8}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
  }

  // Generate a 6-digit OTP code
  const otpCode = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  
  // Set expiration time (e.g., 5 minutes from now)
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes in milliseconds
  
  // Store the OTP and its expiration time
  otpStore[phoneNumber] = { code: otpCode, expires: expires };

  console.log(`Generated OTP for ${phoneNumber}: ${otpCode}. It will expire in 5 minutes.`);

  // Respond with success message. We do NOT send the OTP code to the user.
  res.status(200).json({ success: true, message: 'OTP code generated and stored successfully.' });
});

// New: Endpoint to verify the OTP code
app.post('/api/verify-otp', (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  console.log(`Received verification request for ${phoneNumber} with code: ${otpCode}`);

  const storedOtp = otpStore[phoneNumber];

  if (!storedOtp) {
    // OTP not found for this number
    console.log('Verification failed: OTP not found for this phone number.');
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
  }
  
  // Check if the OTP is expired
  if (Date.now() > storedOtp.expires) {
    // Remove the expired OTP from the store
    delete otpStore[phoneNumber];
    console.log('Verification failed: OTP code has expired.');
    return res.status(400).json({ success: false, message: 'OTP code has expired.' });
  }
  
  // Check if the provided OTP code matches the stored one
  if (otpCode === storedOtp.code) {
    // OTP is valid, remove it from the store to prevent reuse
    delete otpStore[phoneNumber];
    console.log('Verification successful.');
    return res.status(200).json({ success: true, message: 'OTP code verified successfully!' });
  } else {
    // OTP does not match
    console.log('Verification failed: Incorrect OTP code.');
    return res.status(400).json({ success: false, message: 'Incorrect OTP code.' });
  }
});

// نقطة نهاية لتسجيل المستخدمين الجدد
// **تم تعديل هذا الجزء ليتوقع 'name' و 'password' وإزالة التحقق من 'phone'**
app.post('/api/register', (req, res) => {
  const { name, password } = req.body; // استخلاص name و password
  console.log('Received registration request:');
  console.log(`Name: ${name}, Password: [HIDDEN]`); // إخفاء كلمة المرور في السجل

  // التحقق من صحة المدخلات
  if (!name || !password) {
    return res.status(400).json({ success: false, message: 'الاسم وكلمة المرور مطلوبان.' });
  }
  if (password.length < 4) { // يمكنك تعديل الحد الأدنى لطول كلمة المرور
    return res.status(400).json({ success: false, message: 'يجب أن تكون كلمة المرور 4 أحرف على الأقل.' });
  }

  // التحقق مما إذا كان اسم المستخدم موجوداً بالفعل
  const userExists = registeredUsers.find(user => user.name === name);
  if (userExists) {
    return res.status(409).json({ success: false, message: 'اسم المستخدم هذا مستخدم بالفعل.' });
  }

  // إضافة المستخدم الجديد إلى المصفوفة المؤقتة
  const newUser = { name, password }; // تخزين الاسم وكلمة المرور
  registeredUsers.push(newUser);

  console.log('User registered successfully:');
  console.log(newUser);
  console.log('Current registered users:', registeredUsers);
  res.status(201).json({ success: true, message: 'تم تسجيل المستخدم بنجاح!' });
});


// New: Endpoint for user login verification
app.post('/api/login', (req, res) => {
  const { name, password } = req.body;
  console.log('Received login request:');
  console.log(`Name: ${name}, Password: [HIDDEN]`); // إخفاء كلمة المرور في السجل

  const user = registeredUsers.find(
    (user) => user.name === name && user.password === password
  );

  if (user) {
    console.log('Login successful for user:', name);
    res.status(200).json({ success: true, message: 'Login successful!' });
  } else {
    console.log('Login failed: Invalid credentials.');
    res.status(401).json({ success: false, message: 'Invalid name or password.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
 