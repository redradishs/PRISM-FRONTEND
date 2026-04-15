import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
    providedIn: 'root'
})
export class AnalyticsPdfExportService {

    // ============================================
    // COLOR DEFINITIONS
    // Change these RGB values to customize the color scheme of the PDF
    // Each color is defined as [Red, Green, Blue] with values from 0-255
    // ============================================
    private readonly primaryColor: [number, number, number] = [79, 70, 229];
    private readonly successColor: [number, number, number] = [34, 197, 94];
    private readonly dangerColor: [number, number, number] = [239, 68, 68];
    private readonly warningColor: [number, number, number] = [234, 179, 8];
    private readonly textDark: [number, number, number] = [31, 41, 55];
    private readonly textLight: [number, number, number] = [107, 114, 128];
    private readonly bgLight: [number, number, number] = [249, 250, 251];

    constructor() { }

    // ============================================
    // INDIVIDUAL CLASS PDF EXPORT
    // ============================================
    async exportIndividualClassPDF(data: {
        classStats: any;
        selectedClassCode: string;
        selectedClassName: string;
        performers: any[];
        topPerformers: any[];
        leastPerformers: any[];
        performanceDistribution: any;
        topicDistribution: any;
        topicGeneratedDate: string;
        instructorName: string;
        dateRangeLabel: string;
    }) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 0;

        await this.addModernHeader(doc, 'Individual Class Analytics Report',
            `${data.selectedClassName} (${data.selectedClassCode})`);

        yPosition = 38;
        this.addReportInfoStrip(doc, data.instructorName, data.dateRangeLabel, yPosition);
        yPosition = 50;

        // Class Overview Cards
        this.addSectionTitle(doc, 'Class Overview', yPosition, 10, 'center');
        yPosition += 6;

        this.addMetricCards(doc, [
            { label: 'Total Students', value: data.classStats?.totalStudents || 0, icon: '', color: this.primaryColor },
            { label: 'Performance Score', value: data.classStats?.overallPerformance || 0, icon: '', color: this.successColor },
            { label: 'Passing Rate', value: `${data.classStats?.passingRate || 0}%`, icon: '', color: this.warningColor }
        ], yPosition);

        yPosition += 28;

        // Assessment Performance Timeline
        if (data.performers && data.performers.length > 0) {
            yPosition = this.ensureSpace(doc, yPosition, 50, pageHeight);

            this.addSectionTitle(doc, 'Assessment Performance Timeline', yPosition);
            yPosition += 6;

            const assessmentData = data.performers.slice(0, 12).map((a: any) => [
                this.truncateText(a.title, 35),
                new Date(a.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                a.averageScore,
                a.participation,
                a.passingRate,
                a.submissions
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['Assessment Title', 'Date', 'Avg\nScore', 'Particip.', 'Pass\nRate', 'Submit.']],
                body: assessmentData,
                theme: 'plain',
                headStyles: {
                    fillColor: [this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                    cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
                    valign: 'middle',
                    halign: 'center',
                    minCellHeight: 8
                },
                styles: {
                    fontSize: 8,
                    cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
                    lineColor: [229, 231, 235],
                    lineWidth: 0.1
                },
                columnStyles: {
                    0: { cellWidth: 68, halign: 'left' },
                    1: { cellWidth: 28, halign: 'center' },
                    2: { cellWidth: 22, halign: 'center' },
                    3: { cellWidth: 26, halign: 'center' },
                    4: { cellWidth: 24, halign: 'center' },
                    5: { cellWidth: 22, halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [this.bgLight[0], this.bgLight[1], this.bgLight[2]]
                },
                didParseCell: (hookData: any) => {
                    if (hookData.section === 'body' && [2, 3, 4].includes(hookData.column.index)) {
                        const val = Number(hookData.cell.raw);
                        hookData.cell.text = [`${val}%`];
                        const color = this.getScoreCellColor(val);
                        hookData.cell.styles.textColor = color;
                        hookData.cell.styles.fontStyle = 'bold';
                    }
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 8;
        }

        // Top Performers
        yPosition = this.ensureSpace(doc, yPosition, 60, pageHeight);
        this.addSectionTitle(doc, 'Top Performing Students', yPosition);
        yPosition += 6;

        if (data.topPerformers && data.topPerformers.length > 0) {
            const topPerformersData = data.topPerformers.slice(0, 5).map((p: any) => [
                `#${p.rank}`,
                this.truncateText(p.name, 30),
                p.averageScore,
                p.completedAssessments,
                p.passingRate
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['Rank', 'Student Name', 'Avg Score', 'Completed', 'Pass Rate']],
                body: topPerformersData,
                theme: 'plain',
                headStyles: {
                    fillColor: [this.successColor[0], this.successColor[1], this.successColor[2]],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                    cellPadding: 3
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 3
                },
                columnStyles: {
                    0: { cellWidth: 16, halign: 'center' },
                    1: { cellWidth: 102 },
                    2: { cellWidth: 24, halign: 'center' },
                    3: { cellWidth: 24, halign: 'center' },
                    4: { cellWidth: 24, halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [240, 253, 244]
                },
                didParseCell: (hookData: any) => {
                    if (hookData.section === 'body' && [2, 4].includes(hookData.column.index)) {
                        const val = Number(hookData.cell.raw);
                        hookData.cell.text = [`${val}%`];
                        const color = this.getScoreCellColor(val);
                        hookData.cell.styles.textColor = color;
                        hookData.cell.styles.fontStyle = 'bold';
                    }
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 8;
        }

        // Students Needing Attention
        yPosition = this.ensureSpace(doc, yPosition, 60, pageHeight);
        this.addSectionTitle(doc, 'Students Needing Attention', yPosition);
        yPosition += 6;

        if (data.leastPerformers && data.leastPerformers.length > 0) {
            const leastPerformersData = data.leastPerformers.slice(0, 5).map((p: any) => [
                `#${p.rank}`,
                this.truncateText(p.name, 30),
                p.averageScore,
                p.completedAssessments,
                p.passingRate
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['Rank', 'Student Name', 'Avg Score', 'Completed', 'Pass Rate']],
                body: leastPerformersData,
                theme: 'plain',
                headStyles: {
                    fillColor: [this.dangerColor[0], this.dangerColor[1], this.dangerColor[2]],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                    cellPadding: 3
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 3
                },
                columnStyles: {
                    0: { cellWidth: 16, halign: 'center' },
                    1: { cellWidth: 102 },
                    2: { cellWidth: 24, halign: 'center' },
                    3: { cellWidth: 24, halign: 'center' },
                    4: { cellWidth: 24, halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [254, 242, 242]
                },
                didParseCell: (hookData: any) => {
                    if (hookData.section === 'body' && [2, 4].includes(hookData.column.index)) {
                        const val = Number(hookData.cell.raw);
                        hookData.cell.text = [`${val}%`];
                        const color = this.getScoreCellColor(val);
                        hookData.cell.styles.textColor = color;
                        hookData.cell.styles.fontStyle = 'bold';
                    }
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 8;
        }

        // Performance Distribution with student names
        yPosition = this.ensureSpace(doc, yPosition, 70, pageHeight);
        this.addSectionTitle(doc, 'Student Performance Distribution', yPosition);
        yPosition += 6;

        if (data.performanceDistribution?.performanceRanges) {
            const ranges = data.performanceDistribution.performanceRanges;

            const gradeEntries: { grade: string; range: string; bracket: any; level: string }[] = [
                { grade: 'A', range: '90-100%', bracket: ranges.excellent, level: 'Excellent' },
                { grade: 'B', range: '80-89%', bracket: ranges.veryGood, level: 'Very Good' },
                { grade: 'C', range: '70-79%', bracket: ranges.good, level: 'Good' },
                { grade: 'D', range: '60-69%', bracket: ranges.satisfactory, level: 'Satisfactory' },
                { grade: 'E', range: '50-59%', bracket: ranges.needsImprovement, level: 'Needs Improvement' },
                { grade: 'F', range: '0-49%', bracket: ranges.poor, level: 'Poor' }
            ];

            const distributionData = gradeEntries.map(entry => {
                const count = entry.bracket?.count || 0;
                const pct = entry.bracket?.percentage || 0;
                const students = (entry.bracket?.students || [])
                    .map((s: any) => s.name)
                    .join(', ');
                return [
                    entry.grade,
                    entry.range,
                    count,
                    `${pct}%`,
                    entry.level,
                    students || '-'
                ];
            });

            autoTable(doc, {
                startY: yPosition,
                head: [['Grade', 'Range', 'Count', '%', 'Level', 'Students']],
                body: distributionData,
                theme: 'plain',
                headStyles: {
                    fillColor: [this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                    cellPadding: 3,
                    halign: 'center'
                },
                styles: {
                    fontSize: 7.5,
                    cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
                    lineColor: [229, 231, 235],
                    lineWidth: 0.1,
                    overflow: 'linebreak'
                },
                columnStyles: {
                    0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
                    1: { cellWidth: 18, halign: 'center' },
                    2: { cellWidth: 14, halign: 'center' },
                    3: { cellWidth: 14, halign: 'center' },
                    4: { cellWidth: 28, halign: 'center' },
                    5: { cellWidth: 102, halign: 'left', fontSize: 7 }
                },
                alternateRowStyles: {
                    fillColor: [this.bgLight[0], this.bgLight[1], this.bgLight[2]]
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 8;
        }

        // Topic Analysis & Recommendations
        if (data.topicDistribution) {
            yPosition = this.ensureSpace(doc, yPosition, 50, pageHeight);

            this.addSectionTitle(doc, 'Topic Analysis & Recommendations', yPosition);
            yPosition += 5;

            doc.setFontSize(8);
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            doc.text(`Last Updated: ${new Date(data.topicGeneratedDate).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}`, 10, yPosition);
            yPosition += 8;

            const finalY = this.addTopicDistributionList(doc, data.topicDistribution, yPosition, pageWidth, pageHeight);
            yPosition = finalY;
        }

        this.addFooter(doc);

        const fileName = `PRISM_Individual_Class_${data.selectedClassCode}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    // ============================================
    // PLATFORM OVERVIEW PDF EXPORT
    // ============================================
    async exportPlatformOverviewPDF(data: {
        selectedPreset: string;
        presetLabel: string;
        platformOverviewData: any;
        overallClassPerformanceData: any[];
        topTopics: any[];
        leastTopics: any[];
        performanceTrendData: any;
        topicDistribution: any;
        topicGeneratedDate: string;
        instructorName: string;
        dateRangeLabel: string;
    }) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 0;

        await this.addModernHeader(doc, 'Platform Overview Analytics', data.presetLabel);

        yPosition = 38;
        this.addReportInfoStrip(doc, data.instructorName, data.dateRangeLabel, yPosition);
        yPosition = 50;

        // ── Platform Metrics ──
        this.addSectionTitle(doc, 'Platform Performance Summary', yPosition, 10, 'center');
        yPosition += 6;

        this.addMetricCards(doc, [
            { label: 'Total Assessments', value: data.platformOverviewData.totalAssessments || 0, icon: '', color: this.primaryColor },
            { label: 'Average Score', value: `${data.platformOverviewData.averageScore || 0}%`, icon: '', color: this.successColor },
            { label: 'Total Classes', value: data.platformOverviewData.totalClasses || 0, icon: '', color: this.warningColor }
        ], yPosition);

        yPosition += 28;

        // ── Class Performance Comparison ──
        if (data.overallClassPerformanceData && data.overallClassPerformanceData.length > 0) {
            yPosition = this.ensureSpace(doc, yPosition, 25, pageHeight);
            this.addSectionTitle(doc, 'Class Performance Comparison', yPosition, 10, 'center');
            yPosition += 5;

            const classData = data.overallClassPerformanceData.slice(0, 8).map((c: any) => [
                this.truncateText(c.className, 25),
                c.averageScore,
                c.participationRate,
                c.passingRate,
                c.totalStudents,
                c.totalAssessments,
                c.performance
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['Class Name', 'Avg\nScore', 'Particip.', 'Pass\nRate', 'Students', 'Assess.', 'Perform.']],
                body: classData,
                theme: 'plain',
                headStyles: {
                    fillColor: [this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 7.5,
                    cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
                    valign: 'middle',
                    halign: 'center',
                    minCellHeight: 8
                },
                styles: { fontSize: 7.5, cellPadding: 2.5 },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { cellWidth: 21, halign: 'center' },
                    2: { cellWidth: 23, halign: 'center' },
                    3: { cellWidth: 20, halign: 'center' },
                    4: { cellWidth: 20, halign: 'center' },
                    5: { cellWidth: 24, halign: 'center' },
                    6: { cellWidth: 22, halign: 'center' }
                },
                alternateRowStyles: { fillColor: [this.bgLight[0], this.bgLight[1], this.bgLight[2]] },
                didParseCell: (hookData: any) => {
                    if (hookData.section === 'body' && [1, 2, 3].includes(hookData.column.index)) {
                        const val = Number(hookData.cell.raw);
                        hookData.cell.text = [`${val}%`];
                        hookData.cell.styles.textColor = this.getScoreCellColor(val);
                        hookData.cell.styles.fontStyle = 'bold';
                    }
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 4;
        }

        // ── Trend Analysis Banner ──
        if (data.performanceTrendData?.trendAnalysis) {
            yPosition = this.ensureSpace(doc, yPosition, 16, pageHeight);

            const improvement = data.performanceTrendData.trendAnalysis.improvement;
            const bgColor: [number, number, number] = improvement > 0 ? [220, 252, 231] : improvement < 0 ? [254, 242, 242] : [243, 244, 246];
            const borderColor: [number, number, number] = improvement > 0 ? this.successColor : improvement < 0 ? this.dangerColor : this.textLight;

            doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.roundedRect(10, yPosition, pageWidth - 20, 12, 2, 2, 'F');
            doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(10, yPosition, pageWidth - 20, 12, 2, 2, 'S');

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
            doc.text('Trend Analysis', 14, yPosition + 5);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            const detailLines = doc.splitTextToSize(data.performanceTrendData.trendAnalysis.details, pageWidth - 65);
            doc.text(detailLines[0] || '', 14, yPosition + 9.5);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(borderColor[0], borderColor[1], borderColor[2]);
            const improvementValue = Math.abs(Number(improvement)).toFixed(1);
            const improvementText = improvement > 0 ? `+${improvementValue}%` : improvement < 0 ? `-${improvementValue}%` : `${improvementValue}%`;
            doc.text(improvementText, pageWidth - 16, yPosition + 8, { align: 'right' });

            yPosition += 18;
        }

        // ── Topic Performance Analysis (side-by-side) ──
        yPosition = this.ensureSpace(doc, yPosition, 30, pageHeight);
        this.addSectionTitle(doc, 'Topic Performance Analysis', yPosition, 10, 'center');
        yPosition += 5;

        const halfW = (pageWidth - 24) / 2;
        const leftX = 10;
        const rightX = leftX + halfW + 4;
        let leftFinalY = yPosition;
        let rightFinalY = yPosition;

        if (data.topTopics && data.topTopics.length > 0) {
            autoTable(doc, {
                startY: yPosition,
                head: [['Top Performing Topics', '%', '#']],
                body: data.topTopics.slice(0, 8).map((t: any) => [
                    this.truncateText(t.categoryName, 28), `${t.percentage}%`, t.totalAssessments
                ]),
                theme: 'plain',
                headStyles: { fillColor: [this.successColor[0], this.successColor[1], this.successColor[2]], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 2.5, halign: 'center' },
                styles: { fontSize: 8, cellPadding: 2.5 },
                columnStyles: { 0: { cellWidth: halfW - 30, halign: 'left' }, 1: { cellWidth: 16, halign: 'center' }, 2: { cellWidth: 14, halign: 'center' } },
                alternateRowStyles: { fillColor: [240, 253, 244] },
                margin: { left: leftX, right: rightX }
            });
            leftFinalY = (doc as any).lastAutoTable.finalY;
        }

        if (data.leastTopics && data.leastTopics.length > 0) {
            autoTable(doc, {
                startY: yPosition,
                head: [['Commonly Missed Topics', '%', '#']],
                body: data.leastTopics.slice(0, 8).map((t: any) => [
                    this.truncateText(t.categoryName, 28), `${t.percentage}%`, t.totalAssessments
                ]),
                theme: 'plain',
                headStyles: { fillColor: [this.dangerColor[0], this.dangerColor[1], this.dangerColor[2]], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 2.5, halign: 'center' },
                styles: { fontSize: 8, cellPadding: 2.5 },
                columnStyles: { 0: { cellWidth: halfW - 30, halign: 'left' }, 1: { cellWidth: 16, halign: 'center' }, 2: { cellWidth: 14, halign: 'center' } },
                alternateRowStyles: { fillColor: [254, 242, 242] },
                margin: { left: rightX, right: 10 }
            });
            rightFinalY = (doc as any).lastAutoTable.finalY;
        }

        yPosition = Math.max(leftFinalY, rightFinalY) + 8;

        // ── Performance Trend Graph + Detailed Trend Table ──
        if (data.performanceTrendData?.trends && data.performanceTrendData.trends.length > 0) {
            yPosition = this.ensureSpace(doc, yPosition, 65, pageHeight);

            this.addSectionTitle(doc, 'Performance Trend Over Time', yPosition, 10, 'center');
            yPosition += 5;

            const graphHeight = 50;
            this.drawPerformanceTrendGraph(doc, data.performanceTrendData.trends, yPosition, pageWidth, graphHeight);
            yPosition += graphHeight + 4;

            const activeTrends = data.performanceTrendData.trends.filter((t: any) => t.totalSubmissions > 0);
            const trendTableH = 9 + activeTrends.slice(0, 12).length * 8;
            yPosition = this.ensureSpace(doc, yPosition, trendTableH, pageHeight);

            autoTable(doc, {
                startY: yPosition,
                head: [['Period', 'Avg Score', 'Submissions', 'Passing', 'High Perf.', 'Low Perf.', 'Consistency']],
                body: activeTrends.slice(0, 12).map((m: any) => [
                    m.period, m.averagePercentage, m.totalSubmissions, m.passingRate, m.highPerformerRate, m.lowPerformerRate, m.consistency
                ]),
                theme: 'plain',
                headStyles: {
                    fillColor: [this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 7.5,
                    cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
                    halign: 'center',
                    valign: 'middle',
                    minCellHeight: 7
                },
                showHead: 'firstPage',
                styles: { fontSize: 7.5, cellPadding: 2 },
                columnStyles: {
                    0: { cellWidth: 38 },
                    1: { cellWidth: 26, halign: 'center' },
                    2: { cellWidth: 26, halign: 'center' },
                    3: { cellWidth: 26, halign: 'center' },
                    4: { cellWidth: 26, halign: 'center' },
                    5: { cellWidth: 22, halign: 'center' },
                    6: { cellWidth: 26, halign: 'center' }
                },
                alternateRowStyles: { fillColor: [this.bgLight[0], this.bgLight[1], this.bgLight[2]] },
                didParseCell: (hookData: any) => {
                    if (hookData.section === 'body' && [1, 3, 4, 5, 6].includes(hookData.column.index)) {
                        const val = Number(hookData.cell.raw);
                        hookData.cell.text = [`${val}%`];
                        if ([1, 3].includes(hookData.column.index)) {
                            hookData.cell.styles.textColor = this.getScoreCellColor(val);
                            hookData.cell.styles.fontStyle = 'bold';
                        }
                    }
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 6;
        }

        // ── Performance Summary & Key Insights Card ──
        if (data.performanceTrendData?.summary && data.performanceTrendData?.insights) {
            yPosition = this.ensureSpace(doc, yPosition, 70, pageHeight);

            this.addPerformanceSummaryCard(doc, data.performanceTrendData.summary, data.performanceTrendData.insights, yPosition, pageWidth);
            yPosition += 74;
        }

        // ── AI Topic Health Analysis (3-column card layout) ──
        if (data.topicDistribution) {
            yPosition += 4;
            yPosition = this.ensureSpace(doc, yPosition, 40, pageHeight);

            this.addSectionTitle(doc, 'AI Topic Health Analysis', yPosition, 10, 'center');
            yPosition += 9;

            const hasGenDate = !!data.topicGeneratedDate;
            const hasSummary = !!data.topicDistribution.summary;

            if (hasSummary || hasGenDate) {
                if (hasSummary) {
                    const s = data.topicDistribution.summary;
                    const summaryText = `${s.total_topics} topics analyzed: ${s.top_count} excelling, ${s.average_count} average, ${s.needs_attention_count} need attention`;
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
                    doc.text(summaryText, 14, yPosition);
                }
                if (hasGenDate) {
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
                    doc.text(`Generated: ${new Date(data.topicGeneratedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, pageWidth - 14, yPosition, { align: 'right' });
                }
                yPosition += 6;
            }

            const categories: { label: string; color: [number, number, number]; bgColor: [number, number, number]; lightBg: [number, number, number]; items: any[] }[] = [
                { label: 'Excelling', color: [22, 163, 74], bgColor: [22, 163, 74], lightBg: [240, 253, 244], items: (data.topicDistribution.top || []).slice(0, 5) },
                { label: 'Average', color: [202, 138, 4], bgColor: [202, 138, 4], lightBg: [254, 252, 232], items: (data.topicDistribution.average || []).slice(0, 5) },
                { label: 'Needs Attention', color: [220, 38, 38], bgColor: [220, 38, 38], lightBg: [254, 242, 242], items: (data.topicDistribution.needs_attention || []).slice(0, 5) }
            ];

            const colWidth = (pageWidth - 22) / 3;
            const colGap = 1;
            const cardH = 22;
            const headerH = 12;
            const maxItems = Math.max(...categories.map(c => c.items.length));
            const totalBlockH = headerH + maxItems * cardH + 4;
            yPosition = this.ensureSpace(doc, yPosition, totalBlockH, pageHeight);

            categories.forEach((cat, colIdx) => {
                const colX = 10 + colIdx * (colWidth + colGap);
                let cardY = yPosition;

                doc.setFillColor(cat.bgColor[0], cat.bgColor[1], cat.bgColor[2]);
                doc.roundedRect(colX, cardY, colWidth, 10, 2, 2, 'F');
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(cat.label, colX + colWidth / 2, cardY + 6.5, { align: 'center' });

                doc.setFontSize(8);
                doc.setTextColor(255, 255, 255);
                doc.text(`${cat.items.length} topic${cat.items.length !== 1 ? 's' : ''}`, colX + colWidth - 3, cardY + 6.5, { align: 'right' });

                cardY += headerH;

                cat.items.forEach((topic: any, idx: number) => {
                    const isEven = idx % 2 === 0;
                    const itemBg: [number, number, number] = isEven ? cat.lightBg : [255, 255, 255];
                    doc.setFillColor(itemBg[0], itemBg[1], itemBg[2]);
                    doc.setDrawColor(229, 231, 235);
                    doc.setLineWidth(0.2);
                    doc.roundedRect(colX, cardY, colWidth, cardH - 1, 1.5, 1.5, 'FD');

                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
                    const titleLines = doc.splitTextToSize(topic.title || '-', colWidth - 20);
                    doc.text(titleLines[0], colX + 3, cardY + 5.5);

                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(cat.color[0], cat.color[1], cat.color[2]);
                    const healthStr = topic.health_score != null ? `${topic.health_score}%` : '-';
                    doc.text(healthStr, colX + colWidth - 3, cardY + 6, { align: 'right' });

                    doc.setFontSize(6.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
                    const actionLines = doc.splitTextToSize(topic.recommended_actions || topic.status_reason || '-', colWidth - 6);
                    doc.text(actionLines.slice(0, 2), colX + 3, cardY + 10.5);

                    cardY += cardH;
                });
            });

            yPosition += totalBlockH + 6;
        }

        this.addFooter(doc);

        const fileName = `PRISM_Platform_Overview_${data.selectedPreset}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    // ============================================
    // SHARED HELPERS
    // ============================================

    private async addModernHeader(doc: jsPDF, title: string, subtitle: string) {
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, pageWidth, 38, 'F');

        doc.setFillColor(67, 56, 202);
        doc.rect(0, 0, pageWidth, 20, 'F');

        try {
            const logoPath = '/prism_logo.webp';
            const logoData = await this.loadImage(logoPath);

            const logoX = 14, logoY = 8, logoSize = 22, radius = 3;

            doc.setFillColor(255, 255, 255);
            doc.roundedRect(logoX, logoY, logoSize, logoSize, radius, radius, 'F');

            doc.saveGraphicsState();
            const clipMargin = 0.5;
            doc.addImage(logoData, 'PNG', logoX + clipMargin, logoY + clipMargin, logoSize - (clipMargin * 2), logoSize - (clipMargin * 2));
            doc.restoreGraphicsState();

            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(2);
            doc.roundedRect(logoX, logoY, logoSize, logoSize, radius, radius, 'S');

        } catch {
            // Logo not available
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('PRISM', 40, 18);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Elevate your Assessment Needs with PRISM', 40, 24);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const titleWidth = doc.getTextWidth(title);
        doc.text(title, pageWidth - titleWidth - 14, 16);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const subtitleWidth = doc.getTextWidth(subtitle);
        doc.text(subtitle, pageWidth - subtitleWidth - 14, 23);

        doc.setFontSize(8);
        const dateText = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, pageWidth - dateWidth - 14, 30);

        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.line(14, 36, pageWidth - 14, 36);
    }

    private addReportInfoStrip(doc: jsPDF, instructorName: string, _dateRangeLabel: string, yPosition: number) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const stripHeight = 7;

        doc.setFillColor(67, 56, 202);
        doc.rect(0, yPosition, pageWidth, stripHeight, 'F');

        const textY = yPosition + 4.8;
        doc.setFontSize(7.5);
        doc.setTextColor(200, 196, 255);

        doc.setFont('helvetica', 'normal');
        doc.text(`Instructor: ${instructorName || 'N/A'}`, 14, textY);
    }

    private addSectionTitle(
        doc: jsPDF,
        title: string,
        yPosition: number,
        xPosition: number = 10,
        align: 'left' | 'center' = 'left'
    ) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);

        if (align === 'center') {
            const pageWidth = doc.internal.pageSize.getWidth();
            const centerX = pageWidth / 2;
            doc.text(title, centerX, yPosition, { align: 'center' });

            const textWidth = doc.getTextWidth(title);
            const lineStart = centerX - textWidth / 2;
            doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
            doc.setLineWidth(0.8);
            doc.line(lineStart, yPosition + 1, lineStart + textWidth, yPosition + 1);
        } else {
            doc.text(title, xPosition, yPosition);
            const textWidth = doc.getTextWidth(title);
            doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
            doc.setLineWidth(0.8);
            doc.line(xPosition, yPosition + 1, xPosition + textWidth, yPosition + 1);
        }
    }

    private addSubsectionTitle(doc: jsPDF, title: string, yPosition: number, xPosition: number = 10, color: [number, number, number] = this.primaryColor) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(title, xPosition, yPosition);
    }

    private addMetricCards(doc: jsPDF, metrics: Array<{ label: string, value: any, icon: string, color: [number, number, number] }>, yPosition: number) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const cardWidth = (pageWidth - 40) / 3;
        const cardHeight = 22;
        let xPosition = 10;

        metrics.forEach((metric) => {
            doc.setFillColor(this.bgLight[0], this.bgLight[1], this.bgLight[2]);
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 2, 2, 'F');

            doc.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 2, 2, 'S');

            if (metric.icon) {
                doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
                doc.circle(xPosition + 8, yPosition + 12, 6, 'F');
                doc.setFontSize(14);
                doc.text(metric.icon, xPosition + 6, yPosition + 14);
            }

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            doc.text(metric.label.toUpperCase(), xPosition + cardWidth / 2, yPosition + 7, { align: 'center' });

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
            doc.text(String(metric.value), xPosition + cardWidth / 2, yPosition + 16, { align: 'center' });

            xPosition += cardWidth + 10;
        });
    }

    private addTopicDistributionList(doc: jsPDF, topicDistribution: any, yPosition: number, pageWidth: number, pageHeight: number): number {
        let currentY = yPosition;
        const cardMargin = 10;
        const cardWidth = pageWidth - (cardMargin * 2);

        const sections: { key: string; label: string; color: [number, number, number]; altBg: [number, number, number] }[] = [
            { key: 'top', label: 'Top Performing Topics', color: this.successColor, altBg: [248, 250, 252] },
            { key: 'average', label: 'Average Performance Topics', color: this.warningColor, altBg: [248, 250, 252] },
            { key: 'needs_attention', label: 'Topics Requiring Attention', color: this.dangerColor, altBg: [254, 242, 242] }
        ];

        for (const section of sections) {
            const items: any[] = topicDistribution[section.key];
            if (!items || items.length === 0) continue;

            currentY = this.ensureSpace(doc, currentY, 30, pageHeight);

            const boxHeight = Math.min(items.length, 5) * 5.5 + 12;

            doc.setFillColor(255, 255, 255);
            doc.roundedRect(cardMargin, currentY, cardWidth, boxHeight, 3, 3, 'F');

            doc.setFillColor(section.color[0], section.color[1], section.color[2]);
            doc.roundedRect(cardMargin, currentY, 4, boxHeight, 3, 3, 'F');

            doc.setDrawColor(section.color[0], section.color[1], section.color[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(cardMargin, currentY, cardWidth, boxHeight, 3, 3, 'S');

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            const headerColor = section.key === 'needs_attention' ? section.color : this.textDark;
            doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
            doc.text(section.label, cardMargin + 7, currentY + 6);

            doc.setFillColor(section.color[0], section.color[1], section.color[2]);
            doc.roundedRect(cardMargin + cardWidth - 22, currentY + 2, 18, 6, 2, 2, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(String(items.length), cardMargin + cardWidth - 13, currentY + 6, { align: 'center' });

            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.3);
            doc.line(cardMargin + 7, currentY + 9, cardMargin + cardWidth - 7, currentY + 9);

            let itemY = currentY + 13;
            items.slice(0, 5).forEach((topic: any, idx: number) => {
                if (idx % 2 === 0) {
                    doc.setFillColor(section.altBg[0], section.altBg[1], section.altBg[2]);
                    doc.rect(cardMargin + 6, itemY - 2.5, cardWidth - 12, 5, 'F');
                }

                if (section.key === 'needs_attention') {
                    doc.setFillColor(section.color[0], section.color[1], section.color[2]);
                    doc.circle(cardMargin + 9, itemY - 1, 0.8, 'F');
                }

                const xOffset = section.key === 'needs_attention' ? 11 : 8;
                const maxLen = section.key === 'needs_attention' ? 60 : 62;

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);

                const titleText = this.truncateText(topic.title, maxLen);
                const percentageSuffix = topic.percentage != null ? ` (${topic.percentage}%)` : '';
                doc.text(`${idx + 1}. ${titleText}${percentageSuffix}`, cardMargin + xOffset, itemY);
                itemY += 5.5;
            });

            if (items.length > 5) {
                doc.setFontSize(7);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
                const moreText = section.key === 'needs_attention'
                    ? `+${items.length - 5} more topics requiring immediate attention...`
                    : `+${items.length - 5} more topics...`;
                doc.text(moreText, cardMargin + 8, itemY);
            }

            currentY += boxHeight + 5;
        }

        return currentY;
    }

    private addFooter(doc: jsPDF) {
        const totalPages = doc.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);

            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.3);
            doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);

            doc.setFontSize(8);
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            doc.setFont('helvetica', 'normal');
            doc.text('© PRISM Analytics Platform - Confidential Report', 10, pageHeight - 7);

            doc.setFont('helvetica', 'bold');
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - 10, pageHeight - 7, { align: 'right' });
        }
    }

    private drawPerformanceTrendGraph(doc: jsPDF, trends: any[], yPosition: number, pageWidth: number, graphHeight: number) {
        const margin = 10;
        const graphWidth = pageWidth - (margin * 2);
        const graphX = margin;
        const graphY = yPosition;
        const plotHeight = graphHeight - 20;

        const validTrends = trends.filter(t => t.totalSubmissions > 0);
        if (validTrends.length === 0) return;

        doc.setFillColor(249, 250, 251);
        doc.roundedRect(graphX, graphY, graphWidth, graphHeight, 2, 2, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.roundedRect(graphX, graphY, graphWidth, graphHeight, 2, 2, 'S');

        const maxValue = 100;
        const dataPoints = validTrends.length;
        const xStep = (graphWidth - 20) / Math.max(dataPoints - 1, 1);
        const yScale = plotHeight / maxValue;

        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.1);
        for (let i = 0; i <= 4; i++) {
            const y = graphY + 5 + (plotHeight * i / 4);
            doc.line(graphX + 10, y, graphX + graphWidth - 10, y);

            doc.setFontSize(7);
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            doc.text(`${100 - (i * 25)}%`, graphX + 3, y + 1);
        }

        const drawLine = (data: number[], color: [number, number, number], lineWidth: number = 1.5) => {
            doc.setDrawColor(color[0], color[1], color[2]);
            doc.setLineWidth(lineWidth);

            for (let i = 0; i < data.length - 1; i++) {
                const x1 = graphX + 10 + (i * xStep);
                const y1 = graphY + 5 + plotHeight - (data[i] * yScale);
                const x2 = graphX + 10 + ((i + 1) * xStep);
                const y2 = graphY + 5 + plotHeight - (data[i + 1] * yScale);

                doc.line(x1, y1, x2, y2);

                doc.setFillColor(color[0], color[1], color[2]);
                doc.circle(x1, y1, 1.5, 'F');
                if (i === data.length - 2) {
                    doc.circle(x2, y2, 1.5, 'F');
                }
            }
        };

        const avgScores = validTrends.map(t => t.averagePercentage);
        const passingRates = validTrends.map(t => t.passingRate);
        const consistency = validTrends.map(t => t.consistency);

        drawLine(consistency, [156, 163, 175], 1.2);
        drawLine(passingRates, this.successColor, 1.5);
        drawLine(avgScores, this.primaryColor, 2);

        doc.setFontSize(7);
        doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
        validTrends.forEach((trend, i) => {
            const x = graphX + 10 + (i * xStep);
            const monthLabel = trend.period.split(' ')[0].substring(0, 3);
            doc.text(monthLabel, x, graphY + graphHeight - 8, { align: 'center' });
        });

        const legendY = graphY + graphHeight - 3;
        const legendStartX = graphX + graphWidth / 2 - 45;

        doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setLineWidth(2);
        doc.line(legendStartX, legendY, legendStartX + 8, legendY);
        doc.setFontSize(7);
        doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
        doc.text('Avg Score', legendStartX + 10, legendY + 1);

        doc.setDrawColor(this.successColor[0], this.successColor[1], this.successColor[2]);
        doc.setLineWidth(1.5);
        doc.line(legendStartX + 35, legendY, legendStartX + 43, legendY);
        doc.text('Passing', legendStartX + 45, legendY + 1);

        doc.setDrawColor(156, 163, 175);
        doc.setLineWidth(1.2);
        doc.line(legendStartX + 68, legendY, legendStartX + 76, legendY);
        doc.text('Consistency', legendStartX + 78, legendY + 1);
    }

    private addPerformanceSummaryCard(doc: jsPDF, summary: any, insights: any, yPosition: number, pageWidth: number) {
        const cardX = 10;
        const cardWidth = pageWidth - 20;
        const cardHeight = 70;

        doc.setFillColor(247, 250, 252);
        doc.roundedRect(cardX, yPosition, cardWidth, cardHeight, 3, 3, 'F');
        doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(cardX, yPosition, cardWidth, cardHeight, 3, 3, 'S');

        doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.roundedRect(cardX + 2, yPosition + 2, cardWidth - 4, 8, 2, 2, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Performance Summary & Key Insights', cardX + 5, yPosition + 7.5);

        let contentY = yPosition + 14;

        const metricsData: Array<{ label: string; value: string; color: [number, number, number] | number[] }> = [
            { label: 'OVERALL AVERAGE', value: `${summary.overallAveragePercentage}%`, color: this.primaryColor },
            { label: 'TOTAL SUBMISSIONS', value: summary.totalSubmissions.toLocaleString(), color: this.successColor },
            { label: 'PASSING RATE', value: `${summary.averagePassingRate}%`, color: this.warningColor },
            { label: 'CONSISTENCY', value: `${summary.overallConsistency}%`, color: [59, 130, 246] },
            { label: 'HIGH PERFORMERS', value: `${summary.averageHighPerformerRate}%`, color: this.successColor },
            { label: 'NEED SUPPORT', value: `${summary.averageLowPerformerRate}%`, color: this.dangerColor },
            { label: 'ACTIVE MONTHS', value: `${summary.activeMonths}/${summary.totalMonthsInRange}`, color: [107, 114, 128] }
        ];

        const metricBoxWidth = (cardWidth - 12) / 4;
        const metricBoxHeight = 12;

        for (let i = 0; i < metricsData.length; i++) {
            const row = Math.floor(i / 4);
            const col = i % 4;
            const boxX = cardX + 4 + (col * metricBoxWidth);
            const boxY = contentY + (row * (metricBoxHeight + 2));

            doc.setFillColor(255, 255, 255);
            doc.roundedRect(boxX, boxY, metricBoxWidth - 2, metricBoxHeight, 2, 2, 'F');
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.2);
            doc.roundedRect(boxX, boxY, metricBoxWidth - 2, metricBoxHeight, 2, 2, 'S');

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            doc.text(metricsData[i].label, boxX + 2, boxY + 4);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(metricsData[i].color[0], metricsData[i].color[1], metricsData[i].color[2]);
            doc.text(String(metricsData[i].value), boxX + 2, boxY + 9);
        }

        contentY += 30;

        doc.setFillColor(254, 249, 195);
        doc.roundedRect(cardX + 4, contentY, cardWidth - 8, 22, 2, 2, 'F');
        doc.setDrawColor(this.warningColor[0], this.warningColor[1], this.warningColor[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(cardX + 4, contentY, cardWidth - 8, 22, 2, 2, 'S');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
        doc.text('KEY INSIGHTS', cardX + 7, contentY + 5);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);

        doc.text(`• Most Productive: ${insights.mostProductiveMonth}`, cardX + 7, contentY + 11);
        doc.text(`• Best Performance: ${insights.bestPerformanceMonth}`, cardX + 7, contentY + 15.5);
        doc.text(`• Most Consistent: ${insights.mostConsistentMonth}`, cardX + 7, contentY + 20);
    }

    private ensureSpace(doc: jsPDF, yPosition: number, needed: number, pageHeight: number): number {
        if (yPosition + needed > pageHeight - 12) {
            doc.addPage();
            return 14;
        }
        return yPosition;
    }

    private getScoreCellColor(value: number): [number, number, number] {
        if (value >= 80) return [22, 163, 74];
        if (value >= 60) return [202, 138, 4];
        return [220, 38, 38];
    }

    private formatPercentageCell(value: number): string {
        return `${value}%`;
    }

    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    private loadImage(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                }

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = path;
        });
    }
}
