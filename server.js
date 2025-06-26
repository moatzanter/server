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
    { id: 101, title: 'كيكة الشوكولاتة', subtitle: 'كيكة غنية بالكريمة', price: 15, image: 'assets/images/1.jpg' },
    { id: 102, title: 'كرواسون بالجبن', subtitle: 'طازج ولذيذ', price: 5, image: 'assets/images/2.jpg' }
  ],
  2: [
    { id: 201, title: 'خبز يمني', subtitle: 'خبز طازج يومياً', price: 2, image: 'assets/images/3.jpg' }
  ],
  3: [],
  4: [],
  5: [],
};

// **جديد: مصفوفة لتخزين المستخدمين المسجلين**
const registeredUsers = [];

// --- API Endpoints ---

// Endpoint to get all bakeries
app.get('/api/bakeries', (req, res) => {
  console.log('GET /api/bakeries request received');
  res.json(bakeries);
});

// Endpoint to get products by bakery ID
app.get('/api/bakeries/:bakeryId/products', (req, res) => {
  const bakeryId = parseInt(req.params.bakeryId);
  console.log(`Request received for products of bakery ID: ${bakeryId}`);
  
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

  res.json({ success: true, message: 'User registered successfully!' });
});


// Endpoint for testing purposes
app.get('/', (req, res) => {
  res.send('Sweets Bakery API is running!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('API is ready to accept connections.');
});