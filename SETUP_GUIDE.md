# 🛒 Ranaweera Family Super — Setup Guide (අවශ්‍යයෙන්ම කියවන්න)

ඔයාගේ website එක සම්පූර්ණයෙන්ම code කරලා ඉවරයි. ඒත් **මේ steps follow නොකරම website එක Live කරොත් වැඩ කරන්නේ නෑ** — Firebase Console එකේ පොඩි setup එකක් අනිවාර්යයෙන් කරගන්න ඕනේ. මේක එක පාරක් කරගත්තාම ඉවරයි.

---

## ✅ STEP 1 — Firebase Console Setup (අනිවාර්යයි)

### 1.1 — Google Sign-In Enable කරන්න
1. https://console.firebase.google.com → ඔයාගේ `ranaweera-family-super` project එක open කරන්න
2. **Build → Authentication → Sign-in method** වලට යන්න
3. **Google** provider එක enable කරන්න (toggle on, Save)

### 1.2 — Firestore Database එක Create කරන්න
1. **Build → Firestore Database → Create Database**
2. **Production mode** තෝරගන්න
3. ළඟම location එකක් (e.g. `asia-south1` හෝ `asia-southeast1`) තෝරගන්න

### 1.3 — Security Rules Deploy කරන්න (⚠️ ඉතාම වැදගත්)
මේ නැතුව site එකේ data save/load වෙන්නේ නෑ:
1. **Firestore Database → Rules** tab එකට යන්න
2. මම දීලා තියෙන `firestore.rules` file එකේ content එක copy කරලා, Firebase Console එකේ rules editor එකට paste කරන්න
3. **Publish** click කරන්න

### 1.4 — Indexes Deploy කරන්න
Site එක use කරද්දී "The query requires an index" කියලා error එකක් console එකේ පෙන්නන්න පුළුවන් (products/orders filter+sort queries වලට Firestore composite index ඕනේ). දෙයාකාරයකින් මේක fix කරගන්න පුළුවන්:

- **පහසු ක්‍රමය:** Console එකේ error එක click කරාම Firebase auto-generate කරන link එකක් එනවා → ඒක click කරලා "Create Index" කරන්න. (Site use කරද්දී organic විදිහට මේවා popup වෙයි, එක එක click කරගෙන යන්න.)
- **Advanced ක්‍රමය:** `firebase-tools` CLI install කරලා, මම දීපු `firestore.indexes.json` file එක use කරලා `firebase deploy --only firestore:indexes` කරන්න.

---

## ✅ STEP 2 — Cloudinary Setup Confirm කරන්න

ඔයා දීපු Upload Preset (`RanaweraFamilySuper`) **Unsigned** mode එකේ තියෙනවද කියලා check කරන්න:
1. https://cloudinary.com/console → Settings → Upload
2. **Upload presets** list එකේ `RanaweraFamilySuper` find කරගන්න
3. ඒක **Unsigned** කියලා තියෙනවද බලන්න (Signing Mode = Unsigned). නැත්නම් image upload වැඩ කරන්නේ නෑ.

---

## ✅ STEP 3 — Website Hosting කරන්න

### විකල්පය A — Firebase Hosting (Recommended, Free)
```bash
npm install -g firebase-tools
firebase login
cd path/to/this/project/folder
firebase init hosting     # public directory: . (current folder), single-page app: No
firebase deploy
```

### විකල්පය B — වෙන hosting service එකක් (Netlify, Vercel, cPanel, etc.)
මේ project එක **pure static HTML/CSS/JS** — special build step එකක් අවශ්‍ය නෑ. මුළු folder එකම (assets/, admin/, index.html ආදී සියල්ල) upload කරන්න විතරයි ඇති.

⚠️ **වැදගත්:** Google Login වැඩ කරන්න ඕනේනම්, ඔයාගේ domain එක (e.g. `ranaweerafamilysuper.com` හෝ `your-site.netlify.app`) Firebase Console → Authentication → Settings → **Authorized domains** ලිස්ට් එකට add කරගන්න ඕනේ.

---

## ✅ STEP 4 — පළවෙනි පාර Admin Panel එකට Login වෙන්න

1. `yourdomain.com/admin/login.html` වලට යන්න
2. Username: `Ranaweera@2026`
3. Password: `Ranaweera@2026`
4. Login වුණාට පස්සේ **Settings → General Settings** වලට ගිහින් Phone, Email, Address, WhatsApp Number මුලින්ම update කරගන්න
5. **Categories** add කරගන්න (Products වලට කලින්!)
6. **Products** එකින් එක manually add කරගන්න (6000+ products — Bulk Excel import නෑ කියලා ඔයා කිව්ව විදිහටම, manual add විතරයි)

---

## 📌 වැදගත් සටහන් (Important Notes)

### WhatsApp Notification ගැන
- Admin Dashboard එකට order ආවාම **100% automatic real-time** notification + sound alert එනවා (browser tab open කරගෙන ඉන්න ඕනේ).
- WhatsApp එකට message යවන්න admin "💬 Send WhatsApp" button එක click කරන්න ඕනේ — මේක pre-filled message එකක් සමඟ WhatsApp Web/App open කරනවා, එතනින් **Send** කරන්න ඕනේ.
- සම්පූර්ණයෙන්ම click-free automatic WhatsApp messages ඕනේනම්, Meta ලගේ **WhatsApp Business Cloud API** account එකක් හදලා credentials ලබාගන්න ඕනේ (Free tier තියෙනවා). ඒව ලැබුණාට මට කියන්න, ඒක system එකට add කරන්නම්.

### Security ගැන (ඇත්තටම වැදගත්)
ඔයා admin login එක "username/password" විදිහට (Firebase Auth නැතුව) ඉල්ලුවා නිසා, Firestore rules වලට admin/product/order write access සියලු දෙනාටම open කරලා තියෙන්නේ (admin panel UI එකෙන් විතරක් gate කරලා). මේකෙන් අදහස් වෙන්නේ, theoretically, technical දැනුමක් තියෙන කෙනෙක්ට browser console එකෙන් කෙලින්ම Firestore එකට write කරන්න පුළුවන් කියන එක. සාමාන්‍ය customer කෙනෙක්ට මේක කරන්න බැහැ (ඒකට coding දැනුම ඕනේ), ඒත් production-grade ඉතාම strict security එකක් ඕනේනම්, අනාගතයේදී admin login එක Firebase Authentication + Custom Claims වලට මාරු කරන එක recommend කරනවා — ඒක කරන්න ඕනේනම් කියන්න, මම ඒකත් upgrade කරන්නම්.

### Firestore Indexes ගැන
Site use කරද්දී (products filter, orders filter) browser console එකේ "FAILED_PRECONDITION: The query requires an index" වගේ error එකක් පෙන්නන්න පුළුවන් මුල් වතාවට. මේක bug එකක් නෙවෙයි — Firestore එකේ සාමාන්‍ය behavior එකක්. console එකේ එන error message එකේ තියෙන link එක click කලාම, ඒකෙන් auto-create වෙනවා (~2-3 minutes ගතවෙයි build වෙන්න).

---

## 🗂️ Project Structure

```
/index.html, products.html, product.html, cart.html, checkout.html...   ← Customer pages
/admin/                                                                   ← Admin Panel pages
/assets/css/style.css                                                    ← Main theme styles
/assets/css/admin.css                                                    ← Admin panel styles
/assets/js/                                                               ← Core logic (Firebase, Cart, Orders, etc.)
/assets/js/admin/                                                         ← Admin-only logic
/assets/images/logo.jpg                                                  ← Your logo
/firestore.rules                                                         ← Deploy to Firebase Console
/firestore.indexes.json                                                  ← Optional CLI deploy
```

දෙයක් hardha unoth (bug/error), ඒ screenshot එක එක්ක මට කියන්න — මම ඒක fix කරන්නම්! 🙏
