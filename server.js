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

const registeredUsers = [
  { name: 'user1', password: 'password1' },
  { name: 'user2', password: 'password2' },
];

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Sweets Bakery API!');
});

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

// Endpoint for user registration
app.post('/api/register', (req, res) => {
  const { name, phone } = req.body;
  console.log('Received registration request:');
  console.log(`Name: ${name}, Phone: ${phone}`);

  const phoneRegex = /^7\d{8}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
  }

  const userExists = registeredUsers.find(user => user.phone === phone);
  if (userExists) {
    return res.status(409).json({ success: false, message: 'This phone number is already registered.' });
  }

  const newUser = { name, phone };
  registeredUsers.push(newUser);

  console.log('User registered successfully:');
  console.log(newUser);
  console.log('Current registered users:', registeredUsers);
  res.status(201).json({ success: true, message: 'User registered successfully!' });
});

// **New: Endpoint for user login verification**
app.post('/api/login', (req, res) => {
  const { name, password } = req.body;
  console.log('Received login request:');
  console.log(`Name: ${name}, Password: ${password}`);

  const user = registeredUsers.find(
    (user) => user.name === name && user.password === password
  );

  if (user) {
    console.log('Login successful for user:', name);
    res.status(200).json({ success: true, message: 'Login successful!' });
  } else {
    console.log('Login failed for user:', name);
    res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});