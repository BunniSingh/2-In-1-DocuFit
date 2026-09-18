/**
 * Generates realistic sample Indian ID Card images (Front & Back) on canvas
 * with slight tilt and background, so users can test perspective cropping & print layout.
 */
export function generateDemoCards(): { front: string; back: string } {
  // 1. Generate Front ID Card image
  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = 1200;
  frontCanvas.height = 800;
  const fCtx = frontCanvas.getContext('2d')!;

  // Wooden desk/table background texture
  fCtx.fillStyle = '#c8a882';
  fCtx.fillRect(0, 0, 1200, 800);
  // Desk grain lines
  fCtx.strokeStyle = 'rgba(160, 120, 80, 0.25)';
  fCtx.lineWidth = 4;
  for (let i = 0; i < 800; i += 30) {
    fCtx.beginPath();
    fCtx.moveTo(0, i);
    fCtx.lineTo(1200, i + 10);
    fCtx.stroke();
  }

  // Draw Card tilted at 4 degrees
  fCtx.save();
  fCtx.translate(600, 400);
  fCtx.rotate(0.06); // ~3.5 degree perspective angle
  fCtx.translate(-420, -260);

  // Card shadow
  fCtx.fillStyle = 'rgba(0,0,0,0.28)';
  fCtx.beginPath();
  fCtx.roundRect(8, 12, 840, 520, 20);
  fCtx.fill();

  // Card base
  fCtx.fillStyle = '#ffffff';
  fCtx.beginPath();
  fCtx.roundRect(0, 0, 840, 520, 20);
  fCtx.fill();

  // Top header: Tricolor stripe
  fCtx.fillStyle = '#ff9933';
  fCtx.fillRect(0, 0, 840, 16);
  fCtx.fillStyle = '#138808';
  fCtx.fillRect(0, 16, 840, 14);

  // Header Title
  fCtx.fillStyle = '#1e3a8a';
  fCtx.font = 'bold 24px Poppins, sans-serif';
  fCtx.fillText('भारत सरकार / GOVERNMENT OF INDIA', 160, 68);

  fCtx.fillStyle = '#475569';
  fCtx.font = '600 16px Poppins, sans-serif';
  fCtx.fillText('विशिष्ट पहचान प्राधिकरण / UNIQUE IDENTIFICATION AUTHORITY', 160, 94);

  // Card Holder Photo
  fCtx.fillStyle = '#e2e8f0';
  fCtx.fillRect(50, 130, 170, 210);
  fCtx.fillStyle = '#3b82f6';
  // Silhouette portrait
  fCtx.beginPath();
  fCtx.arc(135, 200, 45, 0, Math.PI * 2);
  fCtx.fill();
  fCtx.beginPath();
  fCtx.arc(135, 310, 75, Math.PI, 0, false);
  fCtx.fill();

  // Photo border
  fCtx.strokeStyle = '#94a3b8';
  fCtx.lineWidth = 2;
  fCtx.strokeRect(50, 130, 170, 210);

  // Details
  fCtx.fillStyle = '#0f172a';
  fCtx.font = 'bold 22px Poppins, sans-serif';
  fCtx.fillText('नाम / Name: राहुल कुमार शर्मा', 250, 165);

  fCtx.font = '500 18px Poppins, sans-serif';
  fCtx.fillStyle = '#334155';
  fCtx.fillText('Rahul Kumar Sharma', 250, 195);
  fCtx.fillText('जन्म तिथि / DOB: 15/08/1995', 250, 235);
  fCtx.fillText('लिंग / Gender: पुरुष / MALE', 250, 270);

  // Microchip icon
  fCtx.fillStyle = '#eab308';
  fCtx.fillRect(660, 140, 100, 75);
  fCtx.strokeStyle = '#ca8a04';
  fCtx.strokeRect(660, 140, 100, 75);

  // Card Number Box
  fCtx.fillStyle = '#f8fafc';
  fCtx.strokeStyle = '#cbd5e1';
  fCtx.lineWidth = 1.5;
  fCtx.beginPath();
  fCtx.roundRect(50, 390, 740, 68, 10);
  fCtx.fill();
  fCtx.stroke();

  fCtx.fillStyle = '#b91c1c';
  fCtx.font = 'bold 34px monospace';
  fCtx.textAlign = 'center';
  fCtx.fillText('XXXX  XXXX  8924', 420, 438);
  fCtx.textAlign = 'start';

  // Bottom tagline
  fCtx.fillStyle = '#1e3a8a';
  fCtx.font = 'bold 16px Poppins, sans-serif';
  fCtx.fillText('मेरा आधार, मेरी पहचान', 50, 495);

  fCtx.restore();

  // 2. Generate Back ID Card image
  const backCanvas = document.createElement('canvas');
  backCanvas.width = 1200;
  backCanvas.height = 800;
  const bCtx = backCanvas.getContext('2d')!;

  // Background
  bCtx.fillStyle = '#c8a882';
  bCtx.fillRect(0, 0, 1200, 800);
  bCtx.strokeStyle = 'rgba(160, 120, 80, 0.25)';
  bCtx.lineWidth = 4;
  for (let i = 0; i < 800; i += 30) {
    bCtx.beginPath();
    bCtx.moveTo(0, i);
    bCtx.lineTo(1200, i + 10);
    bCtx.stroke();
  }

  // Tilted at -3 degrees
  bCtx.save();
  bCtx.translate(600, 400);
  bCtx.rotate(-0.05);
  bCtx.translate(-420, -260);

  // Card shadow
  bCtx.fillStyle = 'rgba(0,0,0,0.28)';
  bCtx.beginPath();
  bCtx.roundRect(8, 12, 840, 520, 20);
  bCtx.fill();

  // Card base
  bCtx.fillStyle = '#ffffff';
  bCtx.beginPath();
  bCtx.roundRect(0, 0, 840, 520, 20);
  bCtx.fill();

  // Top header stripe
  bCtx.fillStyle = '#1e3a8a';
  bCtx.fillRect(0, 0, 840, 25);

  // Address in Hindi & English
  bCtx.fillStyle = '#0f172a';
  bCtx.font = 'bold 20px Poppins, sans-serif';
  bCtx.fillText('पता / Address:', 50, 70);

  bCtx.font = '500 17px Poppins, sans-serif';
  bCtx.fillStyle = '#334155';
  bCtx.fillText('आत्मज: श्री महेन्द्र शर्मा, मकान सं. 42-बी,', 50, 105);
  bCtx.fillText('विकास नगर, मुख्य बाज़ार, जयपुर, राजस्थान - 302001', 50, 135);

  bCtx.fillText('S/O: Shri Mahendra Sharma, House No. 42-B,', 50, 175);
  bCtx.fillText('Vikas Nagar, Main Market, Jaipur, Rajasthan - 302001', 50, 205);

  // QR Code placeholder on right
  bCtx.fillStyle = '#0f172a';
  bCtx.fillRect(580, 70, 210, 210);
  bCtx.fillStyle = '#ffffff';
  bCtx.fillRect(590, 80, 190, 190);

  // QR patterns
  bCtx.fillStyle = '#0f172a';
  // corner squares
  bCtx.fillRect(600, 90, 45, 45);
  bCtx.fillStyle = '#ffffff';
  bCtx.fillRect(608, 98, 29, 29);
  bCtx.fillStyle = '#0f172a';
  bCtx.fillRect(616, 106, 13, 13);

  bCtx.fillRect(715, 90, 45, 45);
  bCtx.fillStyle = '#ffffff';
  bCtx.fillRect(723, 98, 29, 29);
  bCtx.fillStyle = '#0f172a';
  bCtx.fillRect(731, 106, 13, 13);

  bCtx.fillRect(600, 205, 45, 45);
  bCtx.fillStyle = '#ffffff';
  bCtx.fillRect(608, 213, 29, 29);
  bCtx.fillStyle = '#0f172a';
  bCtx.fillRect(616, 221, 13, 13);

  // random QR dots
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if ((r + c) % 2 === 0) {
        bCtx.fillRect(660 + c * 10, 100 + r * 16, 8, 8);
      }
    }
  }

  // Security holographic stripe
  bCtx.fillStyle = '#e2e8f0';
  bCtx.fillRect(50, 310, 740, 40);
  bCtx.fillStyle = '#64748b';
  bCtx.font = '600 15px Poppins, sans-serif';
  bCtx.fillText('हेल्पलाइन: 1947 | ई-मेल: help@uidai.gov.in | वेबसाइट: www.uidai.gov.in', 70, 335);

  // Card Number Box
  bCtx.fillStyle = '#f8fafc';
  bCtx.strokeStyle = '#cbd5e1';
  bCtx.lineWidth = 1.5;
  bCtx.beginPath();
  bCtx.roundRect(50, 380, 740, 68, 10);
  bCtx.fill();
  bCtx.stroke();

  bCtx.fillStyle = '#b91c1c';
  bCtx.font = 'bold 34px monospace';
  bCtx.textAlign = 'center';
  bCtx.fillText('XXXX  XXXX  8924', 420, 428);
  bCtx.textAlign = 'start';

  // Bottom Tricolor
  bCtx.fillStyle = '#ff9933';
  bCtx.fillRect(0, 490, 840, 15);
  bCtx.fillStyle = '#138808';
  bCtx.fillRect(0, 505, 840, 15);

  bCtx.restore();

  return {
    front: frontCanvas.toDataURL('image/jpeg', 0.92),
    back: backCanvas.toDataURL('image/jpeg', 0.92)
  };
}
