import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('components/ecomedia/PostCard.tsx', 'utf8');

// Replace avatar: find the block from "Avatar with green ring" comment to closing </div>
const avatarStart = c.indexOf('{/* Avatar with green ring */}');
if (avatarStart === -1) {
  console.log('Avatar comment not found. Searching nearby...');
  const idx = c.indexOf('l_ecomax');
  console.log('l_ecomax at index:', idx);
  console.log('Context:', JSON.stringify(c.slice(Math.max(0,idx-400), idx+50)));
} else {
  // Find closing </div> after avatarStart — we need to find the end of the 3-div nesting
  // The block ends at the 3rd closing </div>
  let depth = 0;
  let pos = avatarStart;
  let blockEnd = -1;
  // Find from the <div after the comment
  const divStart = c.indexOf('<div', avatarStart);
  pos = divStart;
  while (pos < c.length) {
    if (c.slice(pos, pos+4) === '<div') depth++;
    if (c.slice(pos, pos+6) === '</div>') {
      depth--;
      if (depth === 0) { blockEnd = pos + 6; break; }
    }
    pos++;
  }
  
  if (blockEnd !== -1) {
    const oldBlock = c.slice(avatarStart, blockEnd);
    const indent = '          ';
    const newBlock = `{/* Site logo with green ring */}\n${indent}<div className="p-[2.5px] rounded-full bg-gradient-to-br from-[#3ecf4c] to-[#16b277] shrink-0">\n${indent}  <div className="bg-white p-[2px] rounded-full">\n${indent}    {/* eslint-disable-next-line @next/next/no-img-element */}\n${indent}    <img src="/images/lecomax logo.png" alt="lecomax" className="w-8 h-8 rounded-full object-contain bg-white" />\n${indent}  </div>\n${indent}</div>`;
    c = c.slice(0, avatarStart) + newBlock + c.slice(blockEnd);
    console.log('Avatar replaced successfully');
  } else {
    console.log('Could not find end of avatar block');
  }
}

// Fix username
const before = c.includes('>l_ecomax<');
c = c.replace(/>l_ecomax</g, ">L'ecomax<");
console.log('Username replaced:', before, '->', c.includes(">L'ecomax<"));

writeFileSync('components/ecomedia/PostCard.tsx', c, 'utf8');
console.log('File saved');
