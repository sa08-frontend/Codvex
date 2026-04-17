/**
 * ╔══════════════════════════════════════════════════════╗
 * ║         CODVEX – Idea Submission Backend             ║
 * ║   Node.js + Express + MongoDB + Nodemailer           ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * SETUP:
 *   npm install express mongoose nodemailer cors dotenv
 *
 * .env file (create in project root):
 *   PORT=5000
 *   MONGO_URI=mongodb://localhost:27017/codvex
 *   EMAIL_USER=your@gmail.com
 *   EMAIL_PASS=your_app_password      ← Gmail App Password
 *   CODVEX_EMAIL=team@codvex.in       ← receives all submissions
 *   CODVEX_WA=919876543210            ← WhatsApp number (no + or spaces)
 *
 * RUN:
 *   node server.js            (production)
 *   nodemon server.js         (development – install: npm i -D nodemon)
 *
 * ADMIN PANEL ROUTES:
 *   GET /admin/submissions    → list all ideas
 *   GET /admin/submissions/:id → single idea
 *   PATCH /admin/submissions/:id/status → update status
 */

require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ──────────────────── MIDDLEWARE ──────────────────── */
app.use(cors({ origin: '*' }));          // Restrict to your domain in production
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));  // Serve HTML files

/* ──────────────────── MONGO CONNECTION ──────────────────── */
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codvex')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

/* ──────────────────── PRICING CONFIG ──────────────────── */
const PRICING = {
    basic:        { label: 'Basic',        range: '₹7,500 – ₹10,000',  min: 7500,  max: 10000 },
    advance:      { label: 'Advance',      range: '₹12,000 – ₹20,000', min: 12000, max: 20000 },
    professional: { label: 'Professional', range: '₹25,000 – ₹50,000', min: 25000, max: 50000 },
};

/* ──────────────────── MONGOOSE SCHEMA ──────────────────── */
const IdeaSchema = new mongoose.Schema({
    submissionId:    { type: String, unique: true, required: true },

    // Contact
    name:            { type: String, required: true, trim: true },
    email:           { type: String, required: true, trim: true, lowercase: true },
    phone:           { type: String, required: true, trim: true },

    // Project
    websiteName:     { type: String, required: true, trim: true },
    category:        { type: String, required: true },
    description:     { type: String, required: true },
    targetAudience:  { type: String, required: true },
    referenceLinks:  { type: String, default: '' },

    // Plan & Pricing
    projectType:     { type: String, enum: ['basic', 'advance', 'professional'], required: true },
    planLabel:       { type: String },
    priceRange:      { type: String },
    priceMin:        { type: Number },
    priceMax:        { type: Number },

    // Status (for admin)
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'approved', 'rejected'],
        default: 'pending',
    },
    adminNotes:      { type: String, default: '' },

    // Metadata
    createdAt:       { type: Date, default: Date.now },
    updatedAt:       { type: Date, default: Date.now },
    ipAddress:       { type: String },
    userAgent:       { type: String },
});

IdeaSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Idea = mongoose.model('Idea', IdeaSchema);

/* ──────────────────── EMAIL TRANSPORTER ──────────────────── */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,  // Use Gmail App Password, not account password
    },
});

/* ── Email helper ── */
async function sendEmails(idea) {
    const pd = PRICING[idea.projectType];

    /* 1) Confirmation email to the submitter */
    const userHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f5f4ff;margin:0;padding:20px;}
  .wrap{max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.1);}
  .header{background:linear-gradient(135deg,#7c5cfc,#00e5c8);padding:40px 32px;text-align:center;}
  .header h1{color:#fff;font-size:1.8rem;margin:0;letter-spacing:-0.03em;}
  .header p{color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:0.95rem;}
  .body{padding:32px;}
  .greeting{font-size:1.1rem;margin-bottom:20px;}
  .greeting b{color:#7c5cfc;}
  .price-box{background:linear-gradient(135deg,#7c5cfc,#00e5c8);border-radius:12px;padding:24px;text-align:center;margin:24px 0;}
  .price-box .pl{color:rgba(255,255,255,0.8);font-size:0.85rem;margin-bottom:4px;}
  .price-box .pv{color:#fff;font-size:1.8rem;font-weight:800;}
  .details-table{width:100%;border-collapse:collapse;margin:20px 0;}
  .details-table td{padding:10px 14px;font-size:0.9rem;border-bottom:1px solid #f0eeff;}
  .details-table td:first-child{color:#888;font-weight:500;white-space:nowrap;}
  .details-table td:last-child{color:#111;font-weight:500;}
  .steps{background:#f8f7ff;border-radius:12px;padding:20px 24px;margin:20px 0;}
  .steps h3{font-size:0.9rem;color:#7c5cfc;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;}
  .step-item{display:flex;gap:12px;margin-bottom:12px;font-size:0.88rem;color:#555;align-items:flex-start;}
  .step-item:last-child{margin-bottom:0;}
  .si{flex-shrink:0;font-size:1.1rem;}
  .footer{background:#f8f7ff;padding:20px 32px;text-align:center;font-size:0.8rem;color:#888;}
  .footer a{color:#7c5cfc;text-decoration:none;}
  .sid{font-family:monospace;background:#ede9ff;padding:3px 8px;border-radius:4px;color:#7c5cfc;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>⚡ Codvex</h1>
    <p>Your idea has been received!</p>
  </div>
  <div class="body">
    <p class="greeting">Hey, <b>${idea.name.split(' ')[0]}</b>! 👋</p>
    <p style="color:#555;line-height:1.65;">
      Thank you for submitting your website idea to Codvex. We've received everything and our team will carefully review your project.
    </p>
    <div class="price-box">
      <div class="pl">💰 Estimated Price Range · ${pd.label} Plan</div>
      <div class="pv">${pd.range}</div>
    </div>
    <table class="details-table">
      <tr><td>Project Name</td><td>${idea.websiteName}</td></tr>
      <tr><td>Category</td><td>${idea.category}</td></tr>
      <tr><td>Plan</td><td>${pd.label}</td></tr>
      <tr><td>Submission ID</td><td><span class="sid">${idea.submissionId}</span></td></tr>
    </table>
    <div class="steps">
      <h3>What Happens Next?</h3>
      <div class="step-item"><span class="si">📋</span><span>Our team reviews your idea within <b>5–7 business days</b>.</span></div>
      <div class="step-item"><span class="si">✅</span><span>If approved, <b>Sayed, Umair or Aman</b> will contact you to discuss next steps.</span></div>
      <div class="step-item"><span class="si">🚀</span><span>We build and deploy your website <b>completely free</b> — you keep 80% of revenue.</span></div>
    </div>
    <p style="color:#555;font-size:0.88rem;line-height:1.65;">
      Questions? Reply to this email or WhatsApp us at +91 XXXXX XXXXX.
    </p>
  </div>
  <div class="footer">
    <p>© 2025 <a href="#">Codvex</a> · Built by Sayed Shoaib, Umair Shaikh & Aman Shaikh</p>
    <p style="margin-top:6px;">You're receiving this because you submitted an idea at codvex.in</p>
  </div>
</div>
</body>
</html>`;

    /* 2) Admin notification email */
    const adminHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f5f4ff;margin:0;padding:20px;}
  .wrap{max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;}
  .header{background:#7c5cfc;padding:24px 28px;color:#fff;}
  .header h1{margin:0;font-size:1.3rem;}
  .header .badge{display:inline-block;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:20px;font-size:0.78rem;margin-top:8px;}
  .body{padding:28px;}
  .row{display:flex;gap:8px;margin-bottom:10px;font-size:0.9rem;border-bottom:1px solid #f0eeff;padding-bottom:10px;}
  .rk{color:#888;min-width:130px;flex-shrink:0;}
  .rv{color:#111;font-weight:500;}
  .desc-box{background:#f8f7ff;border-radius:8px;padding:16px;font-size:0.88rem;color:#333;line-height:1.6;margin:16px 0;}
  .price-pill{display:inline-block;background:linear-gradient(135deg,#7c5cfc,#00e5c8);color:#fff;padding:5px 14px;border-radius:20px;font-weight:700;font-size:0.9rem;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>🔔 New Idea Submission</h1>
    <div class="badge">${idea.submissionId}</div>
  </div>
  <div class="body">
    <div class="row"><span class="rk">Name</span><span class="rv">${idea.name}</span></div>
    <div class="row"><span class="rk">Email</span><span class="rv">${idea.email}</span></div>
    <div class="row"><span class="rk">Phone / WhatsApp</span><span class="rv">${idea.phone}</span></div>
    <div class="row"><span class="rk">Project Name</span><span class="rv">${idea.websiteName}</span></div>
    <div class="row"><span class="rk">Category</span><span class="rv">${idea.category}</span></div>
    <div class="row"><span class="rk">Plan</span><span class="rv">${pd.label} &nbsp;<span class="price-pill">${pd.range}</span></span></div>
    <div class="row"><span class="rk">Target Audience</span><span class="rv">${idea.targetAudience}</span></div>
    <p style="font-weight:600;margin:16px 0 6px;">Project Description</p>
    <div class="desc-box">${idea.description}</div>
    ${idea.referenceLinks ? `<div class="row"><span class="rk">Reference Links</span><span class="rv">${idea.referenceLinks}</span></div>` : ''}
  </div>
</div>
</body>
</html>`;

    // Send both in parallel
    await Promise.allSettled([
        transporter.sendMail({
            from:    `"Codvex Team" <${process.env.EMAIL_USER}>`,
            to:      idea.email,
            subject: `✅ [Codvex] Idea received — ${idea.websiteName}`,
            html:    userHtml,
        }),
        transporter.sendMail({
            from:    `"Codvex Submissions" <${process.env.EMAIL_USER}>`,
            to:      process.env.CODVEX_EMAIL || process.env.EMAIL_USER,
            subject: `🔔 New Idea: ${idea.websiteName} (${pd.label}) — ${idea.submissionId}`,
            html:    adminHtml,
        }),
    ]);
}

/* ──────────────────── API ROUTES ──────────────────── */

/**
 * POST /api/submit-idea
 * Main submission endpoint
 */
app.post('/api/submit-idea', async (req, res) => {
    try {
        const {
            name, email, phone, websiteName, category,
            description, targetAudience, referenceLinks,
            plan, submissionId,
        } = req.body;

        /* ── Validate required fields ── */
        const required = { name, email, phone, websiteName, category, description, targetAudience, plan };
        const missing  = Object.entries(required).filter(([, v]) => !v?.trim()).map(([k]) => k);
        if (missing.length) {
            return res.status(400).json({ success: false, message: `Missing: ${missing.join(', ')}` });
        }

        /* ── Validate plan ── */
        if (!PRICING[plan]) {
            return res.status(400).json({ success: false, message: 'Invalid project type.' });
        }

        /* ── Validate email ── */
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address.' });
        }

        const pd = PRICING[plan];
        const sid = submissionId || 'CVX-' + Date.now().toString(36).toUpperCase();

        /* ── Save to MongoDB ── */
        const idea = new Idea({
            submissionId: sid,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            websiteName: websiteName.trim(),
            category: category.trim(),
            description: description.trim(),
            targetAudience: targetAudience.trim(),
            referenceLinks: (referenceLinks || '').trim(),
            projectType: plan,
            planLabel:   pd.label,
            priceRange:  pd.range,
            priceMin:    pd.min,
            priceMax:    pd.max,
            ipAddress: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
        });

        await idea.save();
        console.log(`✅ Saved idea: ${sid} — ${name} (${pd.label})`);

        /* ── Send emails (non-blocking) ── */
        sendEmails(idea).catch(err => console.error('Email error:', err.message));

        /* ── Build WhatsApp URL for the user ── */
        const phoneDigits = phone.replace(/\D/g, '');
        const waPhone = phoneDigits.startsWith('0') ? '91' + phoneDigits.slice(1) : phoneDigits;
        const waMsg   = buildWAMessage({ name, websiteName, category, description, targetAudience, plan: pd, submissionId: sid });
        const waUrl   = `https://wa.me/${process.env.CODVEX_WA || '919876543210'}?text=${encodeURIComponent(waMsg)}`;

        return res.status(201).json({
            success: true,
            submissionId: sid,
            priceRange:   pd.range,
            planLabel:    pd.label,
            whatsappUrl:  waUrl,
            message:      `Thank you ${name}! Your ${pd.label} project estimate is ${pd.range}. Our team will contact you shortly.`,
        });

    } catch (err) {
        console.error('Submit error:', err);
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'Duplicate submission ID.' });
        }
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

/* ──────────────────── ADMIN ROUTES ──────────────────── */

/**
 * GET /admin/submissions
 * Query params: page, limit, status, search
 */
app.get('/admin/submissions', async (req, res) => {
    try {
        const {
            page   = 1,
            limit  = 20,
            status,
            search,
            plan,
        } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (plan)   filter.projectType = plan;
        if (search) {
            filter.$or = [
                { name:        { $regex: search, $options: 'i' } },
                { email:       { $regex: search, $options: 'i' } },
                { websiteName: { $regex: search, $options: 'i' } },
                { submissionId:{ $regex: search, $options: 'i' } },
            ];
        }

        const total = await Idea.countDocuments(filter);
        const ideas = await Idea.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-__v');

        // Stats summary
        const stats = await Idea.aggregate([
            { $group: { _id: '$status',      count: { $sum: 1 } } },
        ]);
        const planStats = await Idea.aggregate([
            { $group: { _id: '$projectType', count: { $sum: 1 } } },
        ]);

        res.json({
            success: true,
            total,
            page:    parseInt(page),
            pages:   Math.ceil(total / limit),
            stats:   stats.reduce((a, s) => ({ ...a, [s._id]: s.count }), {}),
            planStats: planStats.reduce((a, s) => ({ ...a, [s._id]: s.count }), {}),
            data:    ideas,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /admin/submissions/:id
 */
app.get('/admin/submissions/:id', async (req, res) => {
    try {
        const idea = await Idea.findOne({
            $or: [{ _id: req.params.id }, { submissionId: req.params.id }]
        });
        if (!idea) return res.status(404).json({ success: false, message: 'Not found.' });
        res.json({ success: true, data: idea });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * PATCH /admin/submissions/:id/status
 * Body: { status: 'approved' | 'rejected' | 'reviewing', adminNotes: '...' }
 */
app.patch('/admin/submissions/:id/status', async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const validStatuses = ['pending', 'reviewing', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }
        const idea = await Idea.findOneAndUpdate(
            { $or: [{ _id: req.params.id }, { submissionId: req.params.id }] },
            { status, adminNotes: adminNotes || '', updatedAt: new Date() },
            { new: true }
        );
        if (!idea) return res.status(404).json({ success: false, message: 'Not found.' });
        res.json({ success: true, data: idea, message: `Status updated to "${status}".` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * DELETE /admin/submissions/:id  (soft-delete via status)
 */
app.delete('/admin/submissions/:id', async (req, res) => {
    try {
        const idea = await Idea.findOneAndDelete(
            { $or: [{ _id: req.params.id }, { submissionId: req.params.id }] }
        );
        if (!idea) return res.status(404).json({ success: false, message: 'Not found.' });
        res.json({ success: true, message: 'Submission deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ──────────────────── PRICING HELPER ──────────────────── */
function buildWAMessage({ name, websiteName, category, description, targetAudience, plan, submissionId }) {
    return [
        `👋 *Hello Codvex Team!*`,
        ``,
        `I've just submitted my website idea. Here are the details:`,
        ``,
        `━━━━━━━━━━━━━━━━━━`,
        `👤 *Name:* ${name}`,
        `🌐 *Project:* ${websiteName}`,
        `🏷️ *Category:* ${category}`,
        `📋 *Plan:* ${plan.label}`,
        ``,
        `📝 *Description:*`,
        description.slice(0, 300) + (description.length > 300 ? '…' : ''),
        ``,
        `🎯 *Target Audience:* ${targetAudience.slice(0, 150)}`,
        ``,
        `━━━━━━━━━━━━━━━━━━`,
        `💰 *Price Estimate:* ${plan.range}`,
        `━━━━━━━━━━━━━━━━━━`,
        ``,
        `🆔 ID: ${submissionId}`,
        ``,
        `_Submitted via Codvex.in_`,
    ].join('\n');
}

/* ──────────────────── HEALTH CHECK ──────────────────── */
app.get('/api/health', (req, res) => {
    res.json({
        status:   'ok',
        service:  'Codvex API',
        mongodb:  mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime:   Math.floor(process.uptime()) + 's',
        ts:       new Date().toISOString(),
    });
});

/* ──────────────────── SERVE FRONTEND ──────────────────── */
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'codvex.html')));
app.get('/submit', (req, res) => res.sendFile(path.join(__dirname, 'sumityouridea.html')));

/* ──────────────────── 404 FALLBACK ──────────────────── */
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

/* ──────────────────── START SERVER ──────────────────── */
app.listen(PORT, () => {
    console.log(`\n⚡ Codvex API running on http://localhost:${PORT}`);
    console.log(`   POST /api/submit-idea      — submit idea`);
    console.log(`   GET  /admin/submissions    — list all (add ?status=pending&search=...)`);
    console.log(`   GET  /admin/submissions/:id`);
    console.log(`   PATCH /admin/submissions/:id/status`);
    console.log(`   GET  /api/health\n`);
});
