// Builds the A4 client brochure (HTML -> PDF via Edge) plus PNG previews of every page.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { C, fontFaces, pattern, logo, icon } = require('./brand');

const ROOT = 'C:/Users/abuhe/Desktop/my projects/M63m.my/marketing';
const A = (f) => `file:///${ROOT}/assets/${f}`.replace(/ /g, '%20');
const qr = fs.readFileSync(path.join(__dirname, 'qr.svg'), 'utf8');
const URL_TEXT = 'm63m-my.vercel.app';

const footer = (n) => `<footer class="pf"><div>${logo(22, 'light')}</div><span class="num">${URL_TEXT}</span><span class="pn num">${String(n).padStart(2, '0')}</span></footer>`;
const ic = (name, cls = '') => icon(name, cls);

const css = `${fontFaces}
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:Tajawal,sans-serif;color:${C.ink};-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;background:${C.alabaster}}
.page:last-child{page-break-after:auto}
.dark{background:${C.roast900};color:#efe9df}
.pat{position:absolute;inset:0;background-image:${pattern(0.18)};background-size:48px 28px}
.glow{position:absolute;inset:0;background:radial-gradient(600px 380px at 85% -5%,rgba(197,160,89,.28),transparent 60%),radial-gradient(520px 360px at 0% 105%,rgba(158,71,60,.22),transparent 60%)}
.in{position:relative;padding:18mm 16mm 0}
h1,h2,h3{font-family:Alexandria,sans-serif;margin:0;letter-spacing:-.01em}
h2{font-size:30px;font-weight:700;color:${C.roast900};line-height:1.3}
h3{font-size:15px;font-weight:600;color:${C.roast900}}
p{margin:0;line-height:1.75}
.kicker{display:inline-flex;align-items:center;gap:10px;font-size:11.5px;font-weight:700;color:${C.gold700};letter-spacing:.03em;margin-bottom:8px}
.kicker:before{content:'';width:24px;height:1px;background:currentColor}
.dark .kicker{color:${C.gold400}}
.lead{font-size:14px;color:${C.inkSoft};margin-top:10px;max-width:150mm}
.num{direction:ltr;unicode-bidi:isolate;font-feature-settings:'tnum'}
.icon{width:1.2em;height:1.2em;flex-shrink:0}
.tile{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:${C.gold50};color:${C.gold700};border:1px solid ${C.gold100};flex-shrink:0}
.tile .icon{width:22px;height:22px}
.tile.dk{background:${C.roast900};color:${C.gold400};border-color:${C.roast900}}
.card{background:#fff;border:1px solid ${C.line};border-radius:14px;padding:16px;box-shadow:0 4px 20px rgba(27,24,22,.05)}
.shot{border-radius:14px;overflow:hidden;border:1px solid ${C.line};box-shadow:0 22px 50px -20px rgba(27,24,22,.35);background:#fff}
.shot img{display:block;width:100%}
.shot.crop img{height:96mm;object-fit:cover;object-position:top}
.browser{background:${C.roast800};padding:8px 12px;display:flex;gap:6px;align-items:center}
.browser i{width:8px;height:8px;border-radius:50%;background:#4a4440;display:block}
.browser span{margin-inline-start:auto;font-size:9px;color:${C.roast300};direction:ltr}
.soon{display:inline-block;font-size:9.5px;font-weight:700;padding:2px 8px;border-radius:99px;background:${C.gold100};color:${C.gold700};margin-inline-start:6px;vertical-align:middle}
.pf{position:absolute;left:16mm;right:16mm;bottom:9mm;display:flex;align-items:center;gap:14px;font-size:10px;color:${C.inkSoft};border-top:1px solid ${C.line};padding-top:8px}
.pf .num:first-of-type{margin-inline-start:auto}
.pf .pn{font-family:Alexandria;font-weight:600;color:${C.roast900}}
.pf .logo{transform:scale(.9);transform-origin:right center}
/* cover */
.cover .in{padding-top:16mm;height:100%;display:flex;flex-direction:column}
.cover h1{font-size:50px;line-height:1.2;font-weight:700;color:#fff;margin-top:22mm}
.cover h1 em{font-style:normal;color:${C.gold500}}
.cover .lead{color:#cbc1b5;font-size:15px;max-width:140mm}
.cover .shotwrap img{height:92mm;object-fit:cover;object-position:top}
.cover .shotwrap{margin-top:12mm;transform:perspective(1400px) rotateX(4deg);transform-origin:bottom}
.pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:8mm}
.pill{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:99px;border:1px solid rgba(197,160,89,.35);color:#efe9df;font-size:12px;font-weight:500;background:rgba(255,255,255,.04)}
.pill .icon{color:${C.gold400}}
.cover .bottom{margin-top:auto;padding-bottom:12mm;display:flex;justify-content:space-between;align-items:flex-end;color:${C.roast300};font-size:11px}
.eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:700;color:${C.gold400};margin-top:16mm}
.eyebrow:before{content:'';width:28px;height:1px;background:currentColor}
/* grids */
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.g2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.svc{display:flex;flex-direction:column;gap:10px}
.svc p{font-size:12px;color:${C.inkSoft};line-height:1.7}
.role{display:flex;gap:12px;align-items:flex-start}
.role p{font-size:11.5px;color:${C.inkSoft};line-height:1.65;margin-top:3px}
.band{margin-top:9mm;border-radius:16px;background:${C.roast900};color:#efe9df;position:relative;overflow:hidden;padding:16px 20px;display:grid;grid-template-columns:repeat(3,1fr)}
.band>div:not(.pat){position:relative;padding:4px 14px}
.band>div:not(.pat)+div{border-inline-start:1px solid rgba(255,255,255,.1)}
.band b{display:block;font-family:Alexandria;font-size:26px;font-weight:600;color:${C.gold400}}
.band span{font-size:11.5px;color:#cbc1b5}
.sec{margin-top:8mm}
.sec>h3{margin-bottom:10px;font-size:16px}
.cat{display:flex;flex-direction:column;gap:8px;padding:14px}
.cat p{font-size:11px;color:${C.inkSoft};line-height:1.6}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;counter-reset:s}
.step{position:relative;padding:14px 14px 14px;border-radius:14px;background:#fff;border:1px solid ${C.line}}
.step:before{counter-increment:s;content:counter(s);position:absolute;top:12px;left:14px;font-family:Alexandria;font-size:26px;font-weight:700;color:${C.gold100};line-height:1}
.step b{display:block;font-size:12.5px;color:${C.roast900};margin-bottom:4px}
.step p{font-size:10.8px;color:${C.inkSoft};line-height:1.6}
.vsteps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:0}
.vsteps li{display:flex;gap:12px;position:relative;padding-bottom:12px}
.vsteps li:not(:last-child):after{content:'';position:absolute;right:15px;top:32px;bottom:2px;width:1px;background:${C.line}}
.vsteps .n{width:31px;height:31px;border-radius:10px;background:${C.roast900};color:${C.gold400};display:grid;place-items:center;font-family:Alexandria;font-weight:600;font-size:13px;flex-shrink:0}
.vsteps b{display:block;font-size:12.5px;color:${C.roast900}}
.vsteps p{font-size:11px;color:${C.inkSoft};line-height:1.6}
.callout{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:12px;background:${C.gold50};border:1px solid ${C.gold100};font-size:11.5px;color:${C.roast800}}
.callout .icon{color:${C.gold700};width:20px;height:20px}
.flow{display:flex;align-items:center;gap:8px;margin-top:10px}
.st{flex:1;text-align:center;padding:10px 6px;border-radius:12px;border:1px solid ${C.line};background:#fff}
.st b{display:block;font-family:Alexandria;font-weight:600;font-size:13px;color:${C.roast900}}
.st small{font-size:10px;color:${C.inkSoft}}
.st.ok{border-color:${C.sage};background:#e9f0ec}
.st.no{border-color:${C.terracotta};background:#f6e9e6}
.arrow{color:${C.gold700};display:grid;place-items:center}
.phone{width:50mm;border-radius:30px;padding:7px;background:${C.roast900};box-shadow:0 25px 50px -20px rgba(27,24,22,.5)}
.phone img{width:100%;height:88mm;object-fit:cover;object-position:top;display:block;border-radius:24px}
.check{display:flex;gap:10px;align-items:flex-start;font-size:11.5px;line-height:1.6;color:${C.ink}}
.check .icon{color:${C.sage};width:18px;height:18px;margin-top:2px}
.back .in{height:100%;display:flex;flex-direction:column;padding-top:20mm}
.back h1{font-size:46px;line-height:1.25;color:#fff;font-weight:700;margin-top:48mm}
.back h1 em{font-style:normal;color:${C.gold500}}
.qrbox{background:#fff;border-radius:18px;padding:14px;width:46mm;height:46mm;display:grid;place-items:center}
.qrbox svg{width:100%;height:100%}
.bsteps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22mm}
.bstep{border:1px solid rgba(197,160,89,.25);border-radius:14px;padding:16px;background:rgba(255,255,255,.03)}
.bstep .n{font-family:Alexandria;font-size:28px;font-weight:700;color:${C.gold500};line-height:1}
.bstep b{display:block;color:#fff;font-size:13.5px;margin:10px 0 4px}
.bstep p{font-size:11px;color:#cbc1b5;line-height:1.65}
`;

const browserBar = (url) => `<div class="browser"><i></i><i></i><i></i><span>${url}</span></div>`;

const pages = [];

// 1 — Cover
pages.push(`<section class="page dark cover"><div class="pat"></div><div class="glow"></div><div class="in">
  <div>${logo(56, 'dark')}</div>
  <span class="eyebrow">الدليل التعريفي للمنصة</span>
  <h1>كل ما يحتاجه مطعمك<br>في <em>مكان واحد</em></h1>
  <p class="lead" style="margin-top:14px">منصة سعودية متخصصة تجمع أصحاب المطاعم والمقاهي بالمستشارين الخبراء والموردين والباحثين عن عمل — بروح القنوات المتخصصة التي يتابعها أهل القطاع، لكن منظّمة وقابلة للبحث.</p>
  <div class="pills">
    <span class="pill">${ic('chat')}استشارات الخبراء</span>
    <span class="pill">${ic('chef')}وظائف القطاع</span>
    <span class="pill">${ic('equipment')}معدات وأجهزة</span>
    <span class="pill">${ic('supplies')}موردون ومنتجات</span>
  </div>
  <div class="shotwrap"><div class="shot" style="border-color:#3d3733">${browserBar(URL_TEXT)}<img src="${A('marketplace.png')}"></div></div>
  <div class="bottom"><span>صُنع لقطاع المطاعم والمقاهي في المملكة العربية السعودية</span><span class="num" style="color:${C.gold400};font-size:13px;font-weight:700">${URL_TEXT}</span></div>
</div></section>`);

// 2 — What it is + who it's for
pages.push(`<section class="page"><div class="in">
  <span class="kicker">تعرّف على المنصة</span>
  <h2>منصة واحدة لأهل قطاع المطاعم والمقاهي</h2>
  <p class="lead">«مطعم» تختصر عليك البحث في عشرات القنوات والمجموعات: تحجز استشارتك، وتوظّف طاقمك، وتجد معداتك ومورديك من مكان واحد، وبطريقة منظمة يسهل البحث فيها.</p>
  <div class="g3 sec">
    <div class="card svc"><span class="tile dk">${ic('chat')}</span><h3>استشارات الخبراء</h3><p>احجز جلسة مع مستشار معتمد في التشغيل وتقليل الهدر والتسعير وافتتاح الفروع، مباشرة من جدول مواعيده.</p></div>
    <div class="card svc"><span class="tile dk">${ic('layers')}</span><h3>سوق الطلبات</h3><p>انشر طلبك أو تصفّح طلبات غيرك في أربعة أقسام: الوظائف، المعدات، الموردون، والخدمات المساندة.</p></div>
    <div class="card svc"><span class="tile dk">${ic('share')}</span><h3>انتشار أوسع</h3><p>شارك طلبك بضغطة على X وفيسبوك وواتساب، والنشر التلقائي على حسابات المنصة <span class="soon">قريباً</span></p></div>
  </div>
  <div class="sec">
    <h3>لمن المنصة؟</h3>
    <div class="g2">
      <div class="card role"><span class="tile">${ic('coffee')}</span><div><h3>صاحب المنشأة</h3><p>مالك مطعم أو كافيه أو رائد أعمال: يحجز الاستشارات، وينشر طلبات الموظفين والمعدات والتوريد.</p></div></div>
      <div class="card role"><span class="tile">${ic('chat')}</span><div><h3>المستشار الخبير</h3><p>يعرض مواعيده وأسعاره، ويستقبل الحجوزات ويدير جلساته — بعد اعتماد إدارة المنصة لخبرته.</p></div></div>
      <div class="card role"><span class="tile">${ic('briefcase')}</span><div><h3>المورد والباحث عن عمل</h3><p>يعرض المعدات والمنتجات والخدمات، ويتواصل مع أصحاب الوظائف المعلنة مباشرة.</p></div></div>
      <div class="card role"><span class="tile">${ic('shield')}</span><div><h3>إدارة المنصة</h3><p>تراجع طلبات انضمام المستشارين وتعتمدها، وتراقب جودة المحتوى المنشور.</p></div></div>
    </div>
  </div>
  <div class="band"><div class="pat"></div>
    <div><b class="num">4</b><span>أقسام متخصصة في سوق الطلبات</span></div>
    <div><b class="num">3</b><span>أنواع حسابات، لكل منها لوحة تحكم</span></div>
    <div><b>مجاناً</b><span>التسجيل والتصفح ونشر الطلبات</span></div>
  </div>
</div>${footer(2)}</section>`);

// 3 — Marketplace
pages.push(`<section class="page"><div class="in">
  <span class="kicker">سوق الطلبات</span>
  <h2>انشر طلبك في دقيقة، ويصل لأهل القطاع</h2>
  <p class="lead">كل طلب يُنشر في قسمه المتخصص، مع حقول تناسبه: الراتب والخبرة للوظائف، والحالة والعلامة التجارية للمعدات، والحد الأدنى للطلب عند الموردين.</p>
  <div class="g4 sec">
    <div class="card cat"><span class="tile">${ic('chef')}</span><h3>الوظائف</h3><p>طهاة، باريستا، مدراء فروع وطاقم خدمة</p></div>
    <div class="card cat"><span class="tile">${ic('equipment')}</span><h3>الأجهزة والمعدات</h3><p>معدات مطابخ، مكائن قهوة، كاشير وتبريد</p></div>
    <div class="card cat"><span class="tile">${ic('supplies')}</span><h3>المنتجات والموردون</h3><p>مواد غذائية، بن، تغليف ومكونات</p></div>
    <div class="card cat"><span class="tile">${ic('services')}</span><h3>الخدمات المساندة</h3><p>تصميم داخلي، تراخيص حكومية وتسويق</p></div>
  </div>
  <div class="sec shot crop">${browserBar(URL_TEXT + '/marketplace')}<img src="${A('item.png')}"></div>
  <div class="sec"><h3>كيف تنشر طلبك؟</h3>
    <div class="steps">
      <div class="step"><b>اختر القسم</b><p>وظيفة، معدات، توريد أو خدمة.</p></div>
      <div class="step"><b>اكتب التفاصيل</b><p>العنوان والوصف والمدينة والسعر.</p></div>
      <div class="step"><b>أكمل حقول القسم</b><p>تتغير تلقائياً حسب نوع الطلب.</p></div>
      <div class="step"><b>انشر وشارك</b><p>يظهر فوراً في السوق، وتشاركه بضغطة.</p></div>
    </div>
  </div>
  <div class="callout sec">${ic('shield')}<span>بيانات التواصل في طلبك (الجوال والبريد) تظهر للأعضاء المسجلين فقط، حماية لك من الرسائل المزعجة. وبعد التوظيف أو البيع تغلق طلبك بضغطة.</span></div>
</div>${footer(3)}</section>`);

// 4 — Consultations
pages.push(`<section class="page"><div class="in">
  <span class="kicker">استشارات الخبراء</span>
  <h2>اسأل من جرّب قبلك، واحجز موعدك مباشرة</h2>
  <p class="lead">مستشارون معتمدون من إدارة المنصة، لكل منهم ملف يعرض خبرته ومواعيده المتاحة وسعر كل جلسة — بتوقيت الرياض.</p>
  <div style="display:grid;grid-template-columns:1fr 1.35fr;gap:18px;margin-top:8mm;align-items:center">
    <div>
      <h3 style="margin-bottom:12px;font-size:16px">خطوات الحجز</h3>
      <ol class="vsteps">
        <li><span class="n num">1</span><div><b>اختر المستشار</b><p>بطاقته تعرض المواعيد المتاحة والسعر وأقرب موعد.</p></div></li>
        <li><span class="n num">2</span><div><b>حدّد الموعد</b><p>المواعيد مرتبة حسب اليوم، وسعر كل موعد تحته.</p></div></li>
        <li><span class="n num">3</span><div><b>اكتب موضوعك</b><p>مثل «تقليل الهدر في مطعم وجبات سريعة» مع ملاحظاتك.</p></div></li>
        <li><span class="n num">4</span><div><b>أكّد الحجز</b><p>يُثبت الموعد فوراً، وتجد الجلسة ورابطها في لوحة التحكم.</p></div></li>
      </ol>
    </div>
    <div class="shot">${browserBar(URL_TEXT + '/consultations')}<img src="${A('consultant.png')}"></div>
  </div>
  <div class="callout" style="margin-top:7mm">${ic('check-circle')}<span><b>موعدك محفوظ لك وحدك:</b> لا تسمح المنصة أبداً بحجز الموعد نفسه مرتين، حتى لو حاول شخصان الحجز في اللحظة ذاتها.</span></div>
  <div class="sec">
    <h3 style="font-size:16px">رحلة الجلسة</h3>
    <div class="flow">
      <div class="st"><b>مجدولة</b><small>فور تأكيد الحجز</small></div><span class="arrow">${ic('arrow')}</span>
      <div class="st"><b>جارية</b><small>يبدؤها المستشار</small></div><span class="arrow">${ic('arrow')}</span>
      <div class="st ok"><b>مكتملة</b><small>تُحفظ في سجلك</small></div>
      <div style="width:10px"></div>
      <div class="st no"><b>ملغاة</b><small>يعود الموعد متاحاً</small></div>
    </div>
  </div>
  <div class="card sec" style="display:flex;gap:14px;align-items:flex-start">
    <span class="tile dk">${ic('calendar')}</span>
    <div><h3>هل أنت مستشار؟</h3><p style="font-size:11.5px;color:${C.inkSoft};margin-top:4px">سجّل بخبرتك، وبعد اعتماد الإدارة أضف مواعيدك وأسعارك — حتى 50 موعداً دفعة واحدة، والمنصة تمنع تداخلها تلقائياً. تبدأ جلساتك وتنهيها من لوحة التحكم.</p></div>
  </div>
</div>${footer(4)}</section>`);

// 5 — Dashboard, mobile, trust
pages.push(`<section class="page"><div class="in">
  <span class="kicker">لوحة التحكم</span>
  <h2>كل شيء أمامك في لوحة واحدة</h2>
  <p class="lead">جلساتك القادمة والسابقة، وطلباتك في السوق وحالتها، وأرقامك المهمة — مصممة لكل نوع حساب.</p>
  <div class="sec shot">${browserBar(URL_TEXT + '/dashboard')}<img src="${A('dashboard.png')}"></div>
  <div style="display:grid;grid-template-columns:auto 1fr;gap:18px;margin-top:9mm;align-items:center">
    <div class="phone"><img src="${A('mobile-home.png')}"></div>
    <div>
      <span class="kicker">على جوالك</span>
      <h3 style="font-size:19px;margin-bottom:8px">تعمل على الجوال كما تعمل على الكمبيوتر</h3>
      <p style="font-size:12px;color:${C.inkSoft};margin-bottom:12px">بدون تطبيق للتحميل: افتح الموقع من أي متصفح، وكل الصفحات تتكيّف مع شاشتك.</p>
      <h3 style="font-size:15px;margin:14px 0 8px">خصوصيتك وأمانك</h3>
      <div style="display:grid;gap:7px">
        <div class="check">${ic('check-circle')}<span>بيانات التواصل للأعضاء المسجلين فقط.</span></div>
        <div class="check">${ic('check-circle')}<span>تفاصيل الجلسة وملاحظاتك لطرفي الجلسة فقط.</span></div>
        <div class="check">${ic('check-circle')}<span>كلمات المرور محفوظة مشفّرة، ولا يطّلع عليها أحد.</span></div>
        <div class="check">${ic('check-circle')}<span>اتصال مشفّر دائماً، وحماية من محاولات تخمين الدخول.</span></div>
      </div>
    </div>
  </div>
</div>${footer(5)}</section>`);

// 6 — Back cover
pages.push(`<section class="page dark back"><div class="pat"></div><div class="glow"></div><div class="in">
  <div>${logo(56, 'dark')}</div>
  <h1>ابدأ الآن،<br>والتسجيل <em>مجاني</em></h1>
  <p class="lead" style="color:#cbc1b5;font-size:15px;margin-top:12px">انضم لمجتمع قطاع المطاعم والمقاهي، واجعل استشارتك القادمة وموظفك القادم ومورّدك القادم على بُعد ضغطة.</p>
  <div class="bsteps">
    <div class="bstep"><span class="n num">01</span><b>أنشئ حسابك</b><p>اختر نوع حسابك: صاحب منشأة، مستشار، أو مورد وباحث عن عمل.</p></div>
    <div class="bstep"><span class="n num">02</span><b>انشر أو احجز</b><p>انشر طلبك في قسمه، أو اختر مستشاراً واحجز موعداً متاحاً.</p></div>
    <div class="bstep"><span class="n num">03</span><b>تابع من لوحتك</b><p>جلساتك وطلباتك وحالتها في مكان واحد.</p></div>
  </div>
  <div style="margin-top:auto;padding-bottom:16mm;display:flex;align-items:flex-end;justify-content:space-between">
    <div><span style="font-size:12px;color:${C.roast300}">زوروا المنصة</span>
      <div class="num" style="font-family:Alexandria;font-size:24px;font-weight:600;color:${C.gold400};margin-top:6px">${URL_TEXT}</div></div>
    <div style="text-align:center"><div class="qrbox">${qr}</div><span style="display:block;font-size:10.5px;color:${C.roast300};margin-top:8px">امسح الرمز لفتح المنصة</span></div>
  </div>
</div></section>`);

const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>مطعم m63m — الدليل التعريفي</title><style>${css}</style></head><body>${pages.join('\n')}</body></html>`;

(async () => {
  const build = path.join(__dirname, 'brochure.html');
  fs.writeFileSync(build, html);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.goto('file:///' + build.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: `${ROOT}/m63m-brochure.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
  // previews for QA
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 });
  const els = await page.$$('.page');
  for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(__dirname, `bro-${i + 1}.png`) });
  // overflow check: content running past the page bottom/footer
  const issues = await page.evaluate(() => [...document.querySelectorAll('.page')].map((p, i) => {
    const pb = p.getBoundingClientRect().bottom; const f = p.querySelector('.pf'); const limit = f ? f.getBoundingClientRect().top : pb;
    const over = [...p.querySelectorAll('.in *')].filter((e) => e.getBoundingClientRect().bottom > limit + 1 && e.getBoundingClientRect().height > 0 && !e.closest('.pat'));
    return over.length ? `page ${i + 1}: ${over.length} elements past ${f ? 'footer' : 'page'} (${over[0].className || over[0].tagName})` : null;
  }).filter(Boolean));
  console.log(issues.length ? issues.join('\n') : 'no overflow');
  await browser.close();
  console.log('pdf', fs.statSync(`${ROOT}/m63m-brochure.pdf`).size);
})().catch((e) => { console.error(e); process.exit(1); });
