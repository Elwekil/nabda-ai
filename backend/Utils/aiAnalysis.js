const { chat } = require('./aiClient');
const fs = require('fs');
const path = require('path');

/**
 * Fallback medical document analysis when AI API is unavailable
 */
function generateFallbackDocumentAnalysis(fileName, fileType, documentType, textContent = '') {
    const docTypeLabels = {
        lab_report: 'تقرير مخبري / تحليل',
        prescription: 'روشتة طبية',
        xray: 'صورة أشعة',
        medical_report: 'تقرير طبي',
        other: 'مستند طبي'
    };
    const docLabel = docTypeLabels[documentType] || 'مستند طبي';

    let analysis = `📄 تحليل ${docLabel}: ${fileName}\n\n`;

    if (documentType === 'lab_report') {
        analysis += `📋 إرشادات لقراءة التحليل المخبري:\n\n`;
        analysis += `1. **القيم الطبيعية الشائعة:**\n`;
        analysis += `   • سكر الدم (صائم): 70-100 مجم/ديسيلتر\n`;
        analysis += `   • الهيموجلوبين: 12-17 جم/ديسيلتر\n`;
        analysis += `   • كريات الدم البيضاء: 4,500-11,000 خلية/ميكرولتر\n`;
        analysis += `   • الكرياتينين: 0.6-1.2 مجم/ديسيلتر\n`;
        analysis += `   • الكوليسترول الكلي: أقل من 200 مجم/ديسيلتر\n`;
        analysis += `   • ALT/AST: 7-56 وحدة/لتر\n\n`;
        
        analysis += `2. **كيفية قراءة التحليل:**\n`;
        analysis += `   • ابحث عن علامات (H) للقيم المرتفعة أو (L) للمنخفضة\n`;
        analysis += `   • قارن قيمك بالنطاق الطبيعي المكتوب بجانب كل فحص\n`;
        analysis += `   • القيم خارج النطاق تحتاج استشارة طبية\n\n`;
        
        analysis += `3. **متى تقلق:**\n`;
        analysis += `   • قيم مرتفعة جداً أو منخفضة جداً\n`;
        analysis += `   • عدة قيم غير طبيعية معاً\n`;
        analysis += `   • أعراض مصاحبة (تعب، ألم، حمى)\n\n`;
        
    } else if (documentType === 'xray') {
        analysis += `🔬 إرشادات لفهم الأشعة:\n\n`;
        analysis += `1. **أنواع الأشعة الشائعة:**\n`;
        analysis += `   • أشعة X العادية: للعظام والصدر\n`;
        analysis += `   • الأشعة المقطعية (CT): تفاصيل أدق\n`;
        analysis += `   • الرنين المغناطيسي (MRI): للأنسجة الرخوة\n`;
        analysis += `   • الموجات فوق الصوتية: للأعضاء الداخلية\n\n`;
        
        analysis += `2. **ما يبحث عنه الطبيب:**\n`;
        analysis += `   • الكسور أو التشوهات في العظام\n`;
        analysis += `   • التهابات أو سوائل في الرئتين\n`;
        analysis += `   • تضخم الأعضاء\n`;
        analysis += `   • الأورام أو الكتل غير الطبيعية\n\n`;
        
        analysis += `3. **⚠️ مهم:**\n`;
        analysis += `   • تحليل الأشعة يحتاج خبرة طبية متخصصة\n`;
        analysis += `   • لا تحاول تشخيص نفسك من الأشعة\n`;
        analysis += `   • استشر طبيب الأشعة أو طبيبك المعالج\n\n`;
        
    } else if (documentType === 'prescription') {
        analysis += `💊 إرشادات الروشتة الطبية:\n\n`;
        analysis += `1. **معلومات مهمة في الروشتة:**\n`;
        analysis += `   • اسم الدواء (الاسم العلمي والتجاري)\n`;
        analysis += `   • الجرعة (مجم، مل، أقراص)\n`;
        analysis += `   • عدد المرات يومياً\n`;
        analysis += `   • المدة (أيام، أسابيع)\n`;
        analysis += `   • قبل أو بعد الأكل\n\n`;
        
        analysis += `2. **⚠️ تحذيرات السلامة:**\n`;
        analysis += `   • لا تتناول أدوية الآخرين\n`;
        analysis += `   • لا تشارك أدويتك مع أحد\n`;
        analysis += `   • أكمل المضادات الحيوية حتى النهاية\n`;
        analysis += `   • لا توقف الأدوية المزمنة فجأة\n`;
        analysis += `   • احفظ الأدوية بعيداً عن الأطفال\n\n`;
        
        analysis += `3. **استشر الصيدلي عن:**\n`;
        analysis += `   • التفاعلات مع أدويتك الحالية\n`;
        analysis += `   • الآثار الجانبية المحتملة\n`;
        analysis += `   • طريقة الحفظ الصحيحة\n`;
        analysis += `   • ماذا تفعل إذا نسيت جرعة\n\n`;
    }

    if (textContent && textContent.length > 50) {
        analysis += `📝 محتوى المستند المستخرج:\n`;
        analysis += `${textContent.substring(0, 1000)}${textContent.length > 1000 ? '...' : ''}\n\n`;
    }

    analysis += `\n📌 التوصيات العامة:\n`;
    analysis += `• احتفظ بنسخة من جميع مستنداتك الطبية\n`;
    analysis += `• ناقش النتائج مع طبيبك المعالج\n`;
    analysis += `• لا تتخذ قرارات علاجية بناءً على هذا التحليل فقط\n`;
    analysis += `• في حالة الطوارئ، اتصل بالإسعاف فوراً\n\n`;
    
    analysis += `⚠️ تنبيه: هذا تحليل عام للمعلومات فقط ولا يغني عن استشارة طبيب مؤهل.`;

    return analysis;
}

/**
 * Analyze medical document using AI
 * For images: uses vision-capable model to extract values
 * For text/PDF: reads content and analyzes
 */
async function analyzeMedicalDocument(filePath, fileName, fileType, documentType) {
    const docTypeLabels = {
        lab_report: 'تقرير مخبري / تحليل',
        prescription: 'روشتة طبية',
        xray: 'صورة أشعة',
        medical_report: 'تقرير طبي',
        other: 'مستند طبي'
    };
    const docLabel = docTypeLabels[documentType] || 'مستند طبي';

    const systemMsg = `أنت مساعد طبي ذكي خبير في تحليل المستندات الطبية والتحاليل والأشعة.
قدم تحليلاً شاملاً باللغة العربية يشمل:
1. ملخص المستند
2. القيم والنتائج الرئيسية (مع ذكر القيم الطبيعية للمقارنة إن أمكن)
3. القيم غير الطبيعية أو المثيرة للقلق
4. التوصيات والخطوات المقترحة
5. تنبيه: هذا التحليل للمعلومات العامة فقط ولا يغني عن استشارة الطبيب.`;

    const isImage = fileType?.includes('image');
    const isPDF = fileType?.includes('pdf');
    const isText = fileType?.includes('text');

    // Read text content if available
    let textContent = '';
    if (isText) {
        try { textContent = fs.readFileSync(filePath, 'utf-8').substring(0, 4000); } catch {}
    }

    // Try AI analysis first, fallback to built-in analysis
    try {
        // For images: encode to base64 and use vision
        if (isImage) {
            try {
                const imageBuffer = fs.readFileSync(filePath);
                const base64Image = imageBuffer.toString('base64');
                const mimeType = fileType || 'image/jpeg';

                return await chat([
                    { role: 'system', content: systemMsg },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `حلل هذه الصورة الطبية: ${docLabel} المسماة "${fileName}". استخرج جميع القيم والنتائج الموجودة في الصورة وحللها.`
                            },
                            {
                                type: 'image_url',
                                image_url: { url: `data:${mimeType};base64,${base64Image}` }
                            }
                        ]
                    }
                ], { vision: true });
            } catch (err) {
                console.error('Vision analysis failed, using fallback:', err.message);
                // Fall through to fallback
            }
        }

        const userMsg = textContent
            ? `حلل هذا ${docLabel} المسمى "${fileName}".\n\nمحتوى المستند:\n${textContent}`
            : `حلل هذا ${docLabel} المسمى "${fileName}" (نوع الملف: ${fileType || 'غير محدد'}) وقدم تحليلاً طبياً شاملاً بناءً على اسم الملف ونوع المستند.`;

        return await chat([
            { role: 'system', content: systemMsg },
            { role: 'user', content: userMsg }
        ]);
    } catch (err) {
        // Use fallback analysis when AI is unavailable
        console.log('[aiAnalysis] AI unavailable, using fallback analysis');
        return generateFallbackDocumentAnalysis(fileName, fileType, documentType, textContent);
    }
}

module.exports = { analyzeMedicalDocument };
