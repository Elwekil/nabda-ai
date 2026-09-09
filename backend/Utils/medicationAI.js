const { chat } = require('./aiClient');

async function analyzeMedication(medication, patient) {
    const systemMsg = `أنت صيدلاني وطبيب خبير. أجب دائماً بـ JSON صحيح فقط بدون أي نص خارج الـ JSON.`;

    const userMsg = `قيّم الدواء التالي للمريض وأجب بـ JSON فقط.

معلومات الدواء:
- الاسم: ${medication.name}
- الجرعة: ${medication.dosage || 'غير محددة'}
- التكرار: ${medication.frequency || 'غير محدد'}
- وقت التناول: ${medication.time_of_day || 'غير محدد'}
- ملاحظات: ${medication.notes || 'لا يوجد'}

معلومات المريض:
- العمر: ${patient.age || 'غير محدد'}
- فصيلة الدم: ${patient.blood_type || 'غير محددة'}
- الأمراض المزمنة: ${patient.chronic_conditions || 'لا يوجد'}
- الحساسية: ${patient.allergies || 'لا يوجد'}

أجب بهذا JSON فقط:
{
  "effectiveness_percentage": 75,
  "is_suitable": true,
  "suitability_reason": "سبب الملاءمة",
  "warnings": ["تحذير إن وجد"],
  "alternatives": [],
  "general_notes": "ملاحظات عامة"
}`;

    const raw = await chat(
        [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
        { json: true }
    );

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON response from AI');
    return JSON.parse(jsonMatch[0]);
}

module.exports = { analyzeMedication };
