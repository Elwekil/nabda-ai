/**
 * Local Medical Image Analysis Service
 * Analyzes medical images locally using Tesseract.js (OCR), TensorFlow.js.
 * No external API calls are made — all processing is 100% local.
 * No Ollama required - uses intelligent rule-based analysis.
 */

const Tesseract = require('tesseract.js');
let tf = null;
try {
  tf = require('@tensorflow/tfjs');
} catch (err) {
  console.warn('⚠️  TensorFlow.js failed to load. Image feature extraction will be limited.');
}
const sharp = require('sharp');
const pdfParse = require('pdf-parse');
const { pool } = require('../Config/db');

// ---------------------------------------------------------------------------
// OCR — extract text from image buffer
// ---------------------------------------------------------------------------

/**
 * Extract text from an image buffer using Tesseract.js OCR.
 * @param {Buffer} imageBuffer
 * @returns {Promise<string>}
 */
async function extractTextFromImage(imageBuffer) {
  try {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'ara+eng', {
      logger: () => {}, // suppress progress logs
    });
    return (text || '').trim();
  } catch (err) {
    console.error('OCR extraction failed:', err.message);
    return '';
  }
}

// ---------------------------------------------------------------------------
// TensorFlow.js — extract simple image features
// ---------------------------------------------------------------------------

/**
 * Extract basic image features using TensorFlow.js.
 * Returns a plain object with statistical features derived from the image tensor.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{mean: number, std: number, min: number, max: number, shape: number[]}>}
 */
async function extractFeaturesWithTF(imageBuffer) {
  // If TensorFlow.js is not available, return fallback values
  if (!tf) {
    return { mean: 0.5, std: 0.1, min: 0, max: 1, shape: [224, 224, 3] };
  }

  try {
    // Note: tfjs (pure) doesn't have tf.node.decodeImage. 
    // We use sharp to get raw pixels first which is more reliable on Vercel.
    const { data, info } = await sharp(imageBuffer)
      .resize(224, 224)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3]);
    const normalized = tensor.div(255.0);

    const [mean, variance] = tf.moments(normalized);
    const minVal = normalized.min();
    const maxVal = normalized.max();

    const [meanVal, varVal, minV, maxV] = await Promise.all([
      mean.data(),
      variance.data(),
      minVal.data(),
      maxVal.data(),
    ]);

    // Clean up tensors
    tensor.dispose();
    normalized.dispose();
    mean.dispose();
    variance.dispose();
    minVal.dispose();
    maxVal.dispose();

    return {
      mean: parseFloat(meanVal[0].toFixed(4)),
      std: parseFloat(Math.sqrt(varVal[0]).toFixed(4)),
      min: parseFloat(minV[0].toFixed(4)),
      max: parseFloat(maxV[0].toFixed(4)),
      shape: [224, 224, 3],
    };
  } catch (err) {
    console.error('TF feature extraction failed:', err.message);
    return { mean: 0.5, std: 0.1, min: 0, max: 1, shape: [224, 224, 3] };
  }
}

// ---------------------------------------------------------------------------
// Parse medical values from extracted text
// ---------------------------------------------------------------------------

/**
 * Common medical test patterns: name, value, unit, normal range.
 * Covers Arabic and English lab report formats.
 */
const MEDICAL_PATTERNS = [
  // Glucose / سكر
  { name: 'Glucose', regex: /glucose[:\s]+(\d+\.?\d*)\s*(mg\/dl|mmol\/l)?/i, unit: 'mg/dL', normalMin: 70, normalMax: 100 },
  { name: 'Hemoglobin', regex: /h[ae]moglobin[:\s]+(\d+\.?\d*)\s*(g\/dl)?/i, unit: 'g/dL', normalMin: 12, normalMax: 17 },
  { name: 'WBC', regex: /wbc[:\s]+(\d+\.?\d*)\s*(k\/ul|10\^3)?/i, unit: 'K/uL', normalMin: 4.5, normalMax: 11 },
  { name: 'RBC', regex: /rbc[:\s]+(\d+\.?\d*)\s*(m\/ul|10\^6)?/i, unit: 'M/uL', normalMin: 4.2, normalMax: 5.9 },
  { name: 'Platelets', regex: /platelet[s]?[:\s]+(\d+\.?\d*)\s*(k\/ul|10\^3)?/i, unit: 'K/uL', normalMin: 150, normalMax: 400 },
  { name: 'Creatinine', regex: /creatinine[:\s]+(\d+\.?\d*)\s*(mg\/dl)?/i, unit: 'mg/dL', normalMin: 0.6, normalMax: 1.2 },
  { name: 'Cholesterol', regex: /cholesterol[:\s]+(\d+\.?\d*)\s*(mg\/dl)?/i, unit: 'mg/dL', normalMin: 0, normalMax: 200 },
  { name: 'Triglycerides', regex: /triglyceride[s]?[:\s]+(\d+\.?\d*)\s*(mg\/dl)?/i, unit: 'mg/dL', normalMin: 0, normalMax: 150 },
  { name: 'HDL', regex: /hdl[:\s]+(\d+\.?\d*)\s*(mg\/dl)?/i, unit: 'mg/dL', normalMin: 40, normalMax: 60 },
  { name: 'LDL', regex: /ldl[:\s]+(\d+\.?\d*)\s*(mg\/dl)?/i, unit: 'mg/dL', normalMin: 0, normalMax: 100 },
  { name: 'ALT', regex: /alt[:\s]+(\d+\.?\d*)\s*(u\/l|iu\/l)?/i, unit: 'U/L', normalMin: 7, normalMax: 56 },
  { name: 'AST', regex: /ast[:\s]+(\d+\.?\d*)\s*(u\/l|iu\/l)?/i, unit: 'U/L', normalMin: 10, normalMax: 40 },
  { name: 'TSH', regex: /tsh[:\s]+(\d+\.?\d*)\s*(miu\/l|uiu\/ml)?/i, unit: 'mIU/L', normalMin: 0.4, normalMax: 4.0 },
  // Additional blood tests
  { name: 'Urea', regex: /urea[:\s]+(\d+\.?\d*)\s*(mg\/dl)?/i, unit: 'mg/dL', normalMin: 15, normalMax: 45 },
  { name: 'Uric Acid', regex: /uric\s*acid[:\s]+(\d+\.?\d*)\s*(mg\/dl)?/i, unit: 'mg/dL', normalMin: 3.5, normalMax: 7.2 },
  { name: 'Albumin', regex: /albumin[:\s]+(\d+\.?\d*)\s*(g\/dl)?/i, unit: 'g/dL', normalMin: 3.5, normalMax: 5.5 },
  { name: 'Total Protein', regex: /total\s*protein[:\s]+(\d+\.?\d*)\s*(g\/dl)?/i, unit: 'g/dL', normalMin: 6.0, normalMax: 8.3 },
  { name: 'Bilirubin', regex: /bilirubin[:\s]+(\d+\.?\d*)\s*(mg\/dl)?/i, unit: 'mg/dL', normalMin: 0.2, normalMax: 1.2 },
  { name: 'Iron', regex: /iron[:\s]+(\d+\.?\d*)\s*(ug\/dl)?/i, unit: 'µg/dL', normalMin: 60, normalMax: 170 },
  { name: 'Ferritin', regex: /ferritin[:\s]+(\d+\.?\d*)\s*(ng\/ml)?/i, unit: 'ng/mL', normalMin: 20, normalMax: 200 },
  { name: 'Vitamin D', regex: /vitamin\s*d[:\s]+(\d+\.?\d*)\s*(ng\/ml)?/i, unit: 'ng/mL', normalMin: 30, normalMax: 100 },
  { name: 'Vitamin B12', regex: /b12[:\s]+(\d+\.?\d*)\s*(pg\/ml)?/i, unit: 'pg/mL', normalMin: 200, normalMax: 900 },
  { name: 'Calcium', regex: /calcium[:\s]+(\d+\.?\d*)\s*(mg\/dl)?/i, unit: 'mg/dL', normalMin: 8.5, normalMax: 10.5 },
  { name: 'Phosphorus', regex: /phosphorus[:\s]+(\d+\.?\d*)\s*(mg\/dl)?/i, unit: 'mg/dL', normalMin: 2.5, normalMax: 4.5 },
  { name: 'Magnesium', regex: /magnesium[:\s]+(\d+\.?\d*)\s*(mg\/dl)?/i, unit: 'mg/dL', normalMin: 1.7, normalMax: 2.2 },
  { name: 'Sodium', regex: /sodium[:\s]+(\d+\.?\d*)\s*(meq\/l)?/i, unit: 'mEq/L', normalMin: 136, normalMax: 145 },
  { name: 'Potassium', regex: /potassium[:\s]+(\d+\.?\d*)\s*(meq\/l)?/i, unit: 'mEq/L', normalMin: 3.5, normalMax: 5.0 },
  { name: 'Chloride', regex: /chloride[:\s]+(\d+\.?\d*)\s*(meq\/l)?/i, unit: 'mEq/L', normalMin: 98, normalMax: 106 },
  { name: 'HbA1c', regex: /hba1c[:\s]+(\d+\.?\d*)\s*%?/i, unit: '%', normalMin: 4.0, normalMax: 5.6 },
  // Arabic patterns
  { name: 'سكر الدم', regex: /سكر[:\s]+(\d+\.?\d*)/i, unit: 'mg/dL', normalMin: 70, normalMax: 100 },
  { name: 'هيموجلوبين', regex: /هيمoglobين[:\s]+(\d+\.?\d*)/i, unit: 'g/dL', normalMin: 12, normalMax: 17 },
  { name: 'كريات بيضاء', regex: /كريات\s*بيضاء[:\s]+(\d+\.?\d*)/i, unit: 'K/uL', normalMin: 4.5, normalMax: 11 },
  { name: 'كريات حمراء', regex: /كريات\s*حمراء[:\s]+(\d+\.?\d*)/i, unit: 'M/uL', normalMin: 4.2, normalMax: 5.9 },
  { name: 'صفائح الدم', regex: /صفائح[:\s]+(\d+\.?\d*)/i, unit: 'K/uL', normalMin: 150, normalMax: 400 },
  { name: 'كرياتينين', regex: /كرياتينين[:\s]+(\d+\.?\d*)/i, unit: 'mg/dL', normalMin: 0.6, normalMax: 1.2 },
  { name: 'كوليسترول', regex: /كوليسترول[:\s]+(\d+\.?\d*)/i, unit: 'mg/dL', normalMin: 0, normalMax: 200 },
  { name: 'دهون ثلاثية', regex: /دهون\s*ثلاثية[:\s]+(\d+\.?\d*)/i, unit: 'mg/dL', normalMin: 0, normalMax: 150 },
  { name: 'يوريا', regex: /يوريا[:\s]+(\d+\.?\d*)/i, unit: 'mg/dL', normalMin: 15, normalMax: 45 },
  { name: 'حمض يوريك', regex: /حمض\s*يوريك[:\s]+(\d+\.?\d*)/i, unit: 'mg/dL', normalMin: 3.5, normalMax: 7.2 },
  { name: 'حديد', regex: /حديد[:\s]+(\d+\.?\d*)/i, unit: 'µg/dL', normalMin: 60, normalMax: 170 },
  { name: 'كالسيوم', regex: /كالسيوم[:\s]+(\d+\.?\d*)/i, unit: 'mg/dL', normalMin: 8.5, normalMax: 10.5 },
  { name: 'صوديوم', regex: /صوديوم[:\s]+(\d+\.?\d*)/i, unit: 'mEq/L', normalMin: 136, normalMax: 145 },
  { name: 'بوتاسيوم', regex: /بوتاسيوم[:\s]+(\d+\.?\d*)/i, unit: 'mEq/L', normalMin: 3.5, normalMax: 5.0 },
];

/**
 * Parse medical values from OCR text using known patterns.
 * @param {string} text
 * @param {object} features  TF features (used for confidence weighting)
 * @returns {Array<{name: string, value: string, unit: string, normalRange: {min: number, max: number}, isAbnormal: boolean}>}
 */
function parseValuesFromText(text, features) {
  const values = [];

  for (const pattern of MEDICAL_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      const numericValue = parseFloat(match[1]);
      const isAbnormal = numericValue < pattern.normalMin || numericValue > pattern.normalMax;
      values.push({
        name: pattern.name,
        value: match[1],
        unit: pattern.unit,
        normalRange: { min: pattern.normalMin, max: pattern.normalMax },
        isAbnormal,
      });
    }
  }

  return values;
}

// ---------------------------------------------------------------------------
// Confidence score calculation
// ---------------------------------------------------------------------------

/**
 * Calculate a confidence score (0–100) based on OCR text quality,
 * number of parsed values, and TF feature quality.
 * @param {string} text
 * @param {Array} values
 * @param {object} features
 * @returns {number}  integer between 0 and 100
 */
function calculateConfidence(text, values, features) {
  let score = 0;

  // Text length contribution (up to 40 points)
  const textLen = (text || '').trim().length;
  if (textLen > 500) score += 40;
  else if (textLen > 200) score += 30;
  else if (textLen > 50) score += 20;
  else if (textLen > 10) score += 10;

  // Parsed values contribution (up to 40 points)
  const valCount = (values || []).length;
  if (valCount >= 5) score += 40;
  else if (valCount >= 3) score += 30;
  else if (valCount >= 1) score += 20;

  // TF feature quality (up to 20 points)
  // A well-scanned image has reasonable contrast (std > 0.05)
  if (features && features.std > 0.15) score += 20;
  else if (features && features.std > 0.05) score += 10;

  // Clamp to [0, 100]
  return Math.min(100, Math.max(0, score));
}

// ---------------------------------------------------------------------------
// Detect abnormal values and build warning strings
// ---------------------------------------------------------------------------

/**
 * Build warning strings for any abnormal medical values.
 * @param {Array} values
 * @returns {string[]}
 */
function detectAbnormalValues(values) {
  const warnings = [];
  for (const v of values) {
    if (v.isAbnormal) {
      warnings.push(
        `تحذير: قيمة ${v.name} = ${v.value} ${v.unit} خارج النطاق الطبيعي (${v.normalRange.min}–${v.normalRange.max} ${v.unit})`
      );
    }
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Medication extraction from prescriptions
// ---------------------------------------------------------------------------

/**
 * Common medication names (Arabic and English) with their patterns
 */
const MEDICATION_PATTERNS = [
  // Pain relievers / مسكنات
  { name: 'Ibuprofen', arabic: 'ايبوبروفين', keywords: ['ibuprofen', 'brufen', 'advil', 'ايبوبروفين', 'بروفين'] },
  { name: 'Paracetamol', arabic: 'باراسيتامول', keywords: ['paracetamol', 'acetaminophen', 'panadol', 'calpol', 'باراسيتامول', 'بنادول', 'كيلوبول'] },
  { name: 'Aspirin', arabic: 'أسبرين', keywords: ['aspirin', 'aspirin', 'أسبرين'] },
  { name: 'Diclofenac', arabic: 'ديكلوفيناك', keywords: ['diclofenac', 'cataflam', 'voltaren', 'ديكلوفيناك', 'كاتافلام'] },
  { name: 'Tramadol', arabic: 'ترامادول', keywords: ['tramadol', 'ultram', 'tramadex', 'ترامادول'] },
  { name: 'Naproxen', arabic: 'نابروكسين', keywords: ['naproxen', 'naprosyn', 'نابروكسين'] },
  
  // Antibiotics / مضادات حيوية
  { name: 'Amoxicillin', arabic: 'أموكسيسيلين', keywords: ['amoxicillin', 'amoxil', 'moxatag', 'أموكسيسيلين', 'أموكسيل'] },
  { name: 'Azithromycin', arabic: 'أزيثرومايسين', keywords: ['azithromycin', 'zithromax', 'azithro', 'أزيثرومايسين', 'زيثروماكس'] },
  { name: 'Ciprofloxacin', arabic: 'سيبروفلوكساسين', keywords: ['ciprofloxacin', 'cipro', 'cipxl', 'سيبروفلوكساسين', 'سيبرو'] },
  { name: 'Metronidazole', arabic: 'ميترونيدازول', keywords: ['metronidazole', 'flagyl', 'ميترونيدازول', 'فلاجيل'] },
  { name: 'Cefotaxime', arabic: 'سيفوتاكسيم', keywords: ['cefotaxime', 'claforan', 'سيفوتاكسيم', 'كلافوران'] },
  { name: 'Ceftriaxone', arabic: 'سيفترياكسون', keywords: ['ceftriaxone', 'rocephin', 'سيفترياكسون', 'روسيفين'] },
  { name: 'Doxycycline', arabic: 'دوكسي سيكلين', keywords: ['doxycycline', 'vibramycin', 'دوكسي سيكلين', 'فيبرامايسين'] },
  
  // Diabetes / سكري
  { name: 'Metformin', arabic: 'ميتفورمين', keywords: ['metformin', 'glucophage', 'ميتفورمين', 'جلوكوفاج'] },
  { name: 'Glimepiride', arabic: 'غليمبيريد', keywords: ['glimepiride', 'amaryl', 'غليمبيريد', 'أماريل'] },
  { name: 'Gliclazide', arabic: 'غليكلازيد', keywords: ['gliclazide', 'diamicron', 'غليكلازيد', 'دايميكрон'] },
  
  // Blood pressure / ضغط الدم
  { name: 'Amlodipine', arabic: 'أملوديبين', keywords: ['amlodipine', 'norvasc', 'أملوديبين', 'نورفاسك'] },
  { name: 'Losartan', arabic: 'لوزارتان', keywords: ['losartan', 'cozaar', 'لوزارتان', 'كوزار'] },
  { name: 'Atenolol', arabic: 'أتينولول', keywords: ['atenolol', 'tenormin', 'أتينولول', 'تينورمين'] },
  { name: 'Captopril', arabic: 'كابتوبريل', keywords: ['captopril', 'capoten', 'كابتوبريل', 'كابوتين'] },
  { name: 'Hydrochlorothiazide', arabic: 'هيدروكلوروثيازيد', keywords: ['hydrochlorothiazide', 'hctz', 'microzide', 'هيدروكلوروثيازيد'] },
  
  // Heart / قلب
  { name: 'Atorvastatin', arabic: 'أتورفاستاتين', keywords: ['atorvastatin', 'lipitor', 'أتورفاستاتين', 'ليبيتور'] },
  { name: 'Rosuvastatin', arabic: 'روسوفاستاتين', keywords: ['rosuvastatin', 'crestor', 'روسوفاستاتين', 'كريستور'] },
  { name: 'Aspirin (Cardio)', arabic: 'أسبرين للقلب', keywords: ['aspirin cardio', 'cardio aspirin', 'أسبرين قلب'] },
  
  // Stomach / معدة
  { name: 'Omeprazole', arabic: 'أوميبرازول', keywords: ['omeprazole', 'prilosec', 'أوميبرازول', 'بريلوسيك'] },
  { name: 'Pantoprazole', arabic: 'بانتوبرازول', keywords: ['pantoprazole', 'protonix', 'بانتوبرازول', 'برتونيكس'] },
  { name: 'Domperidone', arabic: 'دومبيريدون', keywords: ['domperidone', 'motilium', 'دومبيريدون', 'موتيليوم'] },
  { name: 'Ranitidine', arabic: 'رانيتيدين', keywords: ['ranitidine', 'zantac', 'رانيتيدين', 'زانتاك'] },
  
  // Allergy / حساسية
  { name: 'Cetirizine', arabic: 'سيتريزين', keywords: ['cetirizine', 'zyrtec', 'سيتريزين', 'زيرتك'] },
  { name: 'Loratadine', arabic: 'لوراتادين', keywords: ['loratadine', 'claritin', 'لوراتادين', 'كلاريتين'] },
  { name: 'Chlorpheniramine', arabic: 'كلورفينيرامين', keywords: ['chlorpheniramine', 'piriton', 'كلورفينيرامين', 'بيريتون'] },
  
  // Vitamins & Supplements / فيتامينات
  { name: 'Vitamin D', arabic: 'فيتامين د', keywords: ['vitamin d', 'cholecalciferol', 'فيتامين د', 'كولي كالسيفيرول'] },
  { name: 'Vitamin B12', arabic: 'فيتامين ب12', keywords: ['vitamin b12', 'cobalamin', 'b12', 'فيتامين ب12'] },
  { name: 'Ferrous Sulfate', arabic: 'حديد', keywords: ['ferrous sulfate', 'iron', 'حديد', 'فيروس سلفات'] },
  { name: 'Folic Acid', arabic: 'حمض الفوليك', keywords: ['folic acid', 'folate', 'حمض الفوليك'] },
  
  // Thyroid / غدة
  { name: 'Levothyroxine', arabic: 'ليفوثيروكسين', keywords: ['levothyroxine', 'synthroid', 'ليفوثيروكسين', 'سينثرويد'] },
  
  // Respiratory / تنفس
  { name: 'Salbutamol', arabic: 'سالبوتamol', keywords: ['salbutamol', 'ventolin', 'سالبوتamol', 'فنتولين'] },
  { name: 'Montelukast', arabic: 'مونتيلوكاست', keywords: ['montelukast', 'singulair', 'مونتيلوكاست', 'سينجولير'] },
];

/**
 * Extract medication names from prescription text
 * @param {string} text
 * @returns {Array<{name: string, dosage: string, frequency: string}>}
 */
function extractMedicationNames(text) {
  const medications = [];
  const textLower = text.toLowerCase();
  
  for (const med of MEDICATION_PATTERNS) {
    for (const keyword of med.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        // Check if this medication is already added
        if (!medications.some(m => m.name === med.name)) {
          // Try to extract dosage and frequency
          const dosage = extractDosage(text, keyword);
          const frequency = extractFrequency(text, keyword);
          
          medications.push({
            name: med.name,
            arabicName: med.arabic,
            dosage: dosage,
            frequency: frequency
          });
        }
        break;
      }
    }
  }
  
  return medications;
}

/**
 * Extract dosage information from text near medication keyword
 * @param {string} text
 * @param {string} keyword
 * @returns {string}
 */
function extractDosage(text, keyword) {
  const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (keywordIndex === -1) return '';
  
  // Look for dosage patterns in the surrounding text (50 chars before and after)
  const start = Math.max(0, keywordIndex - 30);
  const end = Math.min(text.length, keywordIndex + 50);
  const context = text.substring(start, end);
  
  // Common dosage patterns
  const dosagePatterns = [
    /(\d+\s*mg)/i,
    /(\d+\s*ml)/i,
    /(\d+\s*g)/i,
    /(\d+\s*mcg)/i,
    /(\d+\s*iu)/i,
    /(\d+\s*%)/i,
    /(\d+\s*قرص)/i,
    /(\d+\s*كبسولة)/i,
    /(\d+\s*حقنة)/i,
  ];
  
  for (const pattern of dosagePatterns) {
    const match = context.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return '';
}

/**
 * Extract frequency information from text near medication keyword
 * @param {string} text
 * @param {string} keyword
 * @returns {string}
 */
function extractFrequency(text, keyword) {
  const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (keywordIndex === -1) return '';
  
  const start = Math.max(0, keywordIndex - 20);
  const end = Math.min(text.length, keywordIndex + 60);
  const context = text.substring(start, end);
  
  // Common frequency patterns
  const frequencyPatterns = [
    { pattern: /مرة\s*واحدة/i, value: 'مرة واحدة daily' },
    { pattern: /مرتين/i, value: 'مرتين daily' },
    { pattern: /ثلاث\s*مرات/i, value: '3 مرات daily' },
    { pattern: /اربع\s*مرات/i, value: '4 مرات daily' },
    { pattern: /كل\s*(\d+)\s*ساعة/i, value: 'كل $1 ساعة' },
    { pattern: /كل\s*(\d+)\s*ساعات/i, value: 'كل $1 ساعات' },
    { pattern: /every\s*(\d+)\s*hours?/i, value: 'Every $1 hours' },
    { pattern: /(\d+)\s*times?\s*a\s*day/i, value: '$1 times a day' },
    { pattern: /once\s*a\s*day/i, value: 'Once daily' },
    { pattern: /twice\s*a\s*day/i, value: 'Twice daily' },
    { pattern: /three\s*times\s*a\s*day/i, value: '3 times a day' },
    { pattern: /at\s*night/i, value: 'At night' },
    { pattern: /at\s*bedtime/i, value: 'At bedtime' },
    { pattern: /before\s*meals/i, value: 'Before meals' },
    { pattern: /after\s*meals/i, value: 'After meals' },
    { pattern: /with\s*meals/i, value: 'With meals' },
    { pattern: /before\s*food/i, value: 'Before food' },
    { pattern: /after\s*food/i, value: 'After food' },
  ];
  
  for (const freq of frequencyPatterns) {
    if (freq.pattern.test(context)) {
      return freq.value;
    }
  }
  
  return '';
}

/**
 * Get warnings for specific medications
 * @param {Array} medications
 * @returns {string[]}
 */
function getMedicationWarnings(medications) {
  const warnings = [];
  const medNames = medications.map(m => m.name.toLowerCase());
  
  // Check for potential interactions or special warnings
  const warningRules = [
    {
      meds: ['tramadol', 'paracetamol'],
      warning: '⚠️谨慎: ترامادول وباراسيتامول - لا تتناولهما معاً بدون إشراف طبي'
    },
    {
      meds: ['warfarin', 'aspirin'],
      warning: '⚠️ تحذير: وارفارين وأسبرين - زيادة خطر النزيف'
    },
    {
      meds: ['metformin', 'alcohol'],
      warning: '⚠️ تحذير: ميتفورمين والكحول - تجنب الكحول أثناء العلاج'
    },
    {
      meds: ['ciprofloxacin', 'dairy'],
      warning: '⚠️ تحذير: سيبروفلوكساسين - تجنب منتجات الألبان'
    },
    {
      meds: ['atorvastatin', 'grapefruit'],
      warning: '⚠️ تحذير: أتورفاستاتين - تجنب الجريب فروت'
    },
  ];
  
  for (const rule of warningRules) {
    const hasAllMeds = rule.meds.every(m => medNames.some(med => med.includes(m)));
    if (hasAllMeds) {
      warnings.push(rule.warning);
    }
  }
  
  // Individual medication warnings
  const individualWarnings = {
    'warfarin': '⚠️ وارفارين: يتطلب مراقبة منتظمة INR',
    'metformin': '⚠️ ميتفورمين: قد يسبب اضطراب في الجهاز الهضمي',
    'levothyroxine': '⚠️ ليفوثيروكسين: تناول على معدة فارغة',
    'omeprazole': '⚠️ أوميبرازيل: لا تتناوله لفترة طويلة بدون إشراف طبي',
    'chlorpheniramine': '⚠️ كلورفينيرامين: قد يسبب النعاس',
    'tramadol': '⚠️ ترامادول: قد يسبب إدماناً - استخدم بحذر',
  };
  
  for (const med of medications) {
    const lowerName = med.name.toLowerCase();
    for (const [key, warning] of Object.entries(individualWarnings)) {
      if (lowerName.includes(key)) {
        warnings.push(warning);
        break;
      }
    }
  }
  
  return warnings;
}

// ---------------------------------------------------------------------------
// Ollama prompt builder with fallback medical analysis
// ---------------------------------------------------------------------------

/**
 * Fallback medical analysis when Ollama is unavailable.
 * Provides intelligent analysis based on extracted values and document type.
 */
function generateFallbackAnalysis(extractedText, medicalValues, documentType) {
  let analysis = '';
  const treatments = [];
  const warnings = [];

  // Analyze based on document type
  if (documentType === 'lab_report' || documentType === 'medical_report') {
    analysis = '📋 تحليل التقرير الطبي:\n\n';
    
    if (medicalValues.length === 0) {
      analysis += 'لم يتم استخراج قيم طبية محددة من التقرير. قد يكون النص غير واضح أو التقرير يحتاج إلى مراجعة يدوية.\n\n';
      warnings.push('⚠️ جودة الصورة منخفضة - يُنصح بإعادة المسح بدقة أعلى');
    } else {
      analysis += `تم استخراج ${medicalValues.length} قيمة طبية من التقرير:\n\n`;
      
      // Analyze each value
      medicalValues.forEach(v => {
        if (v.isAbnormal) {
          analysis += `🔴 ${v.name}: ${v.value} ${v.unit}\n`;
          analysis += `   - القيمة الطبيعية: ${v.normalRange.min}-${v.normalRange.max} ${v.unit}\n`;
          
          // Specific analysis based on test name
          if (v.name.toLowerCase().includes('glucose') || v.name.includes('سكر')) {
            const val = parseFloat(v.value);
            if (val > v.normalRange.max) {
              analysis += `   - التفسير: ارتفاع في مستوى السكر (قد يشير إلى مقدمات السكري أو السكري)\n`;
              treatments.push({
                priority: 'high',
                description: 'مراجعة طبيب الغدد الصماء لتقييم مستوى السكر',
                medications: ['قد يحتاج ميتفورمين حسب تقييم الطبيب'],
                lifestyle: ['تقليل السكريات', 'ممارسة الرياضة 30 دقيقة يومياً', 'فحص السكر بانتظام']
              });
            } else if (val < v.normalRange.min) {
              analysis += `   - التفسير: انخفاض في مستوى السكر (نقص سكر الدم)\n`;
              warnings.push('⚠️ انخفاض السكر قد يسبب دوخة وإغماء - تناول عصير أو حلوى فوراً');
            }
          } else if (v.name.toLowerCase().includes('hemoglobin') || v.name.includes('هيموجلوبين')) {
            const val = parseFloat(v.value);
            if (val < v.normalRange.min) {
              analysis += `   - التفسير: انخفاض الهيموجلوبين (فقر الدم/أنيميا)\n`;
              treatments.push({
                priority: 'medium',
                description: 'علاج فقر الدم',
                medications: ['مكملات الحديد (فيروجلوبين، فيروفول)', 'فيتامين B12', 'حمض الفوليك'],
                lifestyle: ['تناول اللحوم الحمراء', 'السبانخ والخضروات الورقية', 'البقوليات', 'تجنب الشاي مع الوجبات']
              });
            }
          } else if (v.name.toLowerCase().includes('wbc') || v.name.includes('كريات بيضاء')) {
            const val = parseFloat(v.value);
            if (val > v.normalRange.max) {
              analysis += `   - التفسير: ارتفاع كريات الدم البيضاء (قد يشير إلى عدوى أو التهاب)\n`;
              warnings.push('⚠️ ارتفاع WBC قد يشير إلى عدوى - استشر طبيبك فوراً');
            }
          } else if (v.name.toLowerCase().includes('creatinine') || v.name.includes('كرياتينين')) {
            const val = parseFloat(v.value);
            if (val > v.normalRange.max) {
              analysis += `   - التفسير: ارتفاع الكرياتينين (قد يشير إلى مشكلة في الكلى)\n`;
              treatments.push({
                priority: 'high',
                description: 'مراجعة طبيب الكلى',
                medications: ['حسب تقييم الطبيب'],
                lifestyle: ['شرب الماء بكثرة', 'تقليل البروتين', 'تجنب الأدوية المضرة بالكلى']
              });
            }
          } else if (v.name.toLowerCase().includes('cholesterol') || v.name.includes('كوليسترول')) {
            const val = parseFloat(v.value);
            if (val > v.normalRange.max) {
              analysis += `   - التفسير: ارتفاع الكوليسترول (خطر على القلب والشرايين)\n`;
              treatments.push({
                priority: 'medium',
                description: 'خفض الكوليسترول',
                medications: ['ستاتين (أتورفاستاتين، روسوفاستاتين) حسب وصفة الطبيب'],
                lifestyle: ['تقليل الدهون المشبعة', 'زيادة الألياف', 'ممارسة الرياضة', 'تناول الشوفان والمكسرات']
              });
            }
          }
          analysis += '\n';
        } else {
          analysis += `✅ ${v.name}: ${v.value} ${v.unit} (طبيعي)\n\n`;
        }
      });
    }
    
    // General recommendations
    analysis += '\n📌 التوصيات العامة:\n';
    analysis += '• احتفظ بنسخة من هذا التقرير\n';
    analysis += '• ناقش النتائج مع طبيبك\n';
    analysis += '• كرر الفحوصات حسب توصية الطبيب\n';
    
  } else if (documentType === 'xray') {
    analysis = '🔬 تحليل الأشعة:\n\n';
    analysis += 'تم استلام صورة أشعة. لتحليل دقيق للأشعة، يُنصح بما يلي:\n\n';
    analysis += '1. مراجعة طبيب الأشعة المختص\n';
    analysis += '2. مقارنة الأشعة بأشعة سابقة إن وجدت\n';
    analysis += '3. ربط نتائج الأشعة بالأعراض السريرية\n\n';
    
    if (extractedText.length > 50) {
      analysis += '📝 التقرير المرفق:\n' + extractedText.substring(0, 500) + '...\n\n';
    }
    
    warnings.push('⚠️ تحليل الأشعة يتطلب خبرة طبية متخصصة - هذا التحليل أولي فقط');
    
  } else if (documentType === 'prescription') {
    analysis = '💊 تحليل الروشتة الطبية:\n\n';
    
    if (extractedText.length > 20) {
      // Extract medication names from the prescription
      const medications = extractMedicationNames(extractedText);
      
      if (medications.length > 0) {
        analysis += 'الأدوية المكتوبة في الروشتة:\n\n';
        medications.forEach((med, index) => {
          analysis += `${index + 1}. ${med.name}\n`;
          if (med.dosage) analysis += `   الجرعة: ${med.dosage}\n`;
          if (med.frequency) analysis += `   التكرار: ${med.frequency}\n`;
          analysis += '\n';
        });
        
        // Add medication warnings
        const medicationWarnings = getMedicationWarnings(medications);
        warnings.push(...medicationWarnings);
      } else {
        analysis += 'تم استخراج النص التالي من الروشتة:\n\n';
        analysis += extractedText + '\n\n';
      }
      
      analysis += '⚠️ تنبيهات مهمة:\n';
      analysis += '• لا تتناول أي دواء بدون استشارة الطبيب\n';
      analysis += '• التزم بالجرعات المحددة\n';
      analysis += '• لا تشارك أدويتك مع الآخرين\n';
      analysis += '• احفظ الأدوية بعيداً عن متناول الأطفال\n';
      
      warnings.push('⚠️ استشر الصيدلي عن التفاعلات الدوائية المحتملة');
    }
  }
  
  // Add default treatment if none found
  if (treatments.length === 0 && medicalValues.some(v => v.isAbnormal)) {
    treatments.push({
      priority: 'medium',
      description: 'استشارة طبية',
      medications: [],
      lifestyle: ['مراجعة الطبيب لتقييم شامل', 'إحضار جميع التحاليل السابقة', 'تدوين الأعراض']
    });
  }
  
  return { analysis, treatments, warnings };
}

// ---------------------------------------------------------------------------
// Main function: analyzeImageLocally
// ---------------------------------------------------------------------------

/**
 * Analyze a medical image locally using OCR + TensorFlow.js.
 * 100% local - no external AI services required.
 * Uses intelligent rule-based analysis for medical reports and prescriptions.
 *
 * @param {Buffer} imageBuffer   Raw image/PDF buffer
 * @param {string} documentType  One of: lab_report, xray, prescription, medical_report, unknown
 * @param {number} userId        Authenticated user ID
 * @returns {Promise<{extractedValues: Array, imageType: string, analysis: string, treatmentSuggestions: Array, confidence: number, warnings: string[]}>}
 */
async function analyzeImageLocally(imageBuffer, documentType, userId) {
  // Step 1: Preprocess — handle PDF vs image
  let processedBuffer = imageBuffer;
  let extractedText = '';

  const isPDF = imageBuffer.slice(0, 4).toString() === '%PDF';

  if (isPDF) {
    try {
      const pdfData = await pdfParse(imageBuffer);
      extractedText = pdfData.text || '';
      processedBuffer = imageBuffer;
    } catch (err) {
      console.error('PDF parse failed:', err.message);
      extractedText = '';
    }
  } else {
    // Step 1a: Preprocess image with sharp (normalize, ensure JPEG)
    try {
      processedBuffer = await sharp(imageBuffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (err) {
      console.error('Sharp preprocessing failed, using original buffer:', err.message);
      processedBuffer = imageBuffer;
    }

    // Step 2: Extract text using Tesseract.js OCR
    extractedText = await extractTextFromImage(processedBuffer);
  }

  // Step 3: Extract features with TensorFlow.js
  let imageFeatures = { mean: 0, std: 0, min: 0, max: 0, shape: [] };
  if (!isPDF) {
    imageFeatures = await extractFeaturesWithTF(processedBuffer);
  }

  // Step 4: Parse medical values from text
  const medicalValues = parseValuesFromText(extractedText, imageFeatures);

  // Step 5: Auto-detect document type if not specified
  let detectedType = documentType;
  if (!documentType || documentType === 'unknown') {
    detectedType = detectDocumentType(extractedText, medicalValues);
  }

  // Step 6: Use intelligent local analysis (no AI needed)
  // This uses rule-based analysis with medical knowledge
  const fallback = generateFallbackAnalysis(extractedText, medicalValues, detectedType);
  const analysis = fallback.analysis;
  const treatmentSuggestions = fallback.treatments;
  const aiWarnings = fallback.warnings;

  // Step 7: Calculate confidence score
  let confidence = calculateConfidence(extractedText, medicalValues, imageFeatures);

  // Step 8: Detect abnormal values and merge all warnings
  const abnormalWarnings = detectAbnormalValues(medicalValues);
  const warnings = [...abnormalWarnings, ...aiWarnings];

  // Step 8a: Low confidence warning
  if (confidence < 50) {
    warnings.push('تحذير: مستوى الثقة منخفض، يُنصح بمراجعة يدوية');
  }

  // Postcondition: confidence must be between 0 and 100
  confidence = Math.min(100, Math.max(0, confidence));

  // Step 9: Build result object
  const result = {
    extractedValues: medicalValues,
    imageType: detectedType,
    extractedText: extractedText,
    analysis,
    treatmentSuggestions,
    confidence,
    warnings,
  };

  // Step 10: Save results to database
  await saveAnalysisToDatabase(userId, result, extractedText, null);

  return result;
}

// ---------------------------------------------------------------------------
// Document type detection
// ---------------------------------------------------------------------------

/**
 * Automatically detect document type based on extracted text and medical values.
 * @param {string} text
 * @param {Array} medicalValues
 * @returns {string}
 */
function detectDocumentType(text, medicalValues) {
  const textLower = (text || '').toLowerCase();
  
  // Check for prescription indicators
  const prescriptionIndicators = [
    'rx', 'prescribed', 'take', 'tablet', 'capsule', 'mg', 'ml',
    'doctor', 'dr.', 'signature', 'clinic', 'pharmacy',
    'جرعة', 'تناول', 'قرص', 'كبسولة', 'دكتور', 'عيادة', 'صيدلية'
  ];
  
  // Check for lab report indicators
  const labIndicators = [
    'result', 'test', 'sample', 'blood', 'urine', 'serum',
    'تحليل', 'نتيجة', 'دم', 'عينه', 'مختبر'
  ];
  
  // Check for xray/imaging indicators
  const xrayIndicators = [
    'x-ray', 'xray', 'ultrasound', 'mri', 'ct scan', 'imaging',
    'أشعة', 'موجات فوق صوتية', 'رنين', 'تصوير'
  ];
  
  // Count matches
  let prescriptionScore = prescriptionIndicators.filter(i => textLower.includes(i.toLowerCase())).length;
  let labScore = labIndicators.filter(i => textLower.includes(i.toLowerCase())).length;
  let xrayScore = xrayIndicators.filter(i => textLower.includes(i.toLowerCase())).length;
  
  // If medical values found, likely a lab report
  if (medicalValues.length >= 3) {
    labScore += 5;
  }
  
  // Determine type
  if (prescriptionScore > labScore && prescriptionScore > xrayScore) {
    return 'prescription';
  } else if (xrayScore > prescriptionScore && xrayScore > labScore) {
    return 'xray';
  } else if (labScore > 0 || medicalValues.length > 0) {
    return 'lab_report';
  }
  
  return 'medical_report';
}

// ---------------------------------------------------------------------------
// Save analysis to database
// ---------------------------------------------------------------------------

async function saveAnalysisToDatabase(userId, result, extractedText, documentId) {
  try {
    // If no documentId provided, skip saving
    if (!documentId) {
      console.log('No documentId - skipping database save');
      return;
    }
    
    await pool.execute(
      `INSERT INTO medical_image_analysis
        (document_id, user_id, image_type, extracted_text, extracted_values,
         analysis, treatment_suggestions, confidence, warnings, analyzed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        documentId,
        userId,
        result.imageType,
        extractedText || '',
        JSON.stringify(result.extractedValues),
        result.analysis,
        JSON.stringify(result.treatmentSuggestions),
        result.confidence,
        JSON.stringify(result.warnings),
      ]
    );
  } catch (err) {
    // Log but don't throw — analysis result is still returned to caller
    console.error('Failed to save analysis to database:', err.message);
  }
}

module.exports = {
  analyzeImageLocally,
  extractTextFromImage,
  extractFeaturesWithTF,
  parseValuesFromText,
  calculateConfidence,
  detectAbnormalValues,
};
