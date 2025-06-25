// A simple Node.js Express server to handle API requests
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // To handle CORS errors

const app = express();
const port = process.env.PORT || 3000; // استخدم هذا ليتوافق مع Render

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- API Endpoints ---

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
    name: "مخبز السعادة",
    location: "الزبيري",
    image: "assets/images/2.jpg"
  }
];

const products = {
  1: [
    { id: 101, title: 'كيك الشوكولاتة', subtitle: 'كيكة غنية بالكريمة', price: 15, image: 'assets/images/1.jpg' },
    { id: 102, title: 'كرواسون بالجبن', subtitle: 'طازج ولذيذ', price: 5, image: 'assets/images/2.jpg' }
  ],
  2: [
    { id: 201, title: 'خبز يمني', subtitle: 'خبز طازج يومياً', price: 2, image: 'assets/images/3.jpg' }
  ],
  3: [], // قائمة فارغة للمخبز رقم 3
  4: [], // قائمة فارغة للمخبز رقم 4
  5: [], // قائمة فارغة للمخبز رقم 5
};

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

// User registration endpoint
app.post('/api/register', (req, res) => {
  const { name, phone } = req.body;
  if (name && phone) {
    console.log(`User registered: Name: ${name}, Phone: ${phone}`);
    res.status(201).json({ success: true, message: 'User registered successfully!' });
  } else {
    res.status(400).json({ success: false, message: 'Name and phone are required.' });
  }
});

// ابدأ الخادم بالاستماع
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});