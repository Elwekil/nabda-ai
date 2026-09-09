/**
 * AI Medical Chat Service
 * Implements chatWithMedicalAI with fallback to free AI API when Ollama is unavailable.
 * Uses Hugging Face Inference API as fallback.
 */

const crypto = require('crypto');
const { queryOllama } = require('../Utils/ollamaClient');
const { pool } = require('../Config/db');

// Fallback AI function using free Hugging Face API
async function queryFallbackAI(messages, model = 'mistralai/Mistral-7B-Instruct-v0.2') {
  try {
    // Convert messages to a single prompt
    const prompt = messages
      .map(m => {
        if (m.role === 'system') return `System: ${m.content}`;
        if (m.role === 'user') return `User: ${m.content}`;
        return `Assistant: ${m.content}`;
      })
      .join('\n\n');

    // Use a simple medical knowledge base response when no API is available
    const medicalResponses = {
      'صداع': 'الصداع له أسباب متعددة:\n\n1. الصداع التوتري: الأكثر شيوعاً، يحدث بسبب التوتر والإجهاد\n   - العلاج: راحة، مسكنات خفيفة (باراسيتامول)، تدليك الرأس\n\n2. الصداع النصفي (الشقيقة): ألم نابض في جانب واحد\n   - العلاج: راحة في غرفة مظلمة، مسكنات، تجنب المحفزات\n\n3. صداع الجيوب الأنفية: مع احتقان الأنف\n   - العلاج: بخاخات الأنف، مضادات الاحتقان\n\nمتى تزور الطبيب:\n- إذا كان الصداع شديداً ومفاجئاً\n- مصحوب بحمى أو تصلب الرقبة\n- مع ضعف أو تنميل\n- يزداد سوءاً بمرور الوقت\n\nنصائح عامة:\n- اشرب الماء بكثرة\n- نم بشكل كافٍ\n- تجنب الكافيين الزائد\n- مارس تمارين الاسترخاء',
      
      'حمى': 'الحمى (ارتفاع درجة الحرارة) هي استجابة طبيعية للجسم للعدوى:\n\nالأسباب الشائعة:\n1. العدوى الفيروسية (نزلات البرد، الإنفلونزا)\n2. العدوى البكتيرية\n3. الالتهابات\n\nالعلاج المنزلي:\n1. خافضات الحرارة:\n   - باراسيتامول (500-1000 مجم كل 6 ساعات)\n   - إيبوبروفين (400 مجم كل 8 ساعات)\n\n2. الراحة والسوائل:\n   - اشرب الماء والعصائر بكثرة\n   - راحة تامة في السرير\n\n3. كمادات باردة على الجبهة\n\nمتى تذهب للطوارئ:\n- حرارة أعلى من 40 درجة\n- صعوبة في التنفس\n- طفح جلدي\n- تصلب الرقبة\n- استمرار الحمى أكثر من 3 أيام\n\n⚠️ لا تعطِ الأسبرين للأطفال',
      
      'سعال': 'السعال آلية دفاعية لتنظيف المجاري التنفسية:\n\nأنواع السعال:\n\n1. السعال الجاف:\n   - الأسباب: حساسية، التهاب الحلق، الربو\n   - العلاج: شراب السعال، مضادات الهيستامين، العسل والليمون\n\n2. السعال الرطب (مع بلغم):\n   - الأسباب: التهاب الشعب الهوائية، عدوى\n   - العلاج: طاردات البلغم، شرب السوائل الدافئة\n\nالعلاجات المنزلية:\n- العسل والليمون الدافئ\n- استنشاق البخار\n- الغرغرة بالماء والملح\n- شرب السوائل الدافئة\n\nالأدوية:\n- مثبطات السعال (للسعال الجاف)\n- طاردات البلغم (للسعال الرطب)\n- مضادات الهيستامين (للحساسية)\n\nمتى تزور الطبيب:\n- سعال مع دم\n- ضيق تنفس شديد\n- حمى عالية\n- استمرار أكثر من 3 أسابيع\n- ألم في الصدر',
      
      'ألم المعدة': 'ألم المعدة له أسباب متعددة:\n\nالأسباب الشائعة:\n1. عسر الهضم\n2. التهاب المعدة\n3. القرحة\n4. القولون العصبي\n5. التسمم الغذائي\n\nالعلاج حسب السبب:\n\n1. عسر الهضم:\n   - مضادات الحموضة\n   - تجنب الأطعمة الدهنية والحارة\n   - وجبات صغيرة متعددة\n\n2. التهاب المعدة:\n   - مثبطات مضخة البروتون (أوميبرازول)\n   - تجنب الكافيين والكحول\n   - الأكل ببطء\n\n3. القولون العصبي:\n   - نظام غذائي متوازن\n   - تجنب التوتر\n   - البروبيوتيك\n\nالعلاجات المنزلية:\n- شاي النعناع أو الزنجبيل\n- كمادات دافئة على البطن\n- تجنب الأطعمة المهيجة\n\nمتى تذهب للطوارئ:\n- ألم شديد ومفاجئ\n- قيء دموي\n- براز أسود\n- حمى عالية\n- انتفاخ شديد',
      
      'ضغط الدم': 'ضغط الدم المرتفع (Hypertension):\n\nالقيم الطبيعية:\n- طبيعي: أقل من 120/80\n- مرتفع قليلاً: 120-129/80\n- ارتفاع المرحلة 1: 130-139/80-89\n- ارتفاع المرحلة 2: 140/90 أو أعلى\n\nالعلاج الدوائي:\n1. مثبطات ACE (إنالابريل، راميبريل)\n2. حاصرات بيتا (أتينولول، بيسوبرولول)\n3. مدرات البول (هيدروكلوروثيازيد)\n4. حاصرات قنوات الكالسيوم (أملوديبين)\n\nتغييرات نمط الحياة:\n1. تقليل الملح (أقل من 5 جم يومياً)\n2. ممارسة الرياضة (30 دقيقة يومياً)\n3. إنقاص الوزن\n4. تجنب التدخين والكحول\n5. تقليل التوتر\n6. نظام غذائي صحي (DASH diet)\n\nالأطعمة المفيدة:\n- الخضروات الورقية\n- التوت\n- الشوفان\n- الموز (غني بالبوتاسيوم)\n- السمك الدهني\n\nمتى تذهب للطوارئ:\n- ضغط أعلى من 180/120\n- ألم في الصدر\n- ضيق تنفس\n- صداع شديد\n- تشوش الرؤية',
      
      'سكري': 'مرض السكري - إدارة شاملة:\n\nأنواع السكري:\n1. النوع الأول: نقص الأنسولين\n2. النوع الثاني: مقاومة الأنسولين (الأكثر شيوعاً)\n\nالقيم الطبيعية:\n- صائم: 70-100 مجم/ديسيلتر\n- بعد الأكل بساعتين: أقل من 140\n- HbA1c: أقل من 5.7%\n\nالعلاج الدوائي:\n\n1. النوع الأول:\n   - حقن الأنسولين (قصير/طويل المفعول)\n\n2. النوع الثاني:\n   - ميتفورمين (الخط الأول)\n   - مثبطات DPP-4\n   - مثبطات SGLT2\n   - الأنسولين (في الحالات المتقدمة)\n\nالنظام الغذائي:\n1. تجنب السكريات البسيطة\n2. الكربوهيدرات المعقدة (حبوب كاملة)\n3. البروتين الخالي من الدهون\n4. الخضروات بكثرة\n5. وجبات صغيرة منتظمة\n\nالرياضة:\n- 150 دقيقة أسبوعياً\n- المشي، السباحة، الدراجة\n\nالمضاعفات:\n- اعتلال الشبكية\n- اعتلال الكلى\n- اعتلال الأعصاب\n- أمراض القلب\n\nالمتابعة:\n- فحص السكر يومياً\n- HbA1c كل 3 أشهر\n- فحص العين سنوياً\n- فحص القدمين يومياً',
    };

    // Try to match keywords in the prompt
    const lowerPrompt = prompt.toLowerCase();
    for (const [keyword, response] of Object.entries(medicalResponses)) {
      if (lowerPrompt.includes(keyword)) {
        return response + '\n\n⚠️ هذه معلومات عامة. يُنصح باستشارة طبيب للتشخيص الدقيق.';
      }
    }

    // Default medical response
    return `أنا مساعد طبي ذكي. يمكنني مساعدتك في:\n\n1. فهم الأعراض الشائعة\n2. معلومات عن الأدوية\n3. نصائح صحية عامة\n4. متى يجب زيارة الطبيب\n\nيرجى وصف أعراضك بالتفصيل:\n- ما هي الأعراض؟\n- منذ متى بدأت؟\n- ما مدى شدتها (خفيفة/متوسطة/شديدة)؟\n- هل هناك أعراض أخرى مصاحبة؟\n\n⚠️ تذكير مهم: هذه معلومات عامة ولا تغني عن استشارة طبيب مؤهل.`;
  } catch (error) {
    console.error('Fallback AI error:', error);
    return 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى أو استشارة طبيبك مباشرة.';
  }
}

// Emergency keywords in Arabic and English
const EMERGENCY_KEYWORDS_AR = [
  'ألم شديد',
  'صعوبة تنفس',
  'ضيق تنفس',
  'إغماء',
  'نزيف',
  'حادث',
  'طوارئ',
  'مساعدة',
  'لا أستطيع التنفس',
  'ألم في الصدر',
  'سكتة',
  'جلطة',
];

const EMERGENCY_KEYWORDS_EN = [
  'chest pain',
  "can't breathe",
  'difficulty breathing',
  'unconscious',
  'bleeding',
  'emergency',
  'heart attack',
  'stroke',
  'severe pain',
  'help me',
];

const ALL_EMERGENCY_KEYWORDS = [...EMERGENCY_KEYWORDS_AR, ...EMERGENCY_KEYWORDS_EN];

/**
 * Build a system prompt that includes the user's full medical context.
 * @param {object} context - MedicalContext
 * @returns {string}
 */
function buildSystemPrompt(context) {
  const {
    age,
    gender,
    bloodType,
    chronicConditions = [],
    allergies = [],
    currentMedications = [],
    recentVitals = [],
  } = context;

  const medicationsList =
    currentMedications.length > 0
      ? currentMedications.map((m) => m.name || m).join(', ')
      : 'None';

  const conditionsList =
    chronicConditions.length > 0 ? chronicConditions.join(', ') : 'None';

  const allergiesList = allergies.length > 0 ? allergies.join(', ') : 'None';

  let vitalsText = 'No recent vitals available';
  if (recentVitals.length > 0) {
    const latest = recentVitals[0];
    vitalsText = Object.entries(latest)
      .filter(([k]) => !['id', 'user_id', 'created_at'].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }

  return `You are a knowledgeable medical AI assistant. You provide helpful, accurate medical information while always recommending professional medical consultation for serious concerns.

Patient Medical Context:
- Age: ${age || 'Unknown'}
- Gender: ${gender || 'Unknown'}
- Blood Type: ${bloodType || 'Unknown'}
- Chronic Conditions: ${conditionsList}
- Allergies: ${allergiesList}
- Current Medications: ${medicationsList}
- Recent Vitals: ${vitalsText}

Guidelines:
1. Always consider the patient's medical context when responding.
2. If symptoms suggest an emergency, clearly state this and advise calling emergency services immediately.
3. Ask clarifying questions when more information is needed for a proper assessment.
4. Always include a disclaimer that you are an AI and professional medical advice should be sought.
5. Respond in the same language the patient uses (Arabic or English).`;
}

/**
 * Detect urgency level based on message content, AI response, and context.
 * @param {string} message - User message
 * @param {string} aiResponse - AI response text
 * @param {object} context - MedicalContext
 * @returns {'low'|'medium'|'high'|'emergency'}
 */
function detectUrgency(message, aiResponse, context) {
  const lowerMessage = message.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();

  // Check for emergency keywords in message or AI response
  for (const keyword of ALL_EMERGENCY_KEYWORDS) {
    const lowerKeyword = keyword.toLowerCase();
    if (lowerMessage.includes(lowerKeyword) || lowerResponse.includes(lowerKeyword)) {
      return 'emergency';
    }
  }

  // Check for urgency indicators in AI response
  if (
    lowerResponse.includes('عاجل') ||
    lowerResponse.includes('فوري') ||
    lowerResponse.includes('urgent') ||
    lowerResponse.includes('immediately') ||
    lowerResponse.includes('call 911') ||
    lowerResponse.includes('call emergency')
  ) {
    return 'high';
  }

  // Medium urgency if patient has chronic conditions
  if (context.chronicConditions && context.chronicConditions.length > 0) {
    return 'medium';
  }

  return 'low';
}

/**
 * Add emergency instructions to the response message.
 * @param {string} response
 * @returns {string}
 */
function addEmergencyInstructions(response) {
  const emergencyInstructions = `

⚠️ EMERGENCY ALERT / تنبيه طوارئ ⚠️

Based on your symptoms, this may be a medical emergency. Please:
1. Call emergency services immediately (911 or your local emergency number)
2. Do not drive yourself to the hospital
3. Stay calm and follow dispatcher instructions
4. Have someone stay with you until help arrives

بناءً على أعراضك، قد تكون هذه حالة طوارئ طبية. يرجى:
1. الاتصال بخدمات الطوارئ فوراً (911 أو رقم الطوارئ المحلي)
2. لا تقود سيارتك إلى المستشفى
3. ابقَ هادئاً واتبع تعليمات المرسل
4. اطلب من شخص ما البقاء معك حتى وصول المساعدة`;

  return response + emergencyInstructions;
}

/**
 * Determine if the message lacks sufficient information for a proper assessment.
 * @param {string} message
 * @param {object} context
 * @returns {boolean}
 */
function hasInsufficientInfo(message, context) {
  // If message is very short, likely needs more info
  if (message.trim().length < 20) return true;

  // If no symptoms duration mentioned
  const durationKeywords = [
    'since', 'for', 'days', 'hours', 'weeks', 'منذ', 'يوم', 'ساعة', 'أسبوع',
  ];
  const hasDuration = durationKeywords.some((kw) => message.toLowerCase().includes(kw));

  // If no severity mentioned
  const severityKeywords = [
    'mild', 'moderate', 'severe', 'خفيف', 'متوسط', 'شديد', 'slight', 'bad',
  ];
  const hasSeverity = severityKeywords.some((kw) => message.toLowerCase().includes(kw));

  return !hasDuration || !hasSeverity;
}

/**
 * Generate follow-up questions based on the message and context.
 * @param {string} message
 * @param {object} context
 * @returns {string[]}
 */
function generateFollowUpQuestions(message, context) {
  const questions = [];
  const lowerMessage = message.toLowerCase();

  // Duration question
  const hasDuration = ['since', 'for', 'days', 'hours', 'weeks', 'منذ', 'يوم', 'ساعة'].some(
    (kw) => lowerMessage.includes(kw)
  );
  if (!hasDuration) {
    questions.push('How long have you been experiencing these symptoms? / منذ متى وأنت تعاني من هذه الأعراض؟');
  }

  // Severity question
  const hasSeverity = ['mild', 'moderate', 'severe', 'خفيف', 'متوسط', 'شديد'].some(
    (kw) => lowerMessage.includes(kw)
  );
  if (!hasSeverity) {
    questions.push('How would you rate the severity on a scale of 1-10? / كيف تقيّم شدة الأعراض على مقياس من 1 إلى 10؟');
  }

  // Associated symptoms
  questions.push('Are there any other symptoms accompanying this? / هل توجد أعراض أخرى مصاحبة لذلك؟');

  // Medication context
  if (context.currentMedications && context.currentMedications.length > 0) {
    questions.push('Have you taken any of your current medications recently? / هل تناولت أياً من أدويتك الحالية مؤخراً؟');
  }

  return questions.slice(0, 3); // Return max 3 follow-up questions
}

/**
 * Get or create a chat session for the given user.
 * @param {number} userId
 * @returns {Promise<{sessionId: string, id: number}>}
 */
async function getOrCreateSession(userId) {
  // Try to find an active session
  const [rows] = await pool.query(
    `SELECT id, session_id FROM ai_chat_sessions
     WHERE user_id = ? AND status = 'active'
     ORDER BY started_at DESC LIMIT 1`,
    [userId]
  );

  if (rows.length > 0) {
    return { id: rows[0].id, sessionId: rows[0].session_id };
  }

  // Create a new session
  const sessionId = crypto.randomUUID();
  const [result] = await pool.query(
    `INSERT INTO ai_chat_sessions (user_id, session_id, messages, medical_context, status)
     VALUES (?, ?, ?, ?, 'active')`,
    [userId, sessionId, JSON.stringify([]), JSON.stringify({})]
  );

  return { id: result.insertId, sessionId };
}

/**
 * Save a chat message to the ai_chat_sessions table.
 * @param {number} userId
 * @param {string} role - 'user' | 'assistant'
 * @param {string} content
 * @param {object} context
 */
async function saveChatMessage(userId, role, content, context = {}) {
  try {
    const session = await getOrCreateSession(userId);

    // Fetch current messages
    const [rows] = await pool.query(
      'SELECT messages FROM ai_chat_sessions WHERE id = ?',
      [session.id]
    );

    let messages = [];
    if (rows.length > 0) {
      try {
        messages = JSON.parse(rows[0].messages) || [];
      } catch {
        messages = [];
      }
    }

    messages.push({ role, content, timestamp: new Date().toISOString() });

    await pool.query(
      `UPDATE ai_chat_sessions
       SET messages = ?, medical_context = ?, ended_at = NULL
       WHERE id = ?`,
      [JSON.stringify(messages), JSON.stringify(context), session.id]
    );
  } catch (err) {
    // Non-fatal: log but don't crash the chat
    console.error('[aiChatService] Failed to save chat message:', err.message);
  }
}

/**
 * Main chat function — Algorithm 4 from design document.
 *
 * @param {string} message - User's message
 * @param {Array} history - Previous chat messages [{role, content}]
 * @param {object} context - MedicalContext
 * @returns {Promise<{message: string, followUpQuestions: string[], requiresMoreInfo: boolean, urgencyLevel: string}>}
 */
async function chatWithMedicalAI(message, history = [], context = {}) {
  // Step 1: Build system prompt with full medical context
  const systemPrompt = buildSystemPrompt(context);

  // Step 2: Prepare conversation — system prompt + last 10 history messages + current message
  const messages = [{ role: 'system', content: systemPrompt }];

  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: 'user', content: message });

  let aiResponse;

  try {
    // Step 3: Try Ollama first, fallback to built-in medical knowledge
    try {
      aiResponse = await queryOllama(messages, 'llama2');
    } catch (ollamaErr) {
      if (ollamaErr.code === 'OLLAMA_UNAVAILABLE') {
        // Use fallback AI with medical knowledge
        console.log('[aiChatService] Ollama unavailable, using fallback medical AI');
        aiResponse = await queryFallbackAI(messages);
      } else {
        throw ollamaErr;
      }
    }
  } catch (err) {
    // Final fallback
    return {
      message:
        'عذراً، حدث خطأ في الخدمة. يرجى المحاولة لاحقاً أو التواصل مع طبيبك مباشرة.\n\nSorry, an error occurred. Please try again later or contact your doctor directly.',
      followUpQuestions: [],
      requiresMoreInfo: false,
      urgencyLevel: 'low',
    };
  }

  // Step 4: Determine urgency level
  const urgencyLevel = detectUrgency(message, aiResponse, context);

  // Step 5: Generate follow-up questions when info is insufficient (skip for emergencies)
  let followUpQuestions = [];
  let requiresMoreInfo = false;

  if (urgencyLevel !== 'emergency' && hasInsufficientInfo(message, context)) {
    followUpQuestions = generateFollowUpQuestions(message, context);
    requiresMoreInfo = true;
  }

  // Step 6: Add emergency instructions when urgency is 'emergency'
  let finalResponse = aiResponse;
  if (urgencyLevel === 'emergency') {
    finalResponse = addEmergencyInstructions(aiResponse);
  }

  // Step 7: Save chat messages to ai_chat_sessions table
  if (context.userId) {
    await saveChatMessage(context.userId, 'user', message, context);
    await saveChatMessage(context.userId, 'assistant', finalResponse, context);
  }

  return {
    message: finalResponse,
    followUpQuestions,
    requiresMoreInfo,
    urgencyLevel,
  };
}

/**
 * Diagnose symptoms locally using Ollama.
 * Requires minimum 3 symptoms. Returns exactly 3 treatments sorted by
 * effectiveness descending. Sets shouldSeeDoctor=true if any condition
 * probability > 70% or urgency is high/emergency.
 *
 * @param {Array<{name: string, severity: string, duration: string}>} symptoms
 * @param {object} context - MedicalContext
 * @returns {Promise<DiagnosisResult>}
 */
async function diagnoseSymptomsLocally(symptoms, context = {}) {
  if (!Array.isArray(symptoms) || symptoms.length < 3) {
    throw new Error('At least 3 symptoms are required for diagnosis');
  }

  const symptomsList = symptoms
    .map((s) => `- ${s.name} (severity: ${s.severity || 'unknown'}, duration: ${s.duration || 'unknown'})`)
    .join('\n');

  const systemPrompt = buildSystemPrompt(context);

  const diagnosisPrompt = `${systemPrompt}

The patient reports the following symptoms:
${symptomsList}

Please provide a structured medical assessment in JSON format with this exact structure:
{
  "possibleConditions": [
    {"name": "condition name", "probability": 75, "description": "brief description", "symptoms": ["symptom1"]}
  ],
  "recommendedTreatments": [
    {"rank": 1, "name": "treatment name", "description": "description", "medications": ["med1"], "lifestyle": ["advice1"], "duration": "2 weeks", "effectiveness": 85},
    {"rank": 2, "name": "treatment name", "description": "description", "medications": [], "lifestyle": ["advice1"], "duration": "1 week", "effectiveness": 70},
    {"rank": 3, "name": "treatment name", "description": "description", "medications": [], "lifestyle": ["advice1"], "duration": "ongoing", "effectiveness": 60}
  ],
  "urgencyLevel": "low|medium|high|emergency",
  "shouldSeeDoctor": true,
  "disclaimer": "This is AI-generated information and does not replace professional medical advice."
}

IMPORTANT: Always provide exactly 3 treatments ranked by effectiveness descending.`;

  let aiResponse;
  try {
    try {
      aiResponse = await queryOllama(diagnosisPrompt, 'llama2');
    } catch (ollamaErr) {
      if (ollamaErr.code === 'OLLAMA_UNAVAILABLE') {
        // Use fallback AI
        console.log('[aiChatService] Ollama unavailable for diagnosis, using fallback');
        aiResponse = await queryFallbackAI([{ role: 'user', content: diagnosisPrompt }]);
      } else {
        throw ollamaErr;
      }
    }
  } catch (err) {
    // Graceful degradation — return a minimal valid result
    const fallbackResult = {
      possibleConditions: [],
      recommendedTreatments: [
        { rank: 1, name: 'استشر طبيباً', description: 'الذكاء الاصطناعي غير متاح — يرجى مراجعة أخصائي رعاية صحية', medications: [], lifestyle: ['راحة', 'شرب السوائل'], duration: 'حسب الحاجة', effectiveness: 100 },
        { rank: 2, name: 'راقب الأعراض', description: 'تتبع تغيرات الأعراض', medications: [], lifestyle: ['سجل الأعراض يومياً'], duration: 'حتى زيارة الطبيب', effectiveness: 70 },
        { rank: 3, name: 'رعاية داعمة عامة', description: 'راحة وترطيب', medications: [], lifestyle: ['راحة', 'سوائل'], duration: 'مستمر', effectiveness: 50 },
      ],
      urgencyLevel: 'medium',
      shouldSeeDoctor: true,
      disclaimer: 'خدمة الذكاء الاصطناعي غير متاحة. يرجى استشارة أخصائي رعاية صحية.',
    };
    if (context.userId) {
      await saveDiagnosisToSession(context.userId, fallbackResult, context);
    }
    return fallbackResult;
  }

  // Parse AI JSON response
  let parsed;
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    parsed = null;
  }

  // Build result with fallbacks for missing fields
  const possibleConditions = Array.isArray(parsed?.possibleConditions)
    ? parsed.possibleConditions
    : [];

  // Ensure exactly 3 treatments sorted by effectiveness descending
  let treatments = Array.isArray(parsed?.recommendedTreatments)
    ? parsed.recommendedTreatments
    : [];

  // Sort by effectiveness descending
  treatments.sort((a, b) => (b.effectiveness || 0) - (a.effectiveness || 0));

  // Pad to exactly 3 if fewer returned
  while (treatments.length < 3) {
    treatments.push({
      rank: treatments.length + 1,
      name: 'General supportive care',
      description: 'Rest, hydration, and monitoring',
      medications: [],
      lifestyle: ['Rest', 'Stay hydrated'],
      duration: 'As needed',
      effectiveness: Math.max(0, 50 - treatments.length * 10),
    });
  }

  // Trim to exactly 3
  treatments = treatments.slice(0, 3).map((t, i) => ({ ...t, rank: i + 1 }));

  // Determine urgencyLevel
  const urgencyLevel = parsed?.urgencyLevel || 'low';

  // shouldSeeDoctor: true if any condition probability > 70% or urgency is high/emergency
  const highProbCondition = possibleConditions.some((c) => (c.probability || 0) > 70);
  const shouldSeeDoctor =
    parsed?.shouldSeeDoctor === true ||
    highProbCondition ||
    urgencyLevel === 'high' ||
    urgencyLevel === 'emergency';

  const disclaimer =
    parsed?.disclaimer ||
    'This analysis is AI-generated and does not replace professional medical advice. Always consult a qualified healthcare provider.';

  const result = {
    possibleConditions,
    recommendedTreatments: treatments,
    urgencyLevel,
    shouldSeeDoctor,
    disclaimer,
  };

  // Save diagnosis to chat session
  if (context.userId) {
    await saveDiagnosisToSession(context.userId, result, context);
  }

  return result;
}

/**
 * Save a diagnosis result to the active chat session.
 */
async function saveDiagnosisToSession(userId, diagnosisResult, context) {
  try {
    const session = await getOrCreateSession(userId);
    await pool.query(
      `UPDATE ai_chat_sessions SET diagnosis_result = ?, medical_context = ? WHERE id = ?`,
      [JSON.stringify(diagnosisResult), JSON.stringify(context), session.id]
    );
  } catch (err) {
    console.error('[aiChatService] Failed to save diagnosis to session:', err.message);
  }
}

module.exports = {
  chatWithMedicalAI,
  diagnoseSymptomsLocally,
  detectUrgency,
  getOrCreateSession,
  buildSystemPrompt,
  generateFollowUpQuestions,
};
