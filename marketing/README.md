# مواد تسويقية — مطعم m63m.my

| الملف | الوصف |
|---|---|
| `m63m-brochure.pdf` | الكتيّب التعريفي للعملاء، A4، 6 صفحات |
| `m63m-presentation.pptx` | العرض التقديمي، 16:9، 12 شريحة مع ملاحظات المتحدث، خط Tajawal مضمّن |
| `logo/` | الشعار PNG شفاف: على خلفية داكنة، على خلفية فاتحة، والرمز وحده |
| `assets/` | لقطات شاشة الموقع (بيانات تجريبية بأسماء وهمية) |

## إعادة التوليد (`source/`)
على Windows مع Edge وPowerPoint والموقع المحلي يعمل على المنفذ 3000:
```bash
cd marketing/source && npm install
node demo-data.js         # تنظيف بيانات الاختبار المحلية وإضافة حجوزات تجريبية (قاعدة محلية فقط)
node shots.js             # لقطات الشاشة
node make-logo.js         # الشعار
node build-brochure.js    # PDF
node build-deck.js        # PPTX (يتطلب سكربت apply_theme من مهارة pptx)
cscript //nologo ppt.vbs "<المسار الكامل للـ pptx>" "<مجلد للصور>"   # تضمين الخط + صور الشرائح
```
الخطوط: Alexandria وTajawal (رخصة SIL OFL).
