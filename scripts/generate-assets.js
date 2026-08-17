const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'sample-content', 'placeholder-assets');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Character Mascot SVG
const charMascotSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFF3E0" />
      <stop offset="100%" stop-color="#FFE0B2" />
    </radialGradient>
    <linearGradient id="pigPink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFB6C1" />
      <stop offset="100%" stop-color="#FF8DA1" />
    </linearGradient>
    <linearGradient id="hatGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#ECEFF1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.15"/>
    </filter>
  </defs>
  
  <!-- Outer Glow Circle -->
  <circle cx="100" cy="100" r="92" fill="url(#bgGlow)" stroke="#FF8A65" stroke-width="4" filter="url(#shadow)"/>
  
  <!-- Ears -->
  <polygon points="50,60 30,25 70,45" fill="#FF8DA1" stroke="#E57373" stroke-width="2" />
  <polygon points="48,55 36,32 62,47" fill="#FFCDD2" />
  <polygon points="150,60 170,25 130,45" fill="#FF8DA1" stroke="#E57373" stroke-width="2" />
  <polygon points="152,55 164,32 138,47" fill="#FFCDD2" />

  <!-- Head -->
  <ellipse cx="100" cy="115" rx="65" ry="55" fill="url(#pigPink)" stroke="#E57373" stroke-width="3"/>
  
  <!-- Cheeks -->
  <circle cx="58" cy="125" r="14" fill="#FF5252" opacity="0.3"/>
  <circle cx="142" cy="125" r="14" fill="#FF5252" opacity="0.3"/>
  
  <!-- Eyes -->
  <circle cx="72" cy="102" r="8" fill="#2C3437"/>
  <circle cx="75" cy="99" r="3" fill="#FFFFFF"/>
  <circle cx="128" cy="102" r="8" fill="#2C3437"/>
  <circle cx="131" cy="99" r="3" fill="#FFFFFF"/>
  
  <!-- Snout -->
  <ellipse cx="100" cy="122" rx="26" ry="18" fill="#FFCDD2" stroke="#E57373" stroke-width="3"/>
  <ellipse cx="91" cy="122" rx="5" ry="7" fill="#D81B60"/>
  <ellipse cx="109" cy="122" rx="5" ry="7" fill="#D81B60"/>
  
  <!-- Smile -->
  <path d="M 85 142 Q 100 154 115 142" fill="none" stroke="#2C3437" stroke-width="3" stroke-linecap="round"/>

  <!-- Chef Hat -->
  <path d="M 68 55 C 65 30, 85 15, 100 18 C 115 15, 135 30, 132 55 Z" fill="url(#hatGrad)" stroke="#B0BEC5" stroke-width="2"/>
  <path d="M 60 48 C 50 35, 75 25, 85 35 Z" fill="url(#hatGrad)"/>
  <path d="M 140 48 C 150 35, 125 25, 115 35 Z" fill="url(#hatGrad)"/>
  <rect x="68" y="48" width="64" height="14" rx="4" fill="#E53935" stroke="#C62828" stroke-width="1.5"/>
  <text x="100" y="58" font-size="8" font-family="sans-serif" font-weight="bold" fill="#FFFFFF" text-anchor="middle">MEAT GUIDE</text>
</svg>`;

// 2. Anatomical Diagrams
const createPigDiagram = (highlightPart) => {
  const parts = {
    neck: { fill: highlightPart === 'neck' ? '#FF1744' : '#E0E0E0', stroke: '#C2185B' },
    hangjeong: { fill: highlightPart === 'hangjeong' ? '#FF1744' : '#E0E0E0', stroke: '#C2185B' },
    galmaegi: { fill: highlightPart === 'galmaegi' ? '#FF1744' : '#E0E0E0', stroke: '#C2185B' },
    gabri: { fill: highlightPart === 'gabri' ? '#FF1744' : '#E0E0E0', stroke: '#C2185B' },
    belly: { fill: highlightPart === 'belly' ? '#FF1744' : '#E0E0E0', stroke: '#C2185B' },
    songi: { fill: highlightPart === 'songi' ? '#FF1744' : '#E0E0E0', stroke: '#C2185B' },
    base: '#BDBDBD'
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
    <rect width="400" height="250" rx="16" fill="#F8F9FA" stroke="#E9ECEF" stroke-width="2"/>
    <g transform="translate(20, 20)">
      <!-- Pig Outline Background -->
      <!-- Head & Snout -->
      <path d="M 60,110 L 20,115 L 20,135 L 50,145 L 70,165 L 70,185 L 90,185 L 95,155" fill="${parts.base}" stroke="#757575" stroke-width="2"/>
      
      <!-- Jowl / Hangjeong -->
      <path d="M 50,135 L 85,135 L 95,155 L 70,165 Z" fill="${parts.hangjeong.fill}" stroke="#424242" stroke-width="2"/>
      
      <!-- Neck / Ggodle -->
      <path d="M 60,90 C 80,70 105,65 120,65 L 120,105 L 75,115 Z" fill="${parts.neck.fill}" stroke="#424242" stroke-width="2"/>
      
      <!-- Upper Loin / Gabri -->
      <path d="M 120,65 C 160,60 210,60 240,65 L 240,100 L 120,100 Z" fill="${parts.gabri.fill}" stroke="#424242" stroke-width="2"/>
      
      <!-- Belly / Samgyeop -->
      <path d="M 120,125 L 240,125 L 240,165 L 120,165 Z" fill="${parts.belly.fill}" stroke="#424242" stroke-width="2"/>
      
      <!-- Diaphragm / Galmaegi & Songi -->
      <path d="M 130,100 L 230,100 L 230,125 L 130,125 Z" fill="${parts.galmaegi.fill}" stroke="#424242" stroke-width="2"/>
      
      <!-- Inner Special / Songi Cut Marker -->
      <circle cx="180" cy="112" r="14" fill="${parts.songi.fill}" stroke="#FFFFFF" stroke-width="2"/>
      
      <!-- Hind & Legs -->
      <path d="M 240,65 C 280,70 310,90 320,120 L 320,185 L 300,185 L 290,155 L 240,165 Z" fill="${parts.base}" stroke="#757575" stroke-width="2"/>
      <path d="M 320,115 C 335,110 340,100 335,95" fill="none" stroke="#757575" stroke-width="3" stroke-linecap="round"/>
      
      <!-- Front Leg -->
      <path d="M 100,165 L 100,185 L 120,185 L 125,165 Z" fill="${parts.base}" stroke="#757575" stroke-width="2"/>
      
      <!-- Label -->
      <rect x="10" y="5" width="140" height="26" rx="6" fill="#212529" opacity="0.85"/>
      <text x="80" y="22" fill="#FFFFFF" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">돼지 부위 안내도</text>
    </g>
  </svg>`;
};

// 3. Beef Diagram (Cow)
const createCowDiagram = () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
    <rect width="400" height="250" rx="16" fill="#F8F9FA" stroke="#E9ECEF" stroke-width="2"/>
    <g transform="translate(20, 20)">
      <!-- Cow Head & Horns -->
      <path d="M 50,85 L 25,95 L 15,115 L 45,135 L 65,150 L 65,185 L 85,185 L 90,145 Z" fill="#BDBDBD" stroke="#757575" stroke-width="2"/>
      <path d="M 55,75 C 50,60 40,55 35,55" fill="none" stroke="#616161" stroke-width="3"/>
      
      <!-- Chuck & Neck -->
      <path d="M 50,85 C 75,70 100,65 115,65 L 115,135 L 65,140 Z" fill="#E0E0E0" stroke="#757575" stroke-width="2"/>
      
      <!-- Ribs / Galbi (HIGHLIGHTED) -->
      <path d="M 115,65 L 205,65 L 205,135 L 115,135 Z" fill="#D32F2F" stroke="#B71C1C" stroke-width="3"/>
      <text x="160" y="105" fill="#FFFFFF" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">소생갈비살</text>
      
      <!-- Loin & Sirloin -->
      <path d="M 205,65 C 240,65 270,70 290,80 L 290,135 L 205,135 Z" fill="#E0E0E0" stroke="#757575" stroke-width="2"/>
      
      <!-- Flank & Plate -->
      <path d="M 115,135 L 270,135 L 260,165 L 125,165 Z" fill="#EEEEEE" stroke="#757575" stroke-width="2"/>
      
      <!-- Round / Hind Leg -->
      <path d="M 290,80 C 320,95 330,120 330,150 L 330,185 L 310,185 L 295,155 L 260,165 Z" fill="#BDBDBD" stroke="#757575" stroke-width="2"/>
      
      <!-- Front Leg -->
      <path d="M 95,155 L 95,185 L 115,185 L 120,155 Z" fill="#BDBDBD" stroke="#757575" stroke-width="2"/>
      
      <!-- Label -->
      <rect x="10" y="5" width="140" height="26" rx="6" fill="#B71C1C" opacity="0.9"/>
      <text x="80" y="22" fill="#FFFFFF" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">소 부위 안내도</text>
    </g>
  </svg>`;
};

// 4. Meat Cut Platter Vectors
const createMeatVector = (title, color1, color2, marblingPattern) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
    <defs>
      <radialGradient id="plateGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#37474F" />
        <stop offset="100%" stop-color="#212121" />
      </radialGradient>
      <linearGradient id="meatGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
    </defs>
    <!-- Slate Platter -->
    <rect width="300" height="200" rx="16" fill="url(#plateGrad)"/>
    <rect x="8" y="8" width="284" height="184" rx="12" fill="none" stroke="#546E7A" stroke-width="1.5" stroke-dasharray="6,4"/>
    
    <!-- Garnish Herbs -->
    <path d="M 40,160 Q 60,130 90,150" fill="none" stroke="#4CAF50" stroke-width="3"/>
    <circle cx="50" cy="145" r="4" fill="#81C784"/>
    <circle cx="75" cy="140" r="5" fill="#81C784"/>
    
    <!-- Meat Slices -->
    <g transform="translate(50, 40)">
      <!-- Slice 1 -->
      <path d="M 20,30 C 50,10 150,15 180,45 C 190,65 170,95 130,105 C 90,115 30,100 15,75 C 5,55 10,40 20,30 Z" fill="url(#meatGrad)" stroke="#B71C1C" stroke-width="2"/>
      <!-- Fat / Marbling lines -->
      <path d="M 40,35 Q 80,45 120,35 Q 160,50 170,60" fill="none" stroke="#FFF9C4" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
      <path d="M 30,60 Q 70,75 110,65 Q 145,80 155,90" fill="none" stroke="#FFF9C4" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>
      <path d="M 50,85 Q 90,95 130,85" fill="none" stroke="#FFF9C4" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
    </g>
    
    <!-- Meat Title Badge -->
    <rect x="20" y="20" width="110" height="28" rx="6" fill="#000000" opacity="0.7"/>
    <text x="75" y="38" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">${title}</text>
  </svg>`;
};

// Write all placeholder assets
fs.writeFileSync(path.join(targetDir, 'char_mascot.svg'), charMascotSvg, 'utf8');
fs.writeFileSync(path.join(targetDir, 'pig_diagram_neck.svg'), createPigDiagram('neck'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'pig_diagram_hangjeong.svg'), createPigDiagram('hangjeong'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'pig_diagram_galmaegi.svg'), createPigDiagram('galmaegi'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'pig_diagram_gabri.svg'), createPigDiagram('gabri'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'pig_diagram_belly.svg'), createPigDiagram('belly'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'pig_diagram_songi.svg'), createPigDiagram('songi'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'cow_diagram_rib.svg'), createCowDiagram(), 'utf8');

fs.writeFileSync(path.join(targetDir, 'pork_ggodle.svg'), createMeatVector('꼬들목살', '#EF5350', '#C62828'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'pork_hangjeong.svg'), createMeatVector('항정살', '#FF8A80', '#E57373'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'pork_galmaegi.svg'), createMeatVector('갈매기살', '#C62828', '#880E4F'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'pork_gabri.svg'), createMeatVector('가브리살', '#FF8A80', '#D32F2F'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'pork_samgyeop.svg'), createMeatVector('삼겹살', '#E57373', '#B71C1C'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'pork_songi.svg'), createMeatVector('송이살', '#D32F2F', '#7B1FA2'), 'utf8');
fs.writeFileSync(path.join(targetDir, 'beef_galbi.svg'), createMeatVector('소생갈비살', '#B71C1C', '#4A148C'), 'utf8');

console.log('All vector placeholder assets successfully generated in sample-content/placeholder-assets!');
