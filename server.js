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
    { id: 101, title: 'كيكة الشوكولاتة', subtitle: 'كيكة غنية بالكريمة', price: 15, image: 'assets/images/1.jpg', description: 'كيكة اسفنجية بالشوكولاتة مع طبقة غنية من كريمة الشوكولاتة.' },
    { id: 102, title: 'معجنات الجبنة', subtitle: 'معجنات هشة بالجبنة', price: 5, image: 'assets/images/2.jpg', description: 'معجنات طازجة ومقرمشة محشوة بأجود أنواع الجبن.' },
    { id: 103, title: 'خبز يمني', subtitle: 'خبز تقليدي', price: 2, image: 'assets/images/3.jpg', description: 'خبز يمني تقليدي مخبوز في التنور.' },
    { id: 104, title: 'كيكة الفواكه', subtitle: 'كيكة منعشة بالفواكه', price: 20, image: 'assets/images/4.jpg', description: 'كيكة خفيفة مزينة بالفواكه الموسمية الطازجة.' },
  ],
  2: [
    { id: 201, title: 'خبز الشفاء', subtitle: 'خبز أسمر صحي', price: 3, image: 'assets/images/1.jpg', description: 'خبز أسمر مصنوع من الحبوب الكاملة.' },
    { id: 202, title: 'كوكيز الشوفان', subtitle: 'كوكيز صحي', price: 4, image: 'assets/images/2.jpg', description: 'كوكيز الشوفان مع الزبيب.' },
  ],
  3: [
    { id: 301, title: 'كرواسون', subtitle: 'كرواسون زبدة', price: 7, image: 'assets/images/3.jpg', description: 'كرواسون فرنسي هش بالزبدة.' },
    { id: 302, title: 'خبز بالسمسم', subtitle: 'خبز مع سمسم', price: 2, image: 'assets/images/4.jpg', description: 'خبز أبيض مغطى بالسمسم.' },
  ],
  4: [
    { id: 401, title: 'خبز عربي', subtitle: 'خبز يومي', price: 1, image: 'assets/images/1.jpg', description: 'خبز عربي تقليدي.' },
  ],
  5: [
    { id: 501, title: 'كعك العيد', subtitle: 'كعك تقليدي', price: 12, image: 'assets/images/2.jpg', description: 'كعك تقليدي محشو بالتمر.' },
  ]
};

const registeredUsers = [];

// --- API Endpoints ---
// Endpoint to get all bakeries
app.get('/api/bakeries', (req, res) => {
  console.log('Fetching all bakeries...');
  res.json(bakeries);
});

// Endpoint to get products for a specific bakery
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
  console.log('Current registered users:', registeredUsers);

  res.status(201).json({ success: true, message: 'User registered successfully!' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});