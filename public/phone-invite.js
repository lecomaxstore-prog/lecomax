'use strict';
(() => {
  const strings = {
    en: { badge:'VIEW ONLY · YOUR APPROVAL', title:'Share this phone’s screen', intro:'Someone has invited you to share this Android phone’s screen. Review the request in L’ECOMAX Learn before approving.', step1:'Open the updated L’ECOMAX Learn app and sign in.', step2:'Tap “Approve view-only sharing”, then accept Android’s screen-capture prompt.', step3:'Use your apps normally. The other phone can watch, without touching or controlling your screen.', open:'Open L’ECOMAX Learn', direct:'Try the direct app link', copy:'Copy invitation link', requirements:'Before you start', setup:'Both Android phones need the updated app and access to the same Tailscale network. Ask the sender to return to L’ECOMAX Learn and keep the invitation page open. The invitation expires after 10 minutes.', stop:'You can stop sharing at any time from the app or the Android notification. Opening this page does not share your screen.', help:'The app did not open?', fallback:'From WhatsApp, choose “Open in browser” and try again. Or copy this invitation, open My remote phone in L’ECOMAX Learn, paste it under “Open a received link”, and continue. If needed, install the updated Learn app first, then reopen the original WhatsApp link. iPhone screen sharing is not supported by this feature.', invalid:'This invitation is missing or invalid. Ask the sender for a new link.', copied:'Link copied. Paste it into My remote phone → Open a received link.', manual:'Select and copy the link below, then paste it into the app.', ready:'Continue in the app to review and approve. The app will check whether this invitation is still available.' },
    fr: { badge:'LECTURE SEULE · AVEC TON ACCORD', title:'Partager l’écran de ce téléphone', intro:'Tu as reçu une invitation à partager l’écran de ce téléphone Android. Vérifie la demande dans L’ECOMAX Learn avant d’accepter.', step1:'Ouvre la version à jour de L’ECOMAX Learn et connecte-toi.', step2:'Appuie sur « Approuver le partage en lecture seule », puis accepte la demande de capture Android.', step3:'Utilise tes applications normalement. L’autre téléphone peut regarder, sans toucher ni contrôler ton écran.', open:'Ouvrir L’ECOMAX Learn', direct:'Essayer le lien direct vers l’application', copy:'Copier le lien d’invitation', requirements:'Avant de commencer', setup:'Les deux téléphones Android doivent avoir l’application à jour et accéder au même réseau Tailscale. Demande à l’expéditeur de revenir dans L’ECOMAX Learn et de garder la page d’invitation ouverte. Le lien expire après 10 minutes.', stop:'Tu peux arrêter dans l’application ou la notification Android. Ouvrir cette page ne partage pas ton écran.', help:'L’application ne s’ouvre pas ?', fallback:'Dans WhatsApp, choisis « Ouvrir dans le navigateur », puis réessaie. Ou copie cette invitation et colle-la dans Mon téléphone à distance → Ouvrir un lien reçu. Installe d’abord l’application Learn à jour si nécessaire, puis rouvre le lien WhatsApp original. Le partage d’écran iPhone n’est pas pris en charge.', invalid:'Invitation manquante ou invalide. Demande un nouveau lien.', copied:'Lien copié. Colle-le dans Mon téléphone à distance → Ouvrir un lien reçu.', manual:'Sélectionne et copie le lien ci-dessous, puis colle-le dans l’application.', ready:'Continue dans l’application pour vérifier et approuver. Elle vérifiera si l’invitation est encore disponible.' },
    ar: { badge:'مشاهدة فقط · بموافقتك', title:'مشاركة شاشة هذا الهاتف', intro:'وصلتك دعوة لمشاركة شاشة هاتف أندرويد هذا. راجع الطلب داخل L’ECOMAX Learn قبل الموافقة.', step1:'افتح تطبيق L’ECOMAX Learn المحدّث وسجّل الدخول.', step2:'اضغط «الموافقة على المشاركة للمشاهدة فقط»، ثم وافق على طلب التقاط الشاشة من أندرويد.', step3:'استخدم تطبيقاتك بشكل عادي. يمكن للهاتف الآخر المشاهدة دون لمس شاشتك أو التحكم بها.', open:'فتح L’ECOMAX Learn', direct:'تجربة رابط التطبيق المباشر', copy:'نسخ رابط الدعوة', requirements:'قبل البدء', setup:'يلزم التطبيق المحدّث والاتصال بنفس شبكة Tailscale على هاتفي أندرويد. اطلب من المرسل الرجوع إلى L’ECOMAX Learn وإبقاء صفحة الدعوة مفتوحة. تنتهي صلاحية الدعوة بعد 10 دقائق.', stop:'يمكنك إيقاف المشاركة من التطبيق أو إشعار أندرويد في أي وقت. فتح هذه الصفحة لا يشارك شاشتك.', help:'لم يفتح التطبيق؟', fallback:'من واتساب اختر «فتح في المتصفح» ثم حاول مجدداً. أو انسخ الدعوة وافتح هاتفي عن بُعد في التطبيق والصقها في «فتح رابط مستلم». ثبّت تطبيق Learn المحدّث أولاً عند الحاجة ثم افتح رابط واتساب الأصلي. هذه الميزة لا تدعم مشاركة شاشة آيفون.', invalid:'الدعوة مفقودة أو غير صالحة. اطلب رابطاً جديداً من المرسل.', copied:'تم نسخ الرابط. الصقه في هاتفي عن بُعد ← فتح رابط مستلم.', manual:'حدّد الرابط أدناه وانسخه ثم الصقه داخل التطبيق.', ready:'تابع داخل التطبيق للمراجعة والموافقة. سيتحقق التطبيق من صلاحية الدعوة.' },
  };
  let language = /^ar/i.test(navigator.language) ? 'ar' : /^fr/i.test(navigator.language) ? 'fr' : 'en';
  let state = 'invalid', payload = '', internet = false;
  const internetText = {
    en: { step1: 'Open the updated L’ECOMAX Learn app. No account is needed to accept this invitation.', step2: 'Tap “Approve and share my screen”, then accept Android’s screen-capture prompt.', setup: 'Both phones need internet over Wi-Fi or mobile data. No Tailscale is required. Learn must be installed on this Android phone. The invitation expires after 10 minutes.', fallback: 'From WhatsApp, choose “Open in browser” and try again. Install the updated Learn app first if needed, then reopen this original link. iPhone screen sharing is not supported.' },
    fr: { step1: 'Ouvre la version à jour de L’ECOMAX Learn. Aucun compte requis pour accepter cette invitation.', step2: 'Appuie sur « Approuver et partager mon écran », puis accepte la demande Android.', setup: 'Les deux téléphones ont besoin du Wi-Fi ou des données mobiles. Aucun Tailscale requis. Learn doit être installé sur ce téléphone Android. Le lien expire après 10 minutes.', fallback: 'Dans WhatsApp, choisis « Ouvrir dans le navigateur » puis réessaie. Installe Learn à jour si nécessaire, puis rouvre ce lien original. Le partage d’écran iPhone n’est pas pris en charge.' },
    ar: { step1: 'افتح تطبيق L’ECOMAX Learn المحدّث. لا تحتاج إلى حساب لقبول هذه الدعوة.', step2: 'اضغط «الموافقة ومشاركة شاشتي»، ثم وافق على طلب التقاط الشاشة من أندرويد.', setup: 'يحتاج الهاتفان إلى واي فاي أو بيانات الهاتف. لا حاجة إلى Tailscale. يجب تثبيت Learn على هاتف أندرويد هذا. تنتهي الدعوة بعد 10 دقائق.', fallback: 'من واتساب اختر «فتح في المتصفح» وحاول مجدداً. ثبّت تطبيق Learn المحدّث عند الحاجة ثم افتح هذا الرابط الأصلي. مشاركة شاشة آيفون غير مدعومة.' },
  };
  const byId = id => document.getElementById(id);
  function render() {
    document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    byId('language').value = language;
    const text = { ...strings[language], ...(internet ? internetText[language] : {}) };
    document.querySelectorAll('[data-text]').forEach(node => { node.textContent = text[node.dataset.text]; });
    byId('status').textContent = strings[language][state];
  }
  try {
    const params = new URLSearchParams(location.hash.slice(1));
    const candidate = params.get('invite') || '';
    internet = !location.search && [...params.keys()].length === 1 && /^internet\|[a-f0-9]{32}\|[a-f0-9]{64}$/.test(candidate);
    if (internet) payload = candidate;
    const parts = candidate.split('|'), address = new URL(parts[0]);
    const ip = address.hostname.split('.').map(Number);
    if (!location.search && [...params.keys()].length === 1 && params.has('invite') && candidate.length <= 160 && parts.length === 2 && /^[a-f0-9]{64}$/.test(parts[1]) &&
      address.origin === parts[0] && address.protocol === 'http:' && address.port === '8093' && ip.length === 4 && ip[0] === 100 && ip[1] >= 64 && ip[1] <= 127 && ip.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) payload = candidate;
  } catch { /* Invalid links never receive an app-launch target. */ }
  if (payload) {
    const encoded = encodeURIComponent(payload);
    const link = 'https://lecomax.com/phone-invite.html#invite=' + encoded;
    const route = internet ? 'phone-share' : 'phone';
    byId('direct').href = 'lecomax-learn://' + route + '?invite=' + encoded;
    byId('open').href = 'intent://' + route + '?invite=' + encoded + '#Intent;scheme=lecomax-learn;package=com.lecomax.learning;S.browser_fallback_url=' + encodeURIComponent(link) + ';end';
    byId('actions').hidden = false; state = 'ready';
    byId('copy').onclick = async () => {
      try { await navigator.clipboard.writeText(link); state = 'copied'; }
      catch { byId('manual').hidden = false; byId('manual').value = link; byId('manual').closest('details').open = true; byId('manual').focus(); byId('manual').select(); state = 'manual'; }
      render();
    };
  }
  byId('language').onchange = event => { language = event.target.value in strings ? event.target.value : 'en'; render(); };
  render();
})();
