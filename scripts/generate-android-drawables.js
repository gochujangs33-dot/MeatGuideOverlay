const fs = require('fs');
const path = require('path');

const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'drawable');
if (!fs.existsSync(resDir)) {
  fs.mkdirSync(resDir, { recursive: true });
}

// 1. ic_mascot_character.xml
const icMascotCharacter = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="80dp"
    android:height="80dp"
    android:viewportWidth="200"
    android:viewportHeight="200">
  <!-- Glow Circle -->
  <path
      android:fillColor="#FFE0B2"
      android:pathData="M100,100m-90,0a90,90 0,1 1,180 0a90,90 0,1 1,-180 0" />
  <path
      android:strokeColor="#FF8A65"
      android:strokeWidth="5"
      android:pathData="M100,100m-90,0a90,90 0,1 1,180 0a90,90 0,1 1,-180 0" />
  <!-- Ears -->
  <path
      android:fillColor="#FF8DA1"
      android:strokeColor="#E57373"
      android:strokeWidth="2"
      android:pathData="M50,60 L30,25 L70,45 Z" />
  <path
      android:fillColor="#FF8DA1"
      android:strokeColor="#E57373"
      android:strokeWidth="2"
      android:pathData="M150,60 L170,25 L130,45 Z" />
  <!-- Head -->
  <path
      android:fillColor="#FFB6C1"
      android:strokeColor="#E57373"
      android:strokeWidth="3"
      android:pathData="M100,60 C135,60 165,85 165,115 C165,145 135,170 100,170 C65,170 35,145 35,115 C35,85 65,60 100,60 Z" />
  <!-- Cheeks -->
  <path
      android:fillColor="#FF80AB"
      android:pathData="M58,125m-14,0a14,14 0,1 1,28 0a14,14 0,1 1,-28 0" />
  <path
      android:fillColor="#FF80AB"
      android:pathData="M142,125m-14,0a14,14 0,1 1,28 0a14,14 0,1 1,-28 0" />
  <!-- Eyes -->
  <path
      android:fillColor="#2C3437"
      android:pathData="M72,102m-8,0a8,8 0,1 1,16 0a8,8 0,1 1,-16 0" />
  <path
      android:fillColor="#FFFFFF"
      android:pathData="M75,99m-3,0a3,3 0,1 1,6 0a3,3 0,1 1,-6 0" />
  <path
      android:fillColor="#2C3437"
      android:pathData="M128,102m-8,0a8,8 0,1 1,16 0a8,8 0,1 1,-16 0" />
  <path
      android:fillColor="#FFFFFF"
      android:pathData="M131,99m-3,0a3,3 0,1 1,6 0a3,3 0,1 1,-6 0" />
  <!-- Snout -->
  <path
      android:fillColor="#FFCDD2"
      android:strokeColor="#E57373"
      android:strokeWidth="3"
      android:pathData="M100,104 C115,104 126,112 126,122 C126,132 115,140 100,140 C85,140 74,132 74,122 C74,112 85,104 100,104 Z" />
  <path
      android:fillColor="#D81B60"
      android:pathData="M91,122m-4,0a4,6 0,1 1,8 0a4,6 0,1 1,-8 0" />
  <path
      android:fillColor="#D81B60"
      android:pathData="M109,122m-4,0a4,6 0,1 1,8 0a4,6 0,1 1,-8 0" />
  <!-- Smile -->
  <path
      android:strokeColor="#2C3437"
      android:strokeWidth="3"
      android:strokeLineCap="round"
      android:pathData="M85,145 Q100,157 115,145" />
  <!-- Chef Hat -->
  <path
      android:fillColor="#FFFFFF"
      android:strokeColor="#B0BEC5"
      android:strokeWidth="2"
      android:pathData="M68,55 C65,30 85,15 100,18 C115,15 135,30 132,55 Z" />
  <path
      android:fillColor="#E53935"
      android:pathData="M68,48 h64 v12 h-64 z" />
</vector>`;

// 2. ic_pork_category.xml
const icPorkCategory = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="64dp"
    android:height="64dp"
    android:viewportWidth="100"
    android:viewportHeight="100">
  <path
      android:fillColor="#FF8DA1"
      android:pathData="M50,10 C70,10 88,25 90,48 C92,70 75,90 50,90 C25,90 10,70 10,48 C10,25 30,10 50,10 Z" />
  <path
      android:fillColor="#FFFFFF"
      android:pathData="M35,38m-5,0a5,5 0,1 1,10 0a5,5 0,1 1,-10 0" />
  <path
      android:fillColor="#FFFFFF"
      android:pathData="M65,38m-5,0a5,5 0,1 1,10 0a5,5 0,1 1,-10 0" />
  <path
      android:fillColor="#C2185B"
      android:pathData="M50,45 C60,45 68,52 68,60 C68,68 60,75 50,75 C40,75 32,68 32,60 C32,52 40,45 50,45 Z" />
  <path
      android:fillColor="#FFFFFF"
      android:pathData="M43,60m-3,0a3,4 0,1 1,6 0a3,4 0,1 1,-6 0" />
  <path
      android:fillColor="#FFFFFF"
      android:pathData="M57,60m-3,0a3,4 0,1 1,6 0a3,4 0,1 1,-6 0" />
</vector>`;

// 3. ic_beef_rib.xml
const icBeefRib = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="64dp"
    android:height="64dp"
    android:viewportWidth="100"
    android:viewportHeight="100">
  <path
      android:fillColor="#D32F2F"
      android:pathData="M20,25 C45,10 80,15 88,40 C95,65 80,85 55,90 C25,95 10,75 12,50 C14,35 15,28 20,25 Z" />
  <!-- Marbling Streaks -->
  <path
      android:strokeColor="#FFFFFF"
      android:strokeWidth="4"
      android:strokeLineCap="round"
      android:pathData="M30,30 Q50,40 75,32" />
  <path
      android:strokeColor="#FFFFFF"
      android:strokeWidth="3.5"
      android:strokeLineCap="round"
      android:pathData="M25,50 Q55,60 78,50" />
  <path
      android:strokeColor="#FFFFFF"
      android:strokeWidth="3"
      android:strokeLineCap="round"
      android:pathData="M35,70 Q60,78 72,68" />
  <!-- Bone -->
  <path
      android:fillColor="#ECEFF1"
      android:strokeColor="#B0BEC5"
      android:strokeWidth="1.5"
      android:pathData="M14,42 C10,38 10,30 15,26 C20,22 26,26 28,30 L22,46 Z" />
</vector>`;

// Standard Icons
const icClose24 = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24"
    android:tint="?attr/colorControlNormal">
  <path
      android:fillColor="@android:color/white"
      android:pathData="M19,6.41L17.59,5 12,10.59 6.41,5 5,6.41 10.59,12 5,17.59 6.41,19 12,13.41 17.59,19 19,17.59 13.41,12z"/>
</vector>`;

const icArrowBack24 = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24"
    android:tint="?attr/colorControlNormal">
  <path
      android:fillColor="@android:color/white"
      android:pathData="M20,11H7.83l5.59,-5.59L12,4l-8,8 8,8 1.41,-1.41L7.83,13H20v-2z"/>
</vector>`;

const icWarning24 = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="#D32F2F"
      android:pathData="M1,21h22L12,2 1,21zM13,18h-2v-2h2v2zM13,14h-2v-4h2v4z"/>
</vector>`;

const icPower24 = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="#1976D2"
      android:pathData="M13,3h-2v10h2V3zM17.83,5.17l-1.42,1.42C17.99,7.86 19,9.81 19,12c0,3.87 -3.13,7 -7,7s-7,-3.13 -7,-7c0,-2.19 1.01,-4.14 2.58,-5.42L6.17,5.17C4.23,6.82 3,9.26 3,12c0,4.97 4.03,9 9,9s9,-4.03 9,-9c0,-2.74 -1.23,-5.18 -3.17,-6.83z"/>
</vector>`;

const icRefresh24 = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="#424242"
      android:pathData="M17.65,6.35C16.2,4.9 14.21,4 12,4c-4.42,0 -7.99,3.58 -7.99,8s3.57,8 7.99,8c3.73,0 6.84,-2.55 7.73,-6h-2.08c-0.82,2.33 -3.04,4 -5.65,4 -3.31,0 -6,-2.69 -6,-6s2.69,-6 6,-6c1.66,0 3.14,0.69 4.22,1.78L13,11h7V4l-2.35,2.35z"/>
</vector>`;

const icCheckCircle24 = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="#2E7D32"
      android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM10,17l-5,-5 1.41,-1.41L10,14.17l7.59,-7.59L19,8l-9,9z"/>
</vector>`;

const icError24 = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="#C62828"
      android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM13,17h-2v-2h2v2zM13,13h-2V7h2v6z"/>
</vector>`;

// Drawables for Backgrounds
const bgSpeechBubble = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="@color/speech_bubble_bg" />
    <stroke
        android:width="2dp"
        android:color="@color/speech_bubble_stroke" />
    <corners android:radius="16dp" />
    <padding
        android:bottom="10dp"
        android:left="14dp"
        android:right="14dp"
        android:top="10dp" />
</shape>`;

const bgOverlayDialog = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#FFFFFF" />
    <corners android:radius="24dp" />
    <stroke
        android:width="1dp"
        android:color="#E0E0E0" />
</shape>`;

const bgMeatCard = `<?xml version="1.0" encoding="utf-8"?>
<ripple xmlns:android="http://schemas.android.com/apk/res/android"
    android:color="#20000000">
    <item>
        <shape android:shape="rectangle">
            <solid android:color="#FFFFFF" />
            <corners android:radius="16dp" />
            <stroke
                android:width="1.5dp"
                android:color="#EAEAEA" />
        </shape>
    </item>
</ripple>`;

const bgCategoryPork = `<?xml version="1.0" encoding="utf-8"?>
<ripple xmlns:android="http://schemas.android.com/apk/res/android"
    android:color="#30C2185B">
    <item>
        <shape android:shape="rectangle">
            <gradient
                android:angle="315"
                android:startColor="#FFF0F5"
                android:endColor="#FCE4EC" />
            <corners android:radius="20dp" />
            <stroke
                android:width="2dp"
                android:color="#F48FB1" />
        </shape>
    </item>
</ripple>`;

const bgCategoryBeef = `<?xml version="1.0" encoding="utf-8"?>
<ripple xmlns:android="http://schemas.android.com/apk/res/android"
    android:color="#30B71C1C">
    <item>
        <shape android:shape="rectangle">
            <gradient
                android:angle="315"
                android:startColor="#FFF3E0"
                android:endColor="#FFEBEE" />
            <corners android:radius="20dp" />
            <stroke
                android:width="2dp"
                android:color="#EF9A9A" />
        </shape>
    </item>
</ripple>`;

// Pig Diagram Vectors for Android
const makeAndroidPigDiagram = (highlight) => {
  const isNeck = highlight === 'neck';
  const isHangjeong = highlight === 'hangjeong';
  const isGalmaegi = highlight === 'galmaegi';
  const isGabri = highlight === 'gabri';
  const isBelly = highlight === 'belly';
  const isSongi = highlight === 'songi';

  return `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="300dp"
    android:height="180dp"
    android:viewportWidth="400"
    android:viewportHeight="240">
  <!-- Card Background -->
  <path
      android:fillColor="#F5F5F5"
      android:pathData="M16,0 H384 A16,16 0 0,1 400,16 V224 A16,16 0 0,1 384,240 H16 A16,16 0 0,1 0,224 V16 A16,16 0 0,1 16,0 Z" />
  <!-- Base Silhouette -->
  <path
      android:fillColor="#BDBDBD"
      android:strokeColor="#757575"
      android:strokeWidth="2"
      android:pathData="M60,110 L20,115 L20,135 L50,145 L70,165 L70,185 L90,185 L95,155 L100,165 L100,185 L120,185 L125,165 L240,165 L240,185 L260,185 L270,155 L290,155 L300,185 L320,185 L320,120 C310,90 280,70 240,65 C210,60 160,60 120,65 C105,65 80,70 60,90 Z" />
  <!-- Neck (Ggodle) -->
  <path
      android:fillColor="${isNeck ? '#D32F2F' : '#E0E0E0'}"
      android:strokeColor="#616161"
      android:strokeWidth="2"
      android:pathData="M60,90 C80,70 105,65 120,65 L120,105 L75,115 Z" />
  <!-- Hangjeong (Jowl) -->
  <path
      android:fillColor="${isHangjeong ? '#D32F2F' : '#E0E0E0'}"
      android:strokeColor="#616161"
      android:strokeWidth="2"
      android:pathData="M50,135 L85,135 L95,155 L70,165 Z" />
  <!-- Gabri (Upper Loin) -->
  <path
      android:fillColor="${isGabri ? '#D32F2F' : '#E0E0E0'}"
      android:strokeColor="#616161"
      android:strokeWidth="2"
      android:pathData="M120,65 C160,60 210,60 240,65 L240,100 L120,100 Z" />
  <!-- Galmaegi (Diaphragm) -->
  <path
      android:fillColor="${isGalmaegi ? '#D32F2F' : '#E0E0E0'}"
      android:strokeColor="#616161"
      android:strokeWidth="2"
      android:pathData="M130,100 L230,100 L230,125 L130,125 Z" />
  <!-- Samgyeop (Belly) -->
  <path
      android:fillColor="${isBelly ? '#D32F2F' : '#E0E0E0'}"
      android:strokeColor="#616161"
      android:strokeWidth="2"
      android:pathData="M120,125 L240,125 L240,165 L120,165 Z" />
  <!-- Songi (Inner Rib) -->
  <path
      android:fillColor="${isSongi ? '#D32F2F' : '#E0E0E0'}"
      android:strokeColor="#FFFFFF"
      android:strokeWidth="2"
      android:pathData="M180,112m-12,0a12,12 0,1 1,24 0a12,12 0,1 1,-24 0" />
</vector>`;
};

// Cow Diagram Vector
const makeAndroidCowDiagram = () => {
  return `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="300dp"
    android:height="180dp"
    android:viewportWidth="400"
    android:viewportHeight="240">
  <!-- Card Background -->
  <path
      android:fillColor="#F5F5F5"
      android:pathData="M16,0 H384 A16,16 0 0,1 400,16 V224 A16,16 0 0,1 384,240 H16 A16,16 0 0,1 0,224 V16 A16,16 0 0,1 16,0 Z" />
  <!-- Cow Head & Horns -->
  <path
      android:fillColor="#BDBDBD"
      android:strokeColor="#757575"
      android:strokeWidth="2"
      android:pathData="M50,85 L25,95 L15,115 L45,135 L65,150 L65,185 L85,185 L90,145 Z" />
  <!-- Chuck & Neck -->
  <path
      android:fillColor="#E0E0E0"
      android:strokeColor="#757575"
      android:strokeWidth="2"
      android:pathData="M50,85 C75,70 100,65 115,65 L115,135 L65,140 Z" />
  <!-- Ribs / Galbi (HIGHLIGHTED) -->
  <path
      android:fillColor="#D32F2F"
      android:strokeColor="#B71C1C"
      android:strokeWidth="3"
      android:pathData="M115,65 L205,65 L205,135 L115,135 Z" />
  <!-- Loin & Sirloin -->
  <path
      android:fillColor="#E0E0E0"
      android:strokeColor="#757575"
      android:strokeWidth="2"
      android:pathData="M205,65 C240,65 270,70 290,80 L290,135 L205,135 Z" />
  <!-- Flank & Plate -->
  <path
      android:fillColor="#EEEEEE"
      android:strokeColor="#757575"
      android:strokeWidth="2"
      android:pathData="M115,135 L270,135 L260,165 L125,165 Z" />
  <!-- Round / Hind Leg -->
  <path
      android:fillColor="#BDBDBD"
      android:strokeColor="#757575"
      android:strokeWidth="2"
      android:pathData="M290,80 C320,95 330,120 330,150 L330,185 L310,185 L295,155 L260,165 Z" />
  <!-- Front Leg -->
  <path
      android:fillColor="#BDBDBD"
      android:strokeColor="#757575"
      android:strokeWidth="2"
      android:pathData="M95,155 L95,185 L115,185 L120,155 Z" />
</vector>`;
};

// Write files
fs.writeFileSync(path.join(resDir, 'ic_mascot_character.xml'), icMascotCharacter, 'utf8');
fs.writeFileSync(path.join(resDir, 'ic_pork_category.xml'), icPorkCategory, 'utf8');
fs.writeFileSync(path.join(resDir, 'ic_beef_rib.xml'), icBeefRib, 'utf8');
fs.writeFileSync(path.join(resDir, 'ic_close_24.xml'), icClose24, 'utf8');
fs.writeFileSync(path.join(resDir, 'ic_arrow_back_24.xml'), icArrowBack24, 'utf8');
fs.writeFileSync(path.join(resDir, 'ic_warning_24.xml'), icWarning24, 'utf8');
fs.writeFileSync(path.join(resDir, 'ic_power_24.xml'), icPower24, 'utf8');
fs.writeFileSync(path.join(resDir, 'ic_refresh_24.xml'), icRefresh24, 'utf8');
fs.writeFileSync(path.join(resDir, 'ic_check_circle_24.xml'), icCheckCircle24, 'utf8');
fs.writeFileSync(path.join(resDir, 'ic_error_24.xml'), icError24, 'utf8');

fs.writeFileSync(path.join(resDir, 'bg_speech_bubble.xml'), bgSpeechBubble, 'utf8');
fs.writeFileSync(path.join(resDir, 'bg_overlay_dialog.xml'), bgOverlayDialog, 'utf8');
fs.writeFileSync(path.join(resDir, 'bg_meat_card.xml'), bgMeatCard, 'utf8');
fs.writeFileSync(path.join(resDir, 'bg_category_pork.xml'), bgCategoryPork, 'utf8');
fs.writeFileSync(path.join(resDir, 'bg_category_beef.xml'), bgCategoryBeef, 'utf8');

fs.writeFileSync(path.join(resDir, 'pig_diagram_neck.xml'), makeAndroidPigDiagram('neck'), 'utf8');
fs.writeFileSync(path.join(resDir, 'pig_diagram_hangjeong.xml'), makeAndroidPigDiagram('hangjeong'), 'utf8');
fs.writeFileSync(path.join(resDir, 'pig_diagram_galmaegi.xml'), makeAndroidPigDiagram('galmaegi'), 'utf8');
fs.writeFileSync(path.join(resDir, 'pig_diagram_gabri.xml'), makeAndroidPigDiagram('gabri'), 'utf8');
fs.writeFileSync(path.join(resDir, 'pig_diagram_belly.xml'), makeAndroidPigDiagram('belly'), 'utf8');
fs.writeFileSync(path.join(resDir, 'pig_diagram_songi.xml'), makeAndroidPigDiagram('songi'), 'utf8');
fs.writeFileSync(path.join(resDir, 'cow_diagram_rib.xml'), makeAndroidCowDiagram(), 'utf8');

console.log('Android drawables generated successfully in app/src/main/res/drawable!');
