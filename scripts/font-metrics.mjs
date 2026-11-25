// Dev helper: how wide each web font sets text compared with its system fallback.
// The ratio becomes `size-adjust` on a fallback @font-face, so text keeps its shape while fonts load.
import { chromium } from 'playwright';
import { serve } from './shots.mjs';
const { server, port } = await serve();
const browser = await chromium.launch({ channel: 'chrome' });
const PAIRS = [
  ['/demo/open-road/', '400', 'Instrument Serif', 'Georgia', 'BERGEN COUNTY AREA WEBSITE Serving the communities of Allendale, Bogota, Dumont 12:00pm - 1:00pm'],
  ['/demo/open-road/', '400', 'Public Sans', 'Arial', 'The area committee is composed of group service representatives (GSRs), administrative officers'],
  ['/demo/open-road/', '600', 'Public Sans', 'Arial', 'Noon Heights Recovery FIND A MEETING Hasbrouck Heights'],
  ['/demo/tonights-board/', '700', 'Bricolage Grotesque', 'Arial', 'BERGEN COUNTY AREA WEBSITE Upcoming meetings ANNOUNCEMENTS & EVENTS'],
  ['/demo/tonights-board/', '400', 'Inter', 'Arial', 'The area committee is composed of group service representatives (GSRs), administrative officers'],
  ['/demo/tonights-board/', '600', 'Inter', 'Arial', 'Noon Heights Recovery FIND A MEETING Hasbrouck Heights Tomorrow'],
  ['/demo/tonights-board/', '500', 'IBM Plex Mono', 'Menlo', '8:00pm - 9:00pm Starts in 12 min'],
  ['/demo/tonights-board/', '500', 'IBM Plex Mono', 'Courier New', '8:00pm - 9:00pm Starts in 12 min'],
  ['/demo/twenty-towns/', '700', 'Fraunces', 'Georgia', 'BERGEN COUNTY AREA WEBSITE ANNOUNCEMENTS & EVENTS Upcoming meetings'],
  ['/demo/twenty-towns/', '600', 'Fraunces', 'Georgia', 'Serving the communities of Allendale, Bogota, Dumont 12:00pm - 1:00pm'],
  ['/demo/twenty-towns/', '400', 'Source Sans 3', 'Arial', 'The area committee is composed of group service representatives (GSRs), administrative officers'],
  ['/demo/twenty-towns/', '600', 'Source Sans 3', 'Arial', 'Noon Heights Recovery FIND A MEETING Hasbrouck Heights'],
];
const page = await browser.newPage();
let last = '';
for (const [route, weight, font, fallback, text] of PAIRS) {
  if (route !== last) { await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle' }); last = route; }
  const r = await page.evaluate(async ([weight, font, fallback, text]) => {
    await document.fonts.load(`${weight} 100px "${font}"`);
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${weight} 100px "${font}"`; const a = ctx.measureText(text).width;
    ctx.font = `${weight} 100px "${fallback}"`; const b = ctx.measureText(text).width;
    return { a, b, ok: document.fonts.check(`${weight} 100px "${font}"`) };
  }, [weight, font, fallback, text]);
  console.log(`${font} ${weight} vs ${fallback}: size-adjust ${(100 * r.a / r.b).toFixed(1)}%  (loaded ${r.ok})`);
}
await browser.close();
server.close();
