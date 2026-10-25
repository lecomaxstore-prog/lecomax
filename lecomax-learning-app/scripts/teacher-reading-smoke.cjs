const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { load } = require('./inspect.cjs');
const { initial } = load('lecomax-learning-app/utils/progress.ts');
const code = 'export async function loadProducts() {\n  const response = await fetch("https://example.test/api/products");\n  return response.json();\n}';
const answer = '## ما هو API؟\nوسيلة تجعل تطبيقك يتواصل مع خدمة أخرى.\n\n### مثال صغير\nتخيّل قائمة مطعم: تطلب منتجاً ويصل إليك الرد.\n```typescript\n' + code + '\n```\n' + Array.from({length: 12}, (_, i) => `\n### الخطوة ${i + 1}\nاقرأ النتيجة ثم جرّب تغيير الطلب.\n1. حدّد البيانات التي تحتاجها.\n2. أرسل الطلب وانتظر الإجابة.\n\n> تذكّر: لا تضع المفاتيح السرية في الكود.\n`).join('') + '\n## جرّب بنفسك\nاشرح ما تتوقّع أن يحدث.';
async function main() {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  try {
    for (const theme of ['light','dark']) {
      const context = await browser.newContext({viewport:{width:390,height:844}});
      await context.addInitScript(state => localStorage.setItem('lecomax-school-v1', JSON.stringify(state)), {...initial,language:'ar',theme,teacher:{draft:'',history:[{role:'user',content:'ما هو API؟'},{role:'assistant',content:answer}]}});
      const page = await context.newPage();
      const errors=[]; page.on('pageerror', e=>errors.push(e.message));
      await page.goto((process.env.TEACHER_PREVIEW_URL || 'http://localhost:8084')+'/teacher');
      const input=page.getByRole('textbox',{name:'رسالة إلى الأستاذ',exact:true});
      await input.waitFor();
      for (const [width,height] of [[320,568],[390,844],[768,1024],[390,480]]) {
        await page.setViewportSize({width,height});
        await page.getByRole('heading',{name:'جرّب بنفسك',exact:true}).scrollIntoViewIfNeeded();
        const box=await input.boundingBox();
        assert(box && box.y>=0 && box.y+box.height<height-64);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      }
      await page.setViewportSize({width:390,height:844});
      await page.getByRole('heading',{name:'ما هو API؟',exact:true}).scrollIntoViewIfNeeded();
      await page.screenshot({path:`artifacts/teacher-ar-${theme}-reading.png`});
      await page.getByRole('button',{name:'اشرح هذا الكود',exact:true}).click();
      assert((await input.inputValue()).includes(code));
      await page.getByRole('button',{name:'محادثة جديدة',exact:true}).click();
      await page.getByRole('button',{name:'إلغاء',exact:true}).click();
      await page.getByRole('button',{name:'تأكيد',exact:true}).waitFor({state:'hidden'});
      assert((await input.inputValue()).includes(code));
      await page.getByRole('button',{name:'محادثة جديدة',exact:true}).click();
      await page.getByRole('button',{name:'تأكيد',exact:true}).click();
      await page.getByRole('button',{name:'تأكيد',exact:true}).waitFor({state:'hidden'});
      assert.equal(await input.inputValue(),'');
      await page.getByRole('heading',{name:'ماذا تريد أن تتعلّم اليوم؟',exact:true}).waitFor();
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('PASS: Long Arabic answers, light/dark themes, 320–768px layouts, short viewport, code explanation and confirmed/cancelled new chat.');
  } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
