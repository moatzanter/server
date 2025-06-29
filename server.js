// A robust Node.js Express server with Firebase Firestore database integration,
// password hashing (bcryptjs), and JSON Web Token (JWT) authentication.

// استيراد المكتبات الأساسية
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcryptjs'); // لتجزئة كلمات المرور وتأمينها
const jwt = require('jsonwebtoken'); // للمصادقة عبر JWT
const admin = require('firebase-admin'); // لإدارة Firebase (Firestore) من جانب الخادم

// (اختياري) تحميل متغيرات البيئة من ملف .env
// هذا السطر يقرأ المتغيرات من ملف .env إذا كان موجوداً.
// إذا كنت تستخدم منصات نشر مثل Render، فقم بتكوين متغيرات البيئة لديهم مباشرة.
require('dotenv').config();

// تهيئة تطبيق Express
const app = express();
// تحديد المنفذ (Port)، إما من متغيرات البيئة أو القيمة الافتراضية 3000
const port = process.env.PORT || 3000;

// الحصول على المفتاح السري لـ JWT من متغيرات البيئة
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('خطأ فادح: JWT_SECRET غير معرّف. يرجى تعيينه في متغيرات البيئة أو ملف .env.');
  process.exit(1); // إنهاء التطبيق إذا لم يتم تعيين المتغير السري لأسباب أمنية
}

// تهيئة Firebase Admin SDK
// يجب أن يكون مفتاح حساب الخدمة كـ JSON String في متغير بيئة واحد.
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error('خطأ فادح: FIREBASE_SERVICE_ACCOUNT_KEY غير معرّف. يرجى تعيينه في متغيرات البيئة أو ملف .env.');
  process.exit(1);
}

try {
  // تحليل مفتاح حساب الخدمة من JSON String
  const serviceAccount = JSON.parse(serviceAccountKey);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('تم تهيئة Firebase Admin SDK بنجاح.');
} catch (error) {
  console.error('خطأ فادح: فشل في تحليل مفتاح حساب خدمة Firebase أو تهيئة Firebase Admin SDK.', error);
  process.exit(1); // إنهاء التطبيق في حالة فشل التهيئة
}

// الحصول على مرجع قاعدة بيانات Firestore
const db = admin.firestore();

// Middleware (البرمجيات الوسيطة)
app.use(cors()); // السماح بطلبات Cross-Origin (مهم لتطبيقات الويب والجوّال)
app.use(bodyParser.json()); // تحليل طلبات JSON القادمة في جسم الطلب
app.use(bodyParser.urlencoded({ extended: true })); // تحليل طلبات URL-encoded في جسم الطلب

// متجر رموز OTP في الذاكرة (مؤقت: سيتم فقدانه عند إعادة تشغيل الخادم)
// في تطبيق إنتاجي حقيقي، قد تحتاج إلى استخدام قاعدة بيانات مؤقتة مثل Redis لتخزين OTP.
const otpStore = {}; // { phoneNumber: { code: '123456', expires: timestamp } }

// --- وظائف مساعدة لتهيئة البيانات الأولية في Firestore ---
// هذه الوظائف تضمن وجود بيانات افتراضية إذا كانت المجموعات فارغة في قاعدة البيانات.
async function initializeDummyData() {
  // بيانات المخابز الأولية
  const initialBakeries = [
    { id: 1, name: "مخبز رويال", location: "بيت بوس", image: "assets/images/1.jpg" },
    { id: 2, name: "مخبز الشفاء", location: "شارع تعز", image: "assets/images/2.jpg" },
    { id: 3, name: "مخبز النور", location: "حدة", image: "assets/images/1.jpg" },
    { id: 4, name: "مخبز الواحة", location: "شارع الستين", image: "assets/images/2.jpg" },
    { id: 5, name: "مخبز اليمن السعيد", location: "شارع 24", image: "assets/images/1.jpg" },
  ];

  // بيانات المنتجات الأولية
  const initialProducts = {
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

  const bakeriesRef = db.collection('bakeries');
  const productsRef = db.collection('products');

  // التحقق مما إذا كانت مجموعة المخابز فارغة وتعبئتها
  const bakeriesSnapshot = await bakeriesRef.get();
  if (bakeriesSnapshot.empty) {
    console.log('جارٍ تعبئة مجموعة المخابز بالبيانات الأولية...');
    for (const bakery of initialBakeries) {
      await bakeriesRef.doc(bakery.id.toString()).set(bakery); // استخدام id كمعرف للمستند في Firestore
    }
    console.log('تم تعبئة بيانات المخابز بنجاح.');
  } else {
    console.log('مجموعة المخابز تحتوي بالفعل على بيانات.');
  }

  // التحقق مما إذا كانت مجموعة المنتجات فارغة وتعبئتها
  const productsSnapshot = await productsRef.get();
  if (productsSnapshot.empty) {
    console.log('جارٍ تعبئة مجموعة المنتجات بالبيانات الأولية...');
    for (const bakeryId in initialProducts) {
      const prods = initialProducts[bakeryId];
      for (const product of prods) {
        // إضافة مستند لكل منتج، مع إضافة bakeryId له
        await productsRef.add(product);
      }
    }
    console.log('تم تعبئة بيانات المنتجات بنجاح.');
  } else {
    console.log('مجموعة المنتجات تحتوي بالفعل على بيانات.');
  }
}

// تشغيل وظيفة تعبئة البيانات عند بدء تشغيل الخادم
initializeDummyData().catch(console.error);


// --- نقاط نهاية الـ API (API Endpoints) ---

// نقطة نهاية لجلب جميع المخابز من Firestore
app.get('/api/bakeries', async (req, res) => {
  try {
    const bakeriesSnapshot = await db.collection('bakeries').get();
    // تحويل مستندات Firestore إلى كائنات JSON
    const bakeries = bakeriesSnapshot.docs.map(doc => doc.data());
    res.json(bakeries);
  } catch (error) {
    console.error('خطأ في جلب المخابز:', error);
    res.status(500).json({ message: 'فشل في جلب المخابز. يرجى المحاولة لاحقاً.' });
  }
});

// نقطة نهاية لجلب المنتجات لمخبز معين من Firestore
app.get('/api/bakeries/:bakeryId/products', async (req, res) => {
  const bakeryId = parseInt(req.params.bakeryId); // تحويل المعرف إلى رقم صحيح
  console.log(`جارٍ جلب المنتجات للمخبز ذي المعرف: ${bakeryId}`);

  try {
    const productsSnapshot = await db.collection('products')
      .where('bakeryId', '==', bakeryId) // تصفية المنتجات حسب bakeryId
      .get();
    const bakeryProducts = productsSnapshot.docs.map(doc => doc.data());
    res.json(bakeryProducts);
  } catch (error) {
    console.error(`خطأ في جلب المنتجات للمخبز ${bakeryId}:`, error);
    res.status(500).json({ message: 'فشل في جلب المنتجات لهذا المخبز. يرجى المحاولة لاحقاً.' });
  }
});

// نقطة نهاية لإنشاء وتخزين رمز OTP (بدون إرسال رسالة نصية فعلية)
app.post('/api/generate-otp', (req, res) => {
  const { phoneNumber } = req.body;

  // التحقق من صحة رقم الهاتف من جانب الخادم
  const phoneRegex = /^7\d{8}$/; // مثال: رقم يمني يبدأ بـ 7 ولديه 8 أرقام أخرى (9 أرقام في المجموع)
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: 'صيغة رقم الهاتف غير صالحة.' });
  }

  // إنشاء رمز OTP مكون من 6 أرقام (أرقام فقط)
  const otpCode = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

  // تعيين وقت انتهاء الصلاحية (مثلاً، 5 دقائق من الآن)
  const expires = Date.now() + 5 * 60 * 1000; // 5 دقائق بالمللي ثانية

  // تخزين رمز OTP ووقت انتهائه في المتجر المؤقت (otpStore)
  otpStore[phoneNumber] = { code: otpCode, expires: expires };

  console.log(`تم إنشاء رمز OTP للرقم ${phoneNumber}: ${otpCode}. سينتهي بعد 5 دقائق.`);

  // الرد برسالة نجاح. لا نرسل رمز OTP إلى المستخدم مباشرة في هذا المثال، بل يتم إدخاله يدوياً في التطبيق.
  res.status(200).json({ success: true, message: 'تم إنشاء وتخزين رمز OTP بنجاح.' });
});

// نقطة نهاية للتحقق من رمز OTP
app.post('/api/verify-otp', (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  console.log(`تم استلام طلب تحقق للرقم ${phoneNumber} بالرمز: ${otpCode}`);

  const storedOtp = otpStore[phoneNumber];

  if (!storedOtp) {
    // لم يتم العثور على رمز OTP لهذا الرقم (لم يتم إنشاؤه أو تم إزالته)
    console.log('فشل التحقق: لم يتم العثور على رمز OTP لهذا الرقم.');
    return res.status(400).json({ success: false, message: 'رمز OTP غير صالح أو منتهي الصلاحية.' });
  }

  // التحقق مما إذا كان رمز OTP قد انتهت صلاحيته
  if (Date.now() > storedOtp.expires) {
    // إزالة رمز OTP المنتهي من المتجر لمنع استخدامه
    delete otpStore[phoneNumber];
    console.log('فشل التحقق: انتهت صلاحية رمز OTP.');
    return res.status(400).json({ success: false, message: 'انتهت صلاحية رمز OTP.' });
  }

  // التحقق مما إذا كان رمز OTP المقدم يطابق الرمز المخزن
  if (otpCode === storedOtp.code) {
    // رمز OTP صالح، إزالته من المتجر لمنع إعادة الاستخدام
    delete otpStore[phoneNumber];
    console.log('تم التحقق بنجاح.');
    return res.status(200).json({ success: true, message: 'تم التحقق من رمز OTP بنجاح!' });
  } else {
    // رمز OTP لا يتطابق
    console.log('فشل التحقق: رمز OTP غير صحيح.');
    return res.status(400).json({ success: false, message: 'رمز OTP غير صحيح.' });
  }
});

// نقطة نهاية لتسجيل المستخدمين الجدد باستخدام الاسم وكلمة المرور في Firestore
// **تم تعديل هذه النقطة لتستقبل 'name' و 'password' وتستخدم Firestore وتجزئة كلمة المرور**
app.post('/api/register', async (req, res) => {
  // استخلاص الاسم وكلمة المرور من جسم الطلب
  const { name, password } = req.body;
  console.log('Received registration request:');
  console.log(`Name: ${name}, Password: [HIDDEN]`); // إخفاء كلمة المرور في السجل لأسباب أمنية

  // التحقق من صحة المدخلات (الاسم وكلمة المرور)
  if (!name || !password) {
    return res.status(400).json({ success: false, message: 'الاسم وكلمة المرور مطلوبان.' });
  }

  if (password.length < 6) { // توصية: كلمة المرور يجب أن تكون 6 أحرف على الأقل
    return res.status(400).json({ success: false, message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.' });
  }

  try {
    // التحقق مما إذا كان اسم المستخدم موجودًا بالفعل في Firestore
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('name', '==', name).limit(1).get();

    if (!existingUser.empty) {
      return res.status(409).json({ success: false, message: 'اسم المستخدم هذا مستخدم بالفعل.' });
    }

    // تجزئة كلمة المرور قبل التخزين (Hashing the password before storing)
    // bcrypt.hash يستخدم عملية حسابية معقدة لجعل عكس كلمة المرور مستحيلاً تقريباً
    const hashedPassword = await bcrypt.hash(password, 10); // 10 هو عامل صعوبة الـ salt (كلما زاد الرقم زادت الصعوبة والأمان والوقت)

    // إضافة المستخدم الجديد إلى مجموعة 'users' في Firestore
    const newUserRef = await usersRef.add({
      name: name,
      password: hashedPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp() // تسجيل وقت إنشاء الحساب
    });

    console.log('User registered successfully:', newUserRef.id);
    res.status(201).json({ success: true, message: 'تم تسجيل المستخدم بنجاح!' });
  } catch (error) {
    console.error('خطأ أثناء تسجيل المستخدم:', error);
    res.status(500).json({ success: false, message: 'فشل في تسجيل المستخدم. يرجى المحاولة لاحقاً.' });
  }
});


// نقطة نهاية لتسجيل دخول المستخدم باستخدام الاسم وكلمة المرور من Firestore
app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;
  console.log('Received login request:');
  console.log(`Name: ${name}, Password: [HIDDEN]`); // إخفاء كلمة المرور في السجل

  // التحقق من صحة المدخلات
  if (!name || !password) {
    return res.status(400).json({ success: false, message: 'الاسم وكلمة المرور مطلوبان.' });
  }

  try {
    // البحث عن المستخدم في Firestore بناءً على الاسم
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('name', '==', name).limit(1).get();

    if (userSnapshot.empty) {
      console.log('فشل تسجيل الدخول: لم يتم العثور على المستخدم.');
      return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // مقارنة كلمة المرور المدخلة بكلمة المرور المجزأة المخزنة في Firestore
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // إذا تطابقت كلمة المرور، قم بإنشاء رمز JWT
      const token = jwt.sign(
        { id: userDoc.id, name: user.name }, // الحمولة (payload) التي سيتضمنها الرمز (معلومات المستخدم)
        JWT_SECRET, // المفتاح السري لتوقيع الرمز (يجب أن يكون سرياً جداً!)
        { expiresIn: '1h' } // انتهاء صلاحية الرمز بعد ساعة واحدة
      );

      console.log('تم تسجيل الدخول بنجاح للمستخدم:', name);
      res.status(200).json({ success: true, message: 'تم تسجيل الدخول بنجاح!', token: token });
    } else {
      console.log('فشل تسجيل الدخول: كلمة المرور غير صحيحة.');
      res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }
  } catch (error) {
    console.error('خطأ أثناء تسجيل دخول المستخدم:', error);
    res.status(500).json({ success: false, message: 'فشل في تسجيل الدخول. يرجى المحاولة لاحقاً.' });
  }
});


// برمجية وسيطة (Middleware) للمصادقة باستخدام JWT
// يتم استخدام هذه الدالة لحماية نقاط النهاية التي تتطلب تسجيل دخول المستخدم.
const authenticateToken = (req, res, next) => {
  // استخراج رأس المصادقة (Authorization header)
  const authHeader = req.headers['authorization'];
  // الرمز (token) يكون عادةً على شكل "Bearer YOUR_TOKEN_HERE"
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'مطلوب رمز مصادقة (Token).' }); // لا يوجد رمز، طلب غير مصرح به
  }

  // التحقق من صلاحية الرمز باستخدام المفتاح السري
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('خطأ في التحقق من JWT:', err);
      return res.status(403).json({ message: 'رمز مصادقة غير صالح أو منتهي الصلاحية.' }); // الرمز غير صالح أو انتهت صلاحيته
    }
    req.user = user; // إضافة بيانات المستخدم المستخلصة من الرمز إلى كائن الطلب (req)
    next(); // المتابعة إلى الدالة التالية في المسار (نقطة النهاية المحمية)
  });
};

// مثال على نقطة نهاية محمية (تتطلب رمز JWT صالحاً)
app.get('/api/protected-route', authenticateToken, (req, res) => {
  // إذا وصل الطلب إلى هنا، فهذا يعني أن رمز JWT صالح وأن المستخدم مصادق عليه.
  res.json({ message: `مرحباً بك يا ${req.user.name}! لقد وصلت إلى نقطة نهاية محمية.`, userId: req.user.id });
});


// بدء تشغيل الخادم
app.listen(port, () => {
  console.log(`الخادم يعمل على http://localhost:${port}`);
});
