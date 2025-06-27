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
    { id: 101, title: 'كيكة الشوكولاتة', subtitle: 'كيكة غنية بالكريمة', price: 15, image: 'assets/images/7.png', description: 'كيكة شهية محضرة من أجود أنواع الشوكولاتة.' },
    { id: 102, title: 'خبز يمني', subtitle: 'خبز طازج يومياً', price: 5, image: 'assets/images/8.png', description: 'خبز تقليدي محضر بعناية ومخبوز يوميًا.' },
    { id: 103, title: 'بسبوسة قشطة', subtitle: 'بسبوسة بالقشطة الطازجة', price: 10, image: 'assets/images/3.jpg', description: 'بسبوسة لذيذة محشوة بالقشطة.' },
    { id: 104, title: 'معجنات مشكلة', subtitle: 'تشكيلة من المعجنات', price: 20, image: 'assets/images/7.png', description: 'مجموعة متنوعة من المعجنات المالحة والحلويات.' },
  ],
  2: [
    { id: 201, title: 'خبز صاج', subtitle: 'صاج طازج', price: 6, image: 'assets/images/8.png', description: 'خبز الصاج الطازج.' },
    { id: 202, title: 'كيكة فانيليا', subtitle: 'كيكة الفانيليا الناعمة', price: 18, image: 'assets/images/7.png', description: 'كيكة هشة ولذيذة بنكهة الفانيليا.' },
  ],
  3: [
    { id: 301, title: 'كنافة نابلسية', subtitle: 'كنافة بالقشطة', price: 25, image: 'assets/images/7.png', description: 'كنافة نابلسية أصلية.' },
  ],
  4: [
    { id: 401, title: 'بيتزا صغيرة', subtitle: 'بيتزا بالخضروات', price: 12, image: 'assets/images/8.png', description: 'بيتزا صغيرة مع الخضروات الطازجة.' },
  ],
  5: [
    { id: 501, title: 'بسكويت العيد', subtitle: 'بسكويت متنوع', price: 8, image: 'assets/images/7.png', description: 'بسكويت شهي ومقرمش.' },
  ],
};

const registeredUsers = []; // تخزين مؤقت للمستخدمين المسجلين
// **بداية الجزء المضاف للتحقق من رقم الهاتف**
// تخزين مؤقت لرموز التحقق (OTP)
// في بيئة الإنتاج، استخدم قاعدة بيانات حقيقية مع وقت انتهاء صلاحية
const otpStore = {}; // مثال: { '967771234567': '123456' }

// === Endpoint 1: لإنشاء وإرسال رمز التحقق (OTP) ===
// هذا الـ Endpoint يستقبل رقم الهاتف وينشئ رمزًا عشوائيًا ويخزنه
app.post('/api/generate-otp', (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب.' });
    }

    // إنشاء رمز عشوائي مكون من 6 أرقام
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // تخزين الرمز في قاعدة البيانات الوهمية (الـ Map)
    otpStore[phoneNumber] = otpCode;

    // **هذا الجزء هو الأهم:** طباعة الرمز في الطرفية لتتمكن من إرساله يدوياً
    console.log(`\n===================================`);
    console.log(`تم إنشاء رمز OTP جديد:`);
    console.log(`  - رقم الهاتف: ${phoneNumber}`);
    console.log(`  - رمز التحقق (OTP): ${otpCode}`);
    console.log(`===================================\n`);

    // إرسال استجابة بنجاح العملية إلى تطبيق Flutter
    res.status(200).json({ success: true, message: 'تم إنشاء رمز التحقق. يرجى التحقق من الطرفية لإرساله يدوياً.' });
});

// === Endpoint 2: للتحقق من رمز OTP ===
// هذا الـ Endpoint يستقبل رقم الهاتف والرمز المدخل من المستخدم ويتحقق منهما
app.post('/api/verify-otp', (req, res) => {
    const { phoneNumber, otpCode } = req.body;

    if (!phoneNumber || !otpCode) {
        return res.status(400).json({ success: false, message: 'رقم الهاتف ورمز التحقق مطلوبان.' });
    }

    const storedCode = otpStore[phoneNumber];

    if (!storedCode) {
        return res.status(404).json({ success: false, message: 'لم يتم العثور على رمز لهذا الرقم. الرجاء طلب رمز جديد.' });
    }

    if (storedCode === otpCode) {
        // الرمز صحيح!
        delete otpStore[phoneNumber]; // حذف الرمز من الذاكرة بعد الاستخدام لمرة واحدة
        res.status(200).json({ success: true, message: 'تم التحقق من الرمز بنجاح.' });
    } else {
        // الرمز غير صحيح
        res.status(401).json({ success: false, message: 'رمز التحقق غير صحيح.' });
    }
});
// **نهاية الجزء المضاف**

// --- API Endpoints الموجودة سابقاً ---
app.get('/api/bakeries', (req, res) => {
  console.log('Fetching all bakeries...');
  res.json(bakeries);
});

app.get('/api/bakeries/:bakeryId/products', (req, res) => {
  const bakeryId = parseInt(req.params.bakeryId);
  console.log(`Fetching products for bakery ID: ${bakeryId}`);
  
  const bakeryProducts = products[bakeryId] || [];
  res.json(bakeryProducts);
});

// **تعديل: نقطة النهاية لتسجيل مستخدم جديد مع التحقق من الرقم**
app.post('/api/register', (req, res) => {
  const { name, phone } = req.body;
  console.log('Received registration request:');
  console.log(`Name: ${name}, Phone: ${phone}`);

  // **التحقق من صحة رقم الهاتف في الخادم (Server-side validation)**
  // (9 أرقام، تبدأ بـ 7)
  const phoneRegex = /^7\d{8}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
  }

  // **التحقق من وجود رقم الهاتف مسبقاً**
  const userExists = registeredUsers.find(user => user.phone === phone);
  if (userExists) {
    return res.status(409).json({ success: false, message: 'This phone number is already registered.' });
  }

  // **حفظ المستخدم الجديد (في الذاكرة حالياً)**
  const newUser = { name, phone };
  registeredUsers.push(newUser);

  console.log('User registered successfully:');
  console.log(newUser);
  console.log('Current registered users:', registeredUsers.map(user => user.phone));

  res.status(201).json({ success: true, message: 'User registered successfully.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
  console.log(`Endpoints available:`);
  console.log(`- GET /api/bakeries`);
  console.log(`- GET /api/bakeries/:bakeryId/products`);
  console.log(`- POST /api/register`);
  // **الـ Endpoints الجديدة**
  console.log(`- POST /api/generate-otp`);
  console.log(`- POST /api/verify-otp`);
});