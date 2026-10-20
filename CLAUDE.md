# CLAUDE.md — m63m.my

اقرأ أولاً: `PROJECT_LOG.md` (سجل كل تعديل) و `docs/REQUIREMENTS.md` (المتطلبات والقرارات).

## قواعد المشروع
- كل تعديل أو تعليمات جديدة تُسجَّل في `PROJECT_LOG.md` (التاريخ + ماذا + لماذا).
- الواجهة عربية RTL؛ أيقونات SVG خطية من `src/utils/icons.js` فقط — **لا إيموجي أبداً**.
- لا سكربتات أو `style=""` مضمّنة في القوالب: CSP يمنعها. كل JS في `public/js/app.js` وكل CSS في `public/css/app.css`.
- الألوان والخطوط من متغيرات `:root` في `app.css` — لا قيم ألوان جديدة خارجها.
- كل مدخل API يمر عبر مخطط zod في `src/validators` + `validate()`؛ الأخطاء عبر `AppError`.
- منطق الأعمال في `src/services`؛ المتحكمات رفيعة.
- الأرقام والتواريخ عبر مساعدات `src/utils/viewHelpers.js` (توقيت الرياض، أرقام لاتينية). لا تضع `class="num"` على نص يحوي حروفاً عربية (يقلب الاتجاه).

## التحقق
- `npm test` (لا يحتاج قاعدة بيانات).
- التحقق البصري: لقطات Edge headless؛ للعرض الحقيقي 390px استخدم iframe لأن Edge headless لا ينزل عن ~500px.
