import jsPDF from 'jspdf'

/**
 * Generate a comprehensive health report PDF with all patient information
 */
export function generatePDF(report, user, generatedAt) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210
    const margin = 20
    let y = 0

    // ── Colors ──────────────────────────────────────────────
    const primary   = [37, 99, 235]   // blue-600
    const green     = [16, 185, 129]
    const yellow    = [245, 158, 11]
    const red       = [239, 68, 68]
    const gray      = [107, 114, 128]
    const lightGray = [243, 244, 246]
    const white     = [255, 255, 255]
    const dark      = [17, 24, 39]

    const scoreColor = (s) => s >= 75 ? green : s >= 50 ? yellow : red

    // ── Header ───────────────────────────────────────────────
    doc.setFillColor(...primary)
    doc.rect(0, 0, W, 50, 'F')

    doc.setTextColor(...white)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('🏥 NABDA Ai', margin, 18)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text('التقرير الصحي الشامل', margin, 30)

    doc.setFontSize(9)
    doc.setTextColor(200, 220, 255)
    const dateStr = generatedAt ? new Date(generatedAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')
    doc.text(`تاريخ التقرير: ${dateStr}`, margin, 42)

    y = 58

    // ── Patient Information Section ──────────────────────────
    doc.setFillColor(249, 250, 251)
    doc.setDrawColor(229, 231, 235)
    doc.roundedRect(margin, y, W - margin * 2, 35, 3, 3, 'FD')

    doc.setTextColor(...dark)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('👤 معلومات المريض', margin + 4, y + 8)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gray)

    // Patient details in two columns
    const col1X = margin + 4
    const col2X = margin + 80

    doc.text(`الاسم: ${user?.full_name || 'غير محدد'}`, col1X, y + 16)
    doc.text(`العمر: ${user?.age || 'غير محدد'}`, col1X, y + 22)
    doc.text(`فصيلة الدم: ${user?.blood_type || 'غير محددة'}`, col1X, y + 28)

    doc.text(`الأمراض المزمنة: ${user?.chronic_conditions || 'لا يوجد'}`, col2X, y + 16)
    doc.text(`الحساسية: ${user?.allergies || 'لا يوجد'}`, col2X, y + 22)
    doc.text(`الجنس: ${user?.gender === 'male' ? 'ذكر' : user?.gender === 'female' ? 'أنثى' : 'غير محدد'}`, col2X, y + 28)

    y += 42

    // ── Overall Score Box ────────────────────────────────────
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, y, W - margin * 2, 45, 4, 4, 'F')

    // Score circle (simulated)
    const cx = margin + 25, cy = y + 22
    doc.setFillColor(...scoreColor(report.overall_score))
    doc.circle(cx, cy, 16, 'F')
    doc.setTextColor(...white)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(String(report.overall_score), cx, cy + 2, { align: 'center' })
    doc.setFontSize(8)
    doc.text('/ 100', cx, cy + 8, { align: 'center' })

    doc.setTextColor(...dark)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('النتيجة الصحية الإجمالية', margin + 48, y + 12)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gray)
    const summaryLines = doc.splitTextToSize(report.summary || '', W - margin * 2 - 55)
    doc.text(summaryLines, margin + 48, y + 20)

    // Status badge
    doc.setFillColor(...scoreColor(report.overall_score))
    doc.roundedRect(W - margin - 40, y + 8, 38, 10, 2, 2, 'F')
    doc.setTextColor(...white)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(report.overall_status || '', W - margin - 21, y + 14.5, { align: 'center' })

    y += 55

    // ── Health Status Summary ─────────────────────────────────
    doc.setTextColor(...dark)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('📊 ملخص الحالة الصحية', margin, y)
    y += 8

    // Determine health status text
    let healthStatus = ''
    let healthDetails = ''

    if (report.overall_score >= 80) {
        healthStatus = '✅ حالة صحية ممتازة'
        healthDetails = 'حالتك الصحية العامة ممتازة! استمر في نمط حياتك الصحي الحالي. قم بالمتابعة الدورية للحفاظ على هذا المستوى.'
    } else if (report.overall_score >= 70) {
        healthStatus = '✅ حالة صحية جيدة'
        healthDetails = 'حالتك الصحية جيدة بشكل عام. هناك بعض النقاط التي يمكن تحسينها. راجع التوصيات أدناه.'
    } else if (report.overall_score >= 60) {
        healthStatus = '⚠️ حالة صحية متوسطة'
        healthDetails = 'حالتك الصحية تتطلب بعض الاهتمام. يُنصح بزيارة الطبيب لإجراء فحص شامل.'
    } else {
        healthStatus = '⚠️ حالة صحية تحتاج اهتمام'
        healthDetails = 'حالتك الصحية تتطلب اهتماماً فورياً. يُنصح بشدة بزيارة الطبيب في أقرب وقت.'
    }

    doc.setFillColor(249, 250, 251)
    doc.roundedRect(margin, y, W - margin * 2, 25, 3, 3, 'F')
    doc.setTextColor(...dark)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(healthStatus, margin + 4, y + 8)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...gray)
    const healthLines = doc.splitTextToSize(healthDetails, W - margin * 2 - 8)
    doc.text(healthLines, margin + 4, y + 16)

    y += 32

    // ── Categories ───────────────────────────────────────────
    doc.setTextColor(...dark)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('📋 الفئات الصحية', margin, y)
    y += 7

    const colW = (W - margin * 2 - 6) / 2
    const cats = report.categories || []

    cats.forEach((cat, i) => {
        const col = i % 2
        const x = margin + col * (colW + 6)
        if (col === 0 && i > 0) y += 2

        const boxH = 42
        doc.setFillColor(...white)
        doc.setDrawColor(229, 231, 235)
        doc.roundedRect(x, y, colW, boxH, 3, 3, 'FD')

        // Category icon
        doc.setFontSize(10)
        let icon = '💚'
        if (cat.name.includes('حيوية') || cat.name.includes('Vital')) icon = '❤️'
        else if (cat.name.includes('دواء') || cat.name.includes('Medic')) icon = '💊'
        else if (cat.name.includes('متابعة') || cat.name.includes('Follow')) icon = '📅'
        else if (cat.name.includes('نمط') || cat.name.includes('Life')) icon = '🏃'

        doc.setTextColor(...dark)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(`${icon} ${cat.name}`, x + 4, y + 8)

        // Score
        doc.setTextColor(...scoreColor(cat.score))
        doc.setFontSize(11)
        doc.text(`${cat.score}%`, x + colW - 4, y + 8, { align: 'right' })

        // Score bar bg
        doc.setFillColor(229, 231, 235)
        doc.roundedRect(x + 4, y + 14, colW - 8, 5, 1, 1, 'F')
        // Score bar fill
        doc.setFillColor(...scoreColor(cat.score))
        doc.roundedRect(x + 4, y + 14, (colW - 8) * (cat.score / 100), 5, 1, 1, 'F')

        // Status
        doc.setTextColor(...scoreColor(cat.score))
        doc.setFontSize(8)
        doc.text(`الحالة: ${cat.status || 'جيد'}`, x + 4, y + 24)

        // Details
        doc.setTextColor(...gray)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        const detLines = doc.splitTextToSize(cat.details || '', colW - 8)
        doc.text(detLines.slice(0, 2), x + 4, y + 32)

        if (col === 1) y += boxH + 4
    })
    if (cats.length % 2 !== 0) y += 46

    y += 6

    // ── Urgent Alerts ────────────────────────────────────────
    const alerts = (report.urgent_alerts || []).filter(Boolean)
    if (alerts.length > 0) {
        doc.setFillColor(254, 242, 242)
        doc.setDrawColor(252, 165, 165)
        const alertH = 12 + alerts.length * 7
        doc.roundedRect(margin, y, W - margin * 2, alertH, 3, 3, 'FD')
        doc.setTextColor(185, 28, 28)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('🚨 التنبيهات العاجلة', margin + 4, y + 8)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        alerts.forEach((a, i) => doc.text(`• ${a}`, margin + 6, y + 15 + i * 7))
        y += alertH + 6
    }

    // ── Two columns: Positives + Recommendations ─────────────
    const halfW = (W - margin * 2 - 6) / 2

    // Positive points
    const pos = report.positive_points || []
    const posH = 12 + pos.length * 6
    doc.setFillColor(240, 253, 244)
    doc.setDrawColor(167, 243, 208)
    doc.roundedRect(margin, y, halfW, posH, 3, 3, 'FD')
    doc.setTextColor(4, 120, 87)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('✅ النقاط الإيجابية', margin + 4, y + 7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    pos.forEach((p, i) => doc.text(`✓ ${p}`, margin + 4, y + 13 + i * 6))

    // Top recommendations
    const recs = report.top_recommendations || []
    const recsH = 12 + recs.length * 6
    const rx = margin + halfW + 6
    doc.setFillColor(239, 246, 255)
    doc.setDrawColor(147, 197, 253)
    doc.roundedRect(rx, y, halfW, recsH, 3, 3, 'FD')
    doc.setTextColor(29, 78, 216)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('📝 أهم التوصيات', rx + 4, y + 7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    recs.forEach((r, i) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${r}`, halfW - 8)
        doc.text(lines[0], rx + 4, y + 13 + i * 6)
    })

    y += Math.max(posH, recsH) + 10

    // ── Health Actions Summary ────────────────────────────────
    doc.setTextColor(...dark)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('📈 ملخص الأنشطة الصحية', margin, y)
    y += 8

    doc.setFillColor(249, 250, 251)
    doc.roundedRect(margin, y, W - margin * 2, 30, 3, 3, 'F')

    doc.setTextColor(...dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Get activity info from report
    const vitalsCat = report.categories?.find(c => c.name.includes('حيوية') || c.name.includes('Vital'))
    const medsCat = report.categories?.find(c => c.name.includes('دواء') || c.name.includes('Medic'))
    const apptCat = report.categories?.find(c => c.name.includes('متابعة') || c.name.includes('Follow'))

    const activityY = y + 8
    doc.text('• قياسات العلامات الحيوية: ' + (vitalsCat?.details || 'لا توجد'), margin + 4, activityY)
    doc.text('• الأدوية المسجلة: ' + (medsCat?.details || 'لا توجد'), margin + 4, activityY + 7)
    doc.text('• المواعيد: ' + (apptCat?.details || 'لا توجد'), margin + 4, activityY + 14)

    y += 38

    // ── Footer ───────────────────────────────────────────────
    doc.setFillColor(...lightGray)
    doc.rect(0, 280, W, 17, 'F')
    doc.setTextColor(...gray)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.text('هذا التقرير مُنشأ بواسطة الذكاء الاصطناعي للمعلومات العامة فقط. لا يُغني عن استشارة طبيب مختص.', W / 2, 286, { align: 'center' })
    doc.text('NABDA Ai - نظام إدارة الصحة الشخصية', W / 2, 292, { align: 'center' })

    // Save with Arabic-friendly filename
    const fileName = `تقرير_صحي_${user?.full_name?.replace(/\s/g, '_') || 'مريض'}_${dateStr.replace(/\//g, '-')}.pdf`
    doc.save(fileName)
}
