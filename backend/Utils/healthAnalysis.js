const { chat } = require('./aiClient');

/**
 * Generate fallback health report when AI is unavailable
 */
function generateFallbackHealthReport(userData) {
    const { profile, vitalsStats, medications, appointments, documents } = userData;

    // Calculate scores based on available data
    let vitalsScore = 70;
    let medicationScore = 70;
    let followUpScore = 70;
    let lifestyleScore = 70;

    const urgentAlerts = [];
    const recommendations = [];
    const positivePoints = [];

    // Analyze vitals
    if (vitalsStats && vitalsStats.total_readings > 0) {
        const avgSugar = vitalsStats.avg_blood_sugar;
        const avgSystolic = vitalsStats.avg_blood_pressure_systolic;
        
        if (avgSugar) {
            if (avgSugar > 126) {
                vitalsScore -= 20;
                urgentAlerts.push('⚠️ مستوى السكر مرتفع - استشر طبيبك فوراً');
                recommendations.push('مراجعة طبيب الغدد الصماء لتقييم مستوى السكر');
            } else if (avgSugar < 70) {
                vitalsScore -= 15;
                urgentAlerts.push('⚠️ مستوى السكر منخفض - قد تحتاج تعديل الأدوية');
            } else {
                positivePoints.push('✅ مستوى السكر ضمن المعدل الطبيعي');
            }
        }

        if (avgSystolic) {
            if (avgSystolic > 140) {
                vitalsScore -= 20;
                urgentAlerts.push('⚠️ ضغط الدم مرتفع - استشر طبيبك');
                recommendations.push('مراجعة طبيب القلب لتقييم ضغط الدم');
            } else if (avgSystolic < 90) {
                vitalsScore -= 10;
                recommendations.push('مراقبة ضغط الدم المنخفض');
            } else {
                positivePoints.push('✅ ضغط الدم ضمن المعدل الطبيعي');
            }
        }

        if (vitalsStats.total_readings >= 20) {
            positivePoints.push('✅ متابعة منتظمة للعلامات الحيوية');
            vitalsScore += 10;
        }
    } else {
        vitalsScore = 50;
        recommendations.push('ابدأ بقياس العلامات الحيوية بانتظام');
    }

    // Analyze medications
    if (medications.length > 0) {
        medicationScore = 80;
        positivePoints.push(`✅ ${medications.length} دواء نشط مسجل`);
        recommendations.push('تأكد من الالتزام بمواعيد الأدوية');
    } else {
        medicationScore = 70;
    }

    // Analyze appointments
    if (appointments.upcoming > 0) {
        followUpScore = 85;
        positivePoints.push(`✅ ${appointments.upcoming} موعد قادم مجدول`);
    } else {
        followUpScore = 60;
        recommendations.push('جدول موعد للفحص الدوري');
    }

    // Lifestyle recommendations
    if (!recommendations.includes('ممارسة الرياضة')) {
        recommendations.push('ممارسة الرياضة 30 دقيقة يومياً');
    }
    recommendations.push('اتباع نظام غذائي صحي ومتوازن');
    recommendations.push('النوم 7-8 ساعات يومياً');

    // Calculate overall score
    const overallScore = Math.round((vitalsScore + medicationScore + followUpScore + lifestyleScore) / 4);
    
    let overallStatus = 'جيد';
    if (overallScore >= 80) overallStatus = 'ممتاز';
    else if (overallScore >= 70) overallStatus = 'جيد';
    else if (overallScore >= 60) overallStatus = 'متوسط';
    else overallStatus = 'يحتاج تحسين';

    return {
        overall_score: overallScore,
        overall_status: overallStatus,
        summary: `حالتك الصحية ${overallStatus}. ${urgentAlerts.length > 0 ? 'هناك بعض النقاط التي تحتاج انتباه.' : 'استمر في المتابعة المنتظمة.'}`,
        categories: [
            {
                name: 'العلامات الحيوية',
                score: vitalsScore,
                status: vitalsScore >= 70 ? 'جيد' : 'يحتاج تحسين',
                details: vitalsStats && vitalsStats.total_readings > 0 
                    ? `تم تسجيل ${vitalsStats.total_readings} قراءة في آخر 30 يوم`
                    : 'لا توجد قراءات كافية',
                recommendations: vitalsScore < 70 
                    ? ['قياس العلامات الحيوية بانتظام', 'استشارة الطبيب للقيم غير الطبيعية']
                    : ['استمر في المتابعة المنتظمة']
            },
            {
                name: 'الأدوية والالتزام',
                score: medicationScore,
                status: 'جيد',
                details: medications.length > 0 
                    ? `${medications.length} دواء نشط مسجل في النظام`
                    : 'لا توجد أدوية مسجلة',
                recommendations: ['الالتزام بمواعيد الأدوية', 'عدم إيقاف الأدوية بدون استشارة الطبيب']
            },
            {
                name: 'المتابعة الطبية',
                score: followUpScore,
                status: followUpScore >= 70 ? 'جيد' : 'يحتاج تحسين',
                details: `${appointments.total || 0} موعد إجمالي، ${appointments.upcoming || 0} قادم`,
                recommendations: appointments.upcoming > 0 
                    ? ['الالتزام بالمواعيد المجدولة']
                    : ['جدول موعد للفحص الدوري', 'المتابعة الدورية كل 3-6 أشهر']
            },
            {
                name: 'نمط الحياة',
                score: lifestyleScore,
                status: 'متوسط',
                details: 'نمط الحياة الصحي أساس الوقاية من الأمراض',
                recommendations: [
                    'ممارسة الرياضة 30 دقيقة يومياً',
                    'نظام غذائي متوازن',
                    'النوم الكافي 7-8 ساعات',
                    'تجنب التوتر والضغوط'
                ]
            }
        ],
        urgent_alerts: urgentAlerts,
        top_recommendations: recommendations.slice(0, 5),
        positive_points: positivePoints
    };
}

async function generateHealthReport(userData) {
    const { profile, vitalsStats, medications, appointments, documents } = userData;

    const systemMsg = `أنت طبيب وخبير صحي. أجب دائماً بـ JSON صحيح فقط بدون أي نص خارج الـ JSON.`;

    const userMsg = `حلل البيانات الصحية التالية وأعطِ تقريراً شاملاً. أجب بـ JSON فقط.

بيانات المريض:
- الاسم: ${profile.full_name || 'غير محدد'}
- العمر: ${profile.age || 'غير محدد'}
- فصيلة الدم: ${profile.blood_type || 'غير محددة'}
- الأمراض المزمنة: ${profile.chronic_conditions || 'لا يوجد'}
- الحساسية: ${profile.allergies || 'لا يوجد'}

العلامات الحيوية (آخر 30 يوم):
- متوسط سكر الدم: ${vitalsStats?.avg_blood_sugar ? Math.round(vitalsStats.avg_blood_sugar) + ' mg/dL' : 'لا توجد قراءات'}
- متوسط ضغط الدم: ${vitalsStats?.avg_blood_pressure_systolic ? Math.round(vitalsStats.avg_blood_pressure_systolic) + '/' + Math.round(vitalsStats.avg_blood_pressure_diastolic) + ' mmHg' : 'لا توجد قراءات'}
- متوسط معدل القلب: ${vitalsStats?.avg_heart_rate ? Math.round(vitalsStats.avg_heart_rate) + ' bpm' : 'لا توجد قراءات'}
- عدد القراءات: ${vitalsStats?.total_readings || 0}

الأدوية النشطة (${medications.length}):
${medications.length > 0 ? medications.map(m => `- ${m.name} | ${m.dosage}`).join('\n') : 'لا توجد أدوية'}

المواعيد: إجمالي ${appointments.total || 0} | قادمة ${appointments.upcoming || 0} | مكتملة ${appointments.completed || 0}
المستندات: ${documents || 0}

أجب بهذا JSON فقط:
{
  "overall_score": 75,
  "overall_status": "جيد",
  "summary": "ملخص الحالة الصحية",
  "categories": [
    {"name": "العلامات الحيوية", "score": 70, "status": "جيد", "details": "تفاصيل", "recommendations": ["توصية"]},
    {"name": "الأدوية والالتزام", "score": 80, "status": "جيد", "details": "تفاصيل", "recommendations": ["توصية"]},
    {"name": "المتابعة الطبية", "score": 75, "status": "جيد", "details": "تفاصيل", "recommendations": ["توصية"]},
    {"name": "نمط الحياة", "score": 70, "status": "متوسط", "details": "تفاصيل", "recommendations": ["توصية"]}
  ],
  "urgent_alerts": [],
  "top_recommendations": ["توصية 1", "توصية 2", "توصية 3"],
  "positive_points": ["نقطة إيجابية"]
}`;

    try {
        const raw = await chat(
            [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
            { json: true }
        );

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid JSON response from AI');
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        // Use fallback health report when AI is unavailable
        console.log('[healthAnalysis] AI unavailable, using fallback health report');
        return generateFallbackHealthReport(userData);
    }
}

module.exports = { generateHealthReport };
