# 🚀 GitHub Pages එකෙන් Free Publish කරන විදිය — Step by Step

මේක follow කරගෙන ගියොත් විනාඩි 15කින් ඔයාගේ website එක Live වෙනවා, free domain එකක් එක්ක (`yourusername.github.io/ranaweera-family-super`).

---

## ✅ STEP 1 — GitHub Account එකක් හදාගන්න (තියෙනවානම් skip කරන්න)
1. https://github.com/signup වලට යන්න
2. Email, Password, Username එකක් දීලා account එක හදාගන්න
3. Email verify කරගන්න

---

## ✅ STEP 2 — New Repository එකක් හදන්න
1. GitHub login වුණාට පස්සේ, top-right corner එකේ **"+"** icon → **"New repository"** click කරන්න
2. **Repository name**: `ranaweera-family-super` (හෝ ඔයාට කැමති නමක්) දාන්න
3. **Public** තෝරගන්න (GitHub Pages free tier එකට Public repo එකක් ඕනේ)
4. "Add a README file" checkbox එක **untick** කරන්න (අපිට ඕනේම නෑ, files තියෙනවා already)
5. **Create repository** click කරන්න

---

## ✅ STEP 3 — Website Files Upload කරන්න

### පහසුම ක්‍රමය (Browser එකෙන්ම, terminal/git දැනුමක් අවශ්‍ය නැහැ):

1. ඔයාගේ අලුත් repository page එකේ **"uploading an existing file"** කියන link එක click කරන්න
   (Page එක empty නම් මේ link එක දකින්න ලැබෙනවා; නැත්නම් **Add file → Upload files** click කරන්න)
2. මම දුන්න zip file එක **extract/unzip** කරගන්න ඔයාගේ computer එකේ
3. Extract කරාට පස්සේ ඇතුළේ තියෙන **rfs** folder එක open කරන්න — ඒ folder එක **ඇතුළේ** තියෙන සියලුම files/folders (`index.html`, `admin/`, `assets/`, `firestore.rules`, ආදී සියල්ල) select කරගන්න
4. ඒව **සියල්ල එකවර** drag කරලා GitHub upload box එකට දාන්න (folder structure එක automatic preserve වෙනවා)
5. පහළින් **Commit changes** click කරන්න (default message එකම තියාගන්න පුළුවන්)
6. Upload වෙන්න විනාඩි 2-5ක් යන්න පුළුවන් (files ගානක් තියෙන නිසා)

⚠️ **වැදගත්:** `index.html` file එක repository එකේ **root** එකේම (folder එකක් ඇතුළේ නෙවෙයි) තියෙන්න ඕනේ. එහෙම නැත්නම් website එක load වෙන්නේ නෑ.

### Alternative ක්‍රමය (Git දන්නවානම්, වේගවත්):
```bash
cd path/to/extracted/rfs
git init
git add .
git commit -m "Initial website upload"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ranaweera-family-super.git
git push -u origin main
```

---

## ✅ STEP 4 — GitHub Pages Enable කරන්න
1. Repository එකේ top menu එකේ **Settings** tab එකට යන්න
2. left sidebar එකේ **Pages** click කරන්න
3. **"Build and deployment"** යටතේ, **Source** → **Deploy from a branch** තෝරගන්න
4. **Branch**: `main` තෝරගන්න, folder: `/ (root)` තෝරගන්න
5. **Save** click කරන්න
6. විනාඩි 1-2ක් wait කරන්න — page එක refresh කලාම උඩින් කොළ පාටින් **"Your site is live at https://yourusername.github.io/ranaweera-family-super/"** කියලා පෙන්නනවා

🎉 **ඔයාගේ website එක දැන් live!**

---

## ✅ STEP 5 — Firebase Authorized Domains එකට අලුත් domain එක Add කරන්න (අනිවාර්යයි!)

GitHub Pages domain එක (`yourusername.github.io`) Firebase Google Login එකට **authorize** කරන්නම ඕනේ, නැත්නම් Google Login වැඩ කරන්නේ නෑ:

1. https://console.firebase.google.com → `ranaweera-family-super` project එක
2. **Build → Authentication → Settings** tab → **Authorized domains**
3. **Add domain** click කරලා `yourusername.github.io` දාන්න (https:// කොටස නැතුව, domain එක විතරක්)
4. Save කරන්න

---

## ✅ STEP 6 — Firebase Console Setup (මේක නැතුව site එක data save/load කරන්නේ නෑ)

මේ steps ටික `SETUP_GUIDE.md` file එකේ විස්තරාත්මකව තියෙනවා, ඒත් quick summary එකක්:

1. **Authentication → Sign-in method** → Google enable කරන්න
2. **Firestore Database → Create Database** → Production mode → ළඟම location එක තෝරගන්න
3. **Firestore Database → Rules** → `firestore.rules` file එකේ content එක copy-paste කරලා **Publish**
4. Cloudinary console එකේ `RanaweraFamilySuper` upload preset එක **Unsigned** mode කියලා confirm කරගන්න

---

## 🔄 ඉදිරියට Website එක Update කරන්න ඕනේනම්

Code එකට වෙනසක් (අලුත් feature, bug fix) ඕනේනම්:
1. GitHub repository එකේ වෙනස් කරන්න ඕනේ file එක click කරන්න
2. Pencil ✏️ icon (Edit) click කරන්න
3. වෙනස් කරලා, පහළින් **Commit changes**
4. විනාඩි 1ක් ඇතුළත GitHub Pages automatic redeploy වෙනවා — දැනට ඔයා admin panel එකෙන් කරන settings/products වෙනස්කම් ඒවට අදාළ නෑ (ඒව Firebase database එකේ instant update වෙනවා, GitHub deploy කරන්න ඕනේ නෑ). GitHub re-upload කරන්න ඕනේ code (HTML/CSS/JS) file වෙනස් උනොත් විතරයි.

---

## ❓ Realtime Sync ගැන — දැන් Guarantee කරපු දේවල්

✅ Admin Panel එකෙන් **Product** එකක් add/edit/delete කලාම → Home page, Products page, Product detail page **සියල්ලටම** instant update (refresh ඕනේ නෑ)
✅ **Price/Stock** වෙනස් කලාම → Customer browse කරන අතරතුරේම price/stock screen එකේ update වෙනවා
✅ **Categories** add/edit කලාම → Homepage/Products page instant update
✅ **Site Settings** (Logo, Contact, Theme Colors, WhatsApp Number, Banners) වෙනස් කලාම → සියලුම pages instant update
✅ **Orders** customer කෙනෙක් දැම්මොත් → Admin Dashboard එකට instant notification + sound alert
✅ **Reviews** admin approve කලාම → Product page එකේ instant පෙන්නනවා

---

දෙයක් hadhuwoth (bug/error), screenshot එක දාල මට කියන්න — fix කරන්නම්! 🙏
