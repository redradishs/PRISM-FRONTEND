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
    private readonly primaryColor: [number, number, number] = [79, 70, 229]; // Indigo - Used for main headers and primary elements
    private readonly successColor: [number, number, number] = [34, 197, 94]; // Green - Used for positive metrics and top performers
    private readonly dangerColor: [number, number, number] = [239, 68, 68]; // Red - Used for warnings and students needing attention
    private readonly warningColor: [number, number, number] = [234, 179, 8]; // Yellow - Used for caution items
    private readonly textDark: [number, number, number] = [31, 41, 55]; // Gray-800 - Main text color
    private readonly textLight: [number, number, number] = [107, 114, 128]; // Gray-500 - Secondary text color
    private readonly bgLight: [number, number, number] = [249, 250, 251]; // Gray-50 - Light background for alternating rows

    constructor() { }

    // INDIVIDUAL CLASS PDF EXPORT - Generates comprehensive class analytics report
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
    }) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 0;

        // Modern Header with Logo and Gradient
        await this.addModernHeader(doc, 'Individual Class Analytics Report',
            `${data.selectedClassName} (${data.selectedClassCode})`);

        yPosition = 45;

        // Class Overview Cards
        this.addSectionTitle(doc, 'Class Overview', yPosition);
        yPosition += 6;

        this.addMetricCards(doc, [
            { label: 'Total Students', value: data.classStats?.totalStudents || 0, icon: '', color: this.primaryColor },
            { label: 'Performance Score', value: data.classStats?.overallPerformance || 0, icon: '', color: this.successColor },
            { label: 'Passing Rate', value: `${data.classStats?.passingRate || 0}%`, icon: '', color: this.warningColor }
        ], yPosition);

        yPosition += 32;

        // Assessment Performance
        if (data.performers && data.performers.length > 0) {
            this.addSectionTitle(doc, 'Assessment Performance Timeline', yPosition);
            yPosition += 8;

            const assessmentData = data.performers.slice(0, 12).map((a: any) => [
                this.truncateText(a.title, 35),
                new Date(a.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                this.formatPercentageCell(a.averageScore),
                this.formatPercentageCell(a.participation),
                this.formatPercentageCell(a.passingRate),
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
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // Check if we need a new page for Performance Analysis
        if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = 20;
        }

        // Top Performers (Full Width)
        this.addSectionTitle(doc, 'Top Performing Students', yPosition);
        yPosition += 8;

        if (data.topPerformers && data.topPerformers.length > 0) {
            const topPerformersData = data.topPerformers.slice(0, 5).map((p: any) => [
                `#${p.rank}`,
                this.truncateText(p.name, 30),
                `${p.averageScore}%`,
                p.completedAssessments,
                `${p.passingRate}%`
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
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // Check if we need a new page for Students Needing Attention
        if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = 20;
        }

        // Students Needing Attention (Full Width)
        this.addSectionTitle(doc, 'Students Needing Attention', yPosition);
        yPosition += 8;

        if (data.leastPerformers && data.leastPerformers.length > 0) {
            const leastPerformersData = data.leastPerformers.slice(0, 5).map((p: any) => [
                `#${p.rank}`,
                this.truncateText(p.name, 30),
                `${p.averageScore}%`,
                p.completedAssessments,
                `${p.passingRate}%`
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
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // Performance Distribution
        this.addSectionTitle(doc, 'Student Performance Distribution', yPosition);
        yPosition += 8;

        if (data.performanceDistribution?.performanceRanges) {
            const distributionData = [
                ['A', '90-100%', data.performanceDistribution.performanceRanges.excellent?.count || 0, `${data.performanceDistribution.performanceRanges.excellent?.percentage || 0}%`, 'Excellent'],
                ['B', '80-89%', data.performanceDistribution.performanceRanges.veryGood?.count || 0, `${data.performanceDistribution.performanceRanges.veryGood?.percentage || 0}%`, 'Very Good'],
                ['C', '70-79%', data.performanceDistribution.performanceRanges.good?.count || 0, `${data.performanceDistribution.performanceRanges.good?.percentage || 0}%`, 'Good'],
                ['D', '60-69%', data.performanceDistribution.performanceRanges.satisfactory?.count || 0, `${data.performanceDistribution.performanceRanges.satisfactory?.percentage || 0}%`, 'Satisfactory'],
                ['E', '50-59%', data.performanceDistribution.performanceRanges.needsImprovement?.count || 0, `${data.performanceDistribution.performanceRanges.needsImprovement?.percentage || 0}%`, 'Needs Improvement'],
                ['F', '0-49%', data.performanceDistribution.performanceRanges.poor?.count || 0, `${data.performanceDistribution.performanceRanges.poor?.percentage || 0}%`, 'Poor']
            ];

            autoTable(doc, {
                startY: yPosition,
                head: [['Grade', 'Range', 'Students', 'Percentage', 'Performance Level']],
                body: distributionData,
                theme: 'plain',
                headStyles: {
                    fillColor: [this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]],
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
                    0: { cellWidth: 18, halign: 'center' },
                    1: { cellWidth: 26, halign: 'center' },
                    2: { cellWidth: 28, halign: 'center' },
                    3: { cellWidth: 28, halign: 'center' },
                    4: { cellWidth: 90, halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [this.bgLight[0], this.bgLight[1], this.bgLight[2]]
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // Topic Analysis & Recommendations
        if (data.topicDistribution) {
            // Check if we need a new page for Topic Analysis
            if (yPosition > pageHeight - 60) {
                doc.addPage();
                yPosition = 20;
            }

            this.addSectionTitle(doc, 'Topic Analysis & Recommendations', yPosition);
            yPosition += 5;

            doc.setFontSize(8);
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            doc.text(`Last Updated: ${new Date(data.topicGeneratedDate).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}`, 10, yPosition);
            yPosition += 8;

            // Use the same compact list style as platform overview
            const finalY = this.addTopicDistributionList(doc, data.topicDistribution, yPosition, pageWidth, pageHeight);
            yPosition = finalY;
        }

        // Footer on all pages
        this.addFooter(doc);

        // Save PDF
        const fileName = `PRISM_Individual_Class_${data.selectedClassCode}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    // PLATFORM OVERVIEW PDF EXPORT - Generates platform-wide analytics report with trends and comparisons
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
    }) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 0;

        // Modern Header
        await this.addModernHeader(doc, 'Platform Overview Analytics', data.presetLabel);

        yPosition = 45;

        // Platform Metrics
        this.addSectionTitle(doc, 'Platform Performance Summary', yPosition, 10, 'center');
        yPosition += 7;

        this.addMetricCards(doc, [
            { label: 'Total Assessments', value: data.platformOverviewData.totalAssessments || 0, icon: '', color: this.primaryColor },
            { label: 'Average Score', value: `${data.platformOverviewData.averageScore || 0}%`, icon: '', color: this.successColor },
            { label: 'Total Classes', value: data.platformOverviewData.totalClasses || 0, icon: '', color: this.warningColor }
        ], yPosition);

        yPosition += 32;

        // Class Performance Comparison
        if (data.overallClassPerformanceData && data.overallClassPerformanceData.length > 0) {
            this.addSectionTitle(doc, 'Class Performance Comparison', yPosition);
            yPosition += 7;

            const classData = data.overallClassPerformanceData.slice(0, 8).map((c: any) => [
                this.truncateText(c.className, 25),
                this.formatPercentageCell(c.averageScore),
                this.formatPercentageCell(c.participationRate),
                this.formatPercentageCell(c.passingRate),
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
                styles: {
                    fontSize: 7.5,
                    cellPadding: 2.5
                },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { cellWidth: 21, halign: 'center' },
                    2: { cellWidth: 23, halign: 'center' },
                    3: { cellWidth: 20, halign: 'center' },
                    4: { cellWidth: 20, halign: 'center' },
                    5: { cellWidth: 24, halign: 'center' },
                    6: { cellWidth: 22, halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [this.bgLight[0], this.bgLight[1], this.bgLight[2]]
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // Topic Analysis
        if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = 20;
        }

        // Topic Performance Analysis title on left, Commonly Missed Topics on right (same line)
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
        doc.text('Topic Performance Analysis', 10, yPosition);

        // Underline for left title
        const leftTitleWidth = doc.getTextWidth('Topic Performance Analysis');
        doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setLineWidth(0.8);
        doc.line(10, yPosition + 1, 10 + leftTitleWidth, yPosition + 1);

        // Right title (Commonly Missed Topics) on same line
        const rightTitle = 'Commonly Missed Topics';
        const rightTitleWidth = doc.getTextWidth(rightTitle);
        doc.setTextColor(this.dangerColor[0], this.dangerColor[1], this.dangerColor[2]);
        doc.text(rightTitle, pageWidth - rightTitleWidth - 10, yPosition);

        // Underline for right title
        doc.setDrawColor(this.dangerColor[0], this.dangerColor[1], this.dangerColor[2]);
        doc.line(pageWidth - rightTitleWidth - 10, yPosition + 1, pageWidth - 10, yPosition + 1);

        yPosition += 2;

        // Top Performing Topics subsection
        if (data.topTopics && data.topTopics.length > 0) {
            this.addSubsectionTitle(doc, 'Top Performing Topics', yPosition, 10, this.successColor);
        }
        yPosition += 6;

        // Top Topics Table
        if (data.topTopics && data.topTopics.length > 0) {
            const topTopicsData = data.topTopics.slice(0, 8).map((t: any) => [
                this.truncateText(t.categoryName, 40),
                `${t.percentage}%`,
                t.totalAssessments
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['Topic', 'Performance', 'Assessments']],
                body: topTopicsData,
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
                    0: { cellWidth: 134 },
                    1: { cellWidth: 28 },
                    2: { cellWidth: 28 }
                },
                alternateRowStyles: {
                    fillColor: [240, 253, 244]
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Check if we need a new page for Missed Topics
        if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = 20;
        }

        // Missed Topics Table
        if (data.leastTopics && data.leastTopics.length > 0) {

            const leastTopicsData = data.leastTopics.slice(0, 8).map((t: any) => [
                this.truncateText(t.categoryName, 40),
                `${t.percentage}%`,
                t.totalAssessments
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['Topic', 'Miss Rate', 'Assessments']],
                body: leastTopicsData,
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
                    0: { cellWidth: 134 },
                    1: { cellWidth: 28 },
                    2: { cellWidth: 28 }
                },
                alternateRowStyles: {
                    fillColor: [254, 242, 242]
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // Performance Trend with Visual Graph
        if (data.performanceTrendData?.trends && data.performanceTrendData.trends.length > 0) {
            if (yPosition > pageHeight - 60) {
                doc.addPage();
                yPosition = 20;
            }

            this.addSectionTitle(doc, 'Performance Trend Over Time', yPosition, 10, 'center');
            yPosition += 8;

            // Add visual trend graph
            const graphHeight = 60;
            this.drawPerformanceTrendGraph(doc, data.performanceTrendData.trends, yPosition, pageWidth, graphHeight);
            yPosition += graphHeight + 10;

            // Check if we need a new page after graph
            if (yPosition > pageHeight - 80) {
                doc.addPage();
                yPosition = 20;
            }

            const trendData = data.performanceTrendData.trends.slice(0, 12).map((m: any) => [
                m.period,
                `${m.averagePercentage}%`,
                m.totalSubmissions,
                `${m.passingRate}%`
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['Period', 'Average Score', 'Submissions', 'Passing Rate']],
                body: trendData,
                theme: 'plain',
                headStyles: {
                    fillColor: [this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]],
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
                    0: { cellWidth: 70 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 40 },
                    3: { cellWidth: 40 }
                },
                alternateRowStyles: {
                    fillColor: [this.bgLight[0], this.bgLight[1], this.bgLight[2]]
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 12;
        }

        // Performance Summary & Insights Section
        if (data.performanceTrendData?.summary && data.performanceTrendData?.insights) {
            if (yPosition > pageHeight - 90) {
                doc.addPage();
                yPosition = 20;
            }

            // Draw Performance Summary & Key Insights Card
            this.addPerformanceSummaryCard(doc, data.performanceTrendData.summary, data.performanceTrendData.insights, yPosition, pageWidth);
            yPosition += 75;
        }

        // Trend Analysis Card
        if (data.performanceTrendData?.trendAnalysis) {
            if (yPosition > pageHeight - 35) {
                doc.addPage();
                yPosition = 20;
            }

            const improvement = data.performanceTrendData.trendAnalysis.improvement;
            const bgColor: [number, number, number] = improvement > 0 ? [220, 252, 231] : improvement < 0 ? [254, 242, 242] : [243, 244, 246];

            doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.roundedRect(10, yPosition, pageWidth - 20, 22, 3, 3, 'F');

            doc.setDrawColor(improvement > 0 ? 34 : improvement < 0 ? 239 : 156, improvement > 0 ? 197 : improvement < 0 ? 68 : 163, improvement > 0 ? 94 : improvement < 0 ? 68 : 175);
            doc.setLineWidth(0.5);
            doc.roundedRect(10, yPosition, pageWidth - 20, 22, 3, 3, 'S');

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
            doc.text('Trend Analysis', 14, yPosition + 7);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            const detailLines = doc.splitTextToSize(data.performanceTrendData.trendAnalysis.details, pageWidth - 70);
            doc.text(detailLines, 14, yPosition + 13);

            // Improvement indicator
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            const improvementColor: [number, number, number] = improvement > 0 ? this.successColor : improvement < 0 ? this.dangerColor : this.textLight;
            doc.setTextColor(improvementColor[0], improvementColor[1], improvementColor[2]);
            const improvementValue = Math.abs(Number(improvement)).toFixed(1);
            const improvementText = improvement > 0 ? `+${improvementValue}%` : improvement < 0 ? `-${improvementValue}%` : `${improvementValue}%`;
            doc.text(improvementText, pageWidth - 18, yPosition + 14, { align: 'right' });

            yPosition += 28;
        }

        // Summary Statistics
        if (data.performanceTrendData?.summary) {
            // Check if we need a new page for Summary Statistics
            if (yPosition > pageHeight - 80) {
                doc.addPage();
                yPosition = 20;
            }

            this.addSectionTitle(doc, 'Detailed Summary Statistics', yPosition);
            yPosition += 8;

            const summary = data.performanceTrendData.summary;
            const summaryData = [
                ['Overall Average Score', `${summary.overallAveragePercentage}%`, `Across ${summary.activeMonths} active months`],
                ['Total Submissions', summary.totalSubmissions.toLocaleString(), `Over ${summary.totalMonthsInRange} months period`],
                ['Average Passing Rate', `${summary.averagePassingRate}%`, 'Students meeting passing criteria'],
                ['High Performers Rate', `${summary.averageHighPerformerRate}%`, 'Top performing students (90%+)'],
                ['Students Needing Support', `${summary.averageLowPerformerRate}%`, 'Requiring additional attention'],
                ['Performance Consistency', `${summary.overallConsistency}%`, 'Score stability indicator']
            ];

            autoTable(doc, {
                startY: yPosition,
                head: [['Metric', 'Value', 'Description']],
                body: summaryData,
                theme: 'plain',
                headStyles: {
                    fillColor: [this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                    cellPadding: 3
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 3
                },
                alternateRowStyles: {
                    fillColor: [this.bgLight[0], this.bgLight[1], this.bgLight[2]]
                },
                columnStyles: {
                    0: { cellWidth: 65 },
                    1: { cellWidth: 34, fontStyle: 'bold', textColor: [this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]] },
                    2: { cellWidth: 91 }
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // Topic Distribution Details
        if (data.topicDistribution) {
            if (yPosition > pageHeight - 50) {
                doc.addPage();
                yPosition = 20;
            }

            this.addSectionTitle(doc, 'Topic Distribution Summary', yPosition);
            yPosition += 6;

            // Display as vertical list with cards
            const finalY = this.addTopicDistributionList(doc, data.topicDistribution, yPosition, pageWidth, pageHeight);
            yPosition = finalY + 10;
        }

        // Footer
        this.addFooter(doc);

        // Save PDF
        const fileName = `PRISM_Platform_Overview_${data.selectedPreset}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    // MODERN HEADER - Creates branded header with PRISM logo, title, and date
    private async addModernHeader(doc: jsPDF, title: string, subtitle: string) {
        const pageWidth = doc.internal.pageSize.getWidth();

        // Gradient background simulation - darker indigo
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, pageWidth, 38, 'F');

        // Lighter indigo overlay for gradient effect
        doc.setFillColor(67, 56, 202);
        doc.rect(0, 0, pageWidth, 20, 'F');

        // Add logo with rounded background to mask original shape
        try {
            const logoPath = '/prism_logo.webp';
            const logoData = await this.loadImage(logoPath);

            const logoX = 14, logoY = 8, logoSize = 22, radius = 3;

            // Draw white rounded rectangle background FIRST to mask logo edges
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(logoX, logoY, logoSize, logoSize, radius, radius, 'F');

            // Clip the image to rounded rectangle shape
            doc.saveGraphicsState();

            // Add clipping path (simulate with drawing operations)
            const clipMargin = 0.5;
            doc.addImage(logoData, 'PNG', logoX + clipMargin, logoY + clipMargin, logoSize - (clipMargin * 2), logoSize - (clipMargin * 2));

            doc.restoreGraphicsState();

            // Add stylish white border on top
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(2);
            doc.roundedRect(logoX, logoY, logoSize, logoSize, radius, radius, 'S');

        } catch (error) {
            console.warn('Logo not loaded, continuing without it', error);
        }

        // PRISM Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('PRISM', 40, 18);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Elevate your Assessment Needs with PRISM', 40, 24);

        // Report Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const titleWidth = doc.getTextWidth(title);
        doc.text(title, pageWidth - titleWidth - 14, 16);

        // Subtitle
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const subtitleWidth = doc.getTextWidth(subtitle);
        doc.text(subtitle, pageWidth - subtitleWidth - 14, 23);

        // Date
        doc.setFontSize(8);
        const dateText = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, pageWidth - dateWidth - 14, 30);

        // ⚙️ HEADER BORDER CUSTOMIZATION POINT ⚙️
        // Decorative line at bottom of header
        // TO ADJUST: Change the Y position (currently 36) to move the line up or down
        // TO ADJUST: Change setLineWidth value (currently 0.5) for thicker/thinner line
        // TO ADJUST: Change setDrawColor to modify line color (currently white: 255, 255, 255)
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.line(14, 36, pageWidth - 14, 36);
    }

    // SECTION TITLE - Adds bold title with colored underline
    // ⚙️ To adjust underline distance: Change "+ 1" in line() call (line 828)
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

    // SUBSECTION TITLE - Adds smaller colored title without underline
    private addSubsectionTitle(doc: jsPDF, title: string, yPosition: number, xPosition: number = 10, color: [number, number, number] = this.primaryColor) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(title, xPosition, yPosition);
    }

    // METRIC CARDS - Creates 3 summary cards with labels and values
    private addMetricCards(doc: jsPDF, metrics: Array<{ label: string, value: any, icon: string, color: [number, number, number] }>, yPosition: number) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const cardWidth = (pageWidth - 40) / 3; // Width calculation: (total width - margins) / 3 cards
        const cardHeight = 22; // Card height in mm
        let xPosition = 10; // Starting position from left

        metrics.forEach((metric, index) => {
            // Card background - light gray
            doc.setFillColor(this.bgLight[0], this.bgLight[1], this.bgLight[2]);
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 2, 2, 'F');

            // Card border - colored based on metric type
            doc.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 2, 2, 'S');

            // Icon background (only if icon exists - currently unused)
            if (metric.icon) {
                doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
                doc.circle(xPosition + 8, yPosition + 12, 6, 'F');

                // Icon
                doc.setFontSize(14);
                doc.text(metric.icon, xPosition + 6, yPosition + 14);
            }

            // Label - uppercase, centered, light gray color
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            doc.text(metric.label.toUpperCase(), xPosition + cardWidth / 2, yPosition + 7, { align: 'center' });

            // Value - large, bold, centered, colored
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
            doc.text(String(metric.value), xPosition + cardWidth / 2, yPosition + 16, { align: 'center' });

            xPosition += cardWidth + 10; // Move to next card position
        });
    }

    // TOPIC DISTRIBUTION LIST - Shows topics in vertical sections with modern card design
    private addTopicDistributionList(doc: jsPDF, topicDistribution: any, yPosition: number, pageWidth: number, pageHeight: number): number {
        let currentY = yPosition;
        const cardMargin = 10;
        const cardWidth = pageWidth - (cardMargin * 2);

        // Top Topics Section - Modern Card Design
        if (topicDistribution.top && topicDistribution.top.length > 0) {
            if (currentY > pageHeight - 30) {
                doc.addPage();
                currentY = 20;
            }

            const boxHeight = Math.min(topicDistribution.top.length, 5) * 5.5 + 12;

            // Modern card with white background and colored accent
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(cardMargin, currentY, cardWidth, boxHeight, 3, 3, 'F');

            // Colored left accent bar
            doc.setFillColor(this.successColor[0], this.successColor[1], this.successColor[2]);
            doc.roundedRect(cardMargin, currentY, 4, boxHeight, 3, 3, 'F');

            // Subtle border
            doc.setDrawColor(this.successColor[0], this.successColor[1], this.successColor[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(cardMargin, currentY, cardWidth, boxHeight, 3, 3, 'S');

            // Header with count badge
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
            doc.text('Top Performing Topics', cardMargin + 7, currentY + 6);

            // Count badge
            doc.setFillColor(this.successColor[0], this.successColor[1], this.successColor[2]);
            doc.roundedRect(cardMargin + cardWidth - 22, currentY + 2, 18, 6, 2, 2, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(String(topicDistribution.top.length), cardMargin + cardWidth - 13, currentY + 6, { align: 'center' });

            // Separator line
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.3);
            doc.line(cardMargin + 7, currentY + 9, cardMargin + cardWidth - 7, currentY + 9);

            // Topics list with alternating backgrounds
            let itemY = currentY + 13;
            topicDistribution.top.slice(0, 5).forEach((topic: any, idx: number) => {
                // Alternating background for better readability
                if (idx % 2 === 0) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(cardMargin + 6, itemY - 2.5, cardWidth - 12, 5, 'F');
                }

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
                doc.text(`${idx + 1}. ${this.truncateText(topic.title, 70)}`, cardMargin + 8, itemY);
                itemY += 5.5;
            });

            if (topicDistribution.top.length > 5) {
                doc.setFontSize(7);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
                doc.text(`+${topicDistribution.top.length - 5} more topics...`, cardMargin + 8, itemY);
            }

            currentY += boxHeight + 5;
        }

        // Average Topics Section - Modern Card Design
        if (topicDistribution.average && topicDistribution.average.length > 0) {
            if (currentY > pageHeight - 30) {
                doc.addPage();
                currentY = 20;
            }

            const boxHeight = Math.min(topicDistribution.average.length, 5) * 5.5 + 12;

            // Modern card with white background
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(cardMargin, currentY, cardWidth, boxHeight, 3, 3, 'F');

            // Colored left accent bar
            doc.setFillColor(this.warningColor[0], this.warningColor[1], this.warningColor[2]);
            doc.roundedRect(cardMargin, currentY, 4, boxHeight, 3, 3, 'F');

            // Subtle border
            doc.setDrawColor(this.warningColor[0], this.warningColor[1], this.warningColor[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(cardMargin, currentY, cardWidth, boxHeight, 3, 3, 'S');

            // Header
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
            doc.text('Average Performance Topics', cardMargin + 7, currentY + 6);

            // Count badge
            doc.setFillColor(this.warningColor[0], this.warningColor[1], this.warningColor[2]);
            doc.roundedRect(cardMargin + cardWidth - 22, currentY + 2, 18, 6, 2, 2, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(String(topicDistribution.average.length), cardMargin + cardWidth - 13, currentY + 6, { align: 'center' });

            // Separator line
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.3);
            doc.line(cardMargin + 7, currentY + 9, cardMargin + cardWidth - 7, currentY + 9);

            // Topics list
            let itemY = currentY + 13;
            topicDistribution.average.slice(0, 5).forEach((topic: any, idx: number) => {
                if (idx % 2 === 0) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(cardMargin + 6, itemY - 2.5, cardWidth - 12, 5, 'F');
                }

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
                doc.text(`${idx + 1}. ${this.truncateText(topic.title, 70)}`, cardMargin + 8, itemY);
                itemY += 5.5;
            });

            if (topicDistribution.average.length > 5) {
                doc.setFontSize(7);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
                doc.text(`+${topicDistribution.average.length - 5} more topics...`, cardMargin + 8, itemY);
            }

            currentY += boxHeight + 5;
        }

        // Needs Attention Section - Modern Card Design with Priority Indicator
        if (topicDistribution.needs_attention && topicDistribution.needs_attention.length > 0) {
            if (currentY > pageHeight - 30) {
                doc.addPage();
                currentY = 20;
            }

            const boxHeight = Math.min(topicDistribution.needs_attention.length, 5) * 5.5 + 12;

            // Modern card with white background
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(cardMargin, currentY, cardWidth, boxHeight, 3, 3, 'F');

            // Colored left accent bar (thicker for attention)
            doc.setFillColor(this.dangerColor[0], this.dangerColor[1], this.dangerColor[2]);
            doc.roundedRect(cardMargin, currentY, 4, boxHeight, 3, 3, 'F');

            // Subtle border
            doc.setDrawColor(this.dangerColor[0], this.dangerColor[1], this.dangerColor[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(cardMargin, currentY, cardWidth, boxHeight, 3, 3, 'S');

            // Header with warning indicator
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(this.dangerColor[0], this.dangerColor[1], this.dangerColor[2]);
            doc.text('Topics Requiring Attention', cardMargin + 7, currentY + 6);

            // Count badge with priority styling
            doc.setFillColor(this.dangerColor[0], this.dangerColor[1], this.dangerColor[2]);
            doc.roundedRect(cardMargin + cardWidth - 22, currentY + 2, 18, 6, 2, 2, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(String(topicDistribution.needs_attention.length), cardMargin + cardWidth - 13, currentY + 6, { align: 'center' });

            // Separator line
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.3);
            doc.line(cardMargin + 7, currentY + 9, cardMargin + cardWidth - 7, currentY + 9);

            // Topics list with priority indicators
            let itemY = currentY + 13;
            topicDistribution.needs_attention.slice(0, 5).forEach((topic: any, idx: number) => {
                if (idx % 2 === 0) {
                    doc.setFillColor(254, 242, 242);
                    doc.rect(cardMargin + 6, itemY - 2.5, cardWidth - 12, 5, 'F');
                }

                // Priority indicator dot
                doc.setFillColor(this.dangerColor[0], this.dangerColor[1], this.dangerColor[2]);
                doc.circle(cardMargin + 9, itemY - 1, 0.8, 'F');

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
                doc.text(`${idx + 1}. ${this.truncateText(topic.title, 68)}`, cardMargin + 11, itemY);
                itemY += 5.5;
            });

            if (topicDistribution.needs_attention.length > 5) {
                doc.setFontSize(7);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
                doc.text(`+${topicDistribution.needs_attention.length - 5} more topics requiring immediate attention...`, cardMargin + 8, itemY);
            }

            currentY += boxHeight;
        }

        return currentY;
    }

    // FOOTER - Adds consistent footer with page numbers to all pages
    private addFooter(doc: jsPDF) {
        const totalPages = doc.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);

            // Footer line
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.3);
            doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);

            // Footer text
            doc.setFontSize(8);
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            doc.setFont('helvetica', 'normal');
            doc.text('© PRISM Analytics Platform - Confidential Report', 10, pageHeight - 7);

            doc.setFont('helvetica', 'bold');
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - 10, pageHeight - 7, { align: 'right' });
        }
    }

    // PERFORMANCE TREND GRAPH - Draws multi-line chart with Average Score, Passing Rate, and Consistency
    private drawPerformanceTrendGraph(doc: jsPDF, trends: any[], yPosition: number, pageWidth: number, graphHeight: number) {
        const margin = 10;
        const graphWidth = pageWidth - (margin * 2);
        const graphX = margin;
        const graphY = yPosition;
        const plotHeight = graphHeight - 20; // Reserve space for labels

        // Filter out months with no submissions
        const validTrends = trends.filter(t => t.totalSubmissions > 0);
        if (validTrends.length === 0) return;

        // Draw graph background
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(graphX, graphY, graphWidth, graphHeight, 2, 2, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.roundedRect(graphX, graphY, graphWidth, graphHeight, 2, 2, 'S');

        // Calculate scales
        const maxValue = 100; // Percentage max
        const minValue = 0;
        const dataPoints = validTrends.length;
        const xStep = (graphWidth - 20) / Math.max(dataPoints - 1, 1);
        const yScale = plotHeight / (maxValue - minValue);

        // Draw grid lines
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.1);
        for (let i = 0; i <= 4; i++) {
            const y = graphY + 5 + (plotHeight * i / 4);
            doc.line(graphX + 10, y, graphX + graphWidth - 10, y);

            // Y-axis labels
            doc.setFontSize(7);
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            doc.text(`${100 - (i * 25)}%`, graphX + 3, y + 1);
        }

        // Helper function to draw a line
        const drawLine = (data: number[], color: [number, number, number], lineWidth: number = 1.5) => {
            doc.setDrawColor(color[0], color[1], color[2]);
            doc.setLineWidth(lineWidth);

            for (let i = 0; i < data.length - 1; i++) {
                const x1 = graphX + 10 + (i * xStep);
                const y1 = graphY + 5 + plotHeight - (data[i] * yScale);
                const x2 = graphX + 10 + ((i + 1) * xStep);
                const y2 = graphY + 5 + plotHeight - (data[i + 1] * yScale);

                doc.line(x1, y1, x2, y2);

                // Draw points
                doc.setFillColor(color[0], color[1], color[2]);
                doc.circle(x1, y1, 1.5, 'F');
                if (i === data.length - 2) {
                    doc.circle(x2, y2, 1.5, 'F');
                }
            }
        };

        // Extract data series
        const avgScores = validTrends.map(t => t.averagePercentage);
        const passingRates = validTrends.map(t => t.passingRate);
        const consistency = validTrends.map(t => t.consistency);

        // Draw lines
        drawLine(consistency, [156, 163, 175], 1.2); // Gray for consistency
        drawLine(passingRates, this.successColor, 1.5); // Green for passing rate
        drawLine(avgScores, this.primaryColor, 2); // Bold primary for avg score

        // X-axis labels (months)
        doc.setFontSize(7);
        doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
        validTrends.forEach((trend, i) => {
            const x = graphX + 10 + (i * xStep);
            const monthLabel = trend.period.split(' ')[0].substring(0, 3); // First 3 letters of month
            doc.text(monthLabel, x, graphY + graphHeight - 8, { align: 'center' });
        });

        // Legend
        const legendY = graphY + graphHeight - 3;
        const legendStartX = graphX + graphWidth / 2 - 45;

        // Avg Score legend
        doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setLineWidth(2);
        doc.line(legendStartX, legendY, legendStartX + 8, legendY);
        doc.setFontSize(7);
        doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
        doc.text('Avg Score', legendStartX + 10, legendY + 1);

        // Passing Rate legend
        doc.setDrawColor(this.successColor[0], this.successColor[1], this.successColor[2]);
        doc.setLineWidth(1.5);
        doc.line(legendStartX + 35, legendY, legendStartX + 43, legendY);
        doc.text('Passing', legendStartX + 45, legendY + 1);

        // Consistency legend
        doc.setDrawColor(156, 163, 175);
        doc.setLineWidth(1.2);
        doc.line(legendStartX + 68, legendY, legendStartX + 76, legendY);
        doc.text('Consistency', legendStartX + 78, legendY + 1);
    }

    // PERFORMANCE SUMMARY CARD - Creates dashboard-style card with metrics grid and key insights
    private addPerformanceSummaryCard(doc: jsPDF, summary: any, insights: any, yPosition: number, pageWidth: number) {
        const cardX = 10;
        const cardWidth = pageWidth - 20;
        const cardHeight = 70;

        // Main card background with gradient effect
        doc.setFillColor(247, 250, 252);
        doc.roundedRect(cardX, yPosition, cardWidth, cardHeight, 3, 3, 'F');
        doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(cardX, yPosition, cardWidth, cardHeight, 3, 3, 'S');

        // Header bar
        doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.roundedRect(cardX + 2, yPosition + 2, cardWidth - 4, 8, 2, 2, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Performance Summary & Key Insights', cardX + 5, yPosition + 7.5);

        let contentY = yPosition + 14;

        // Summary Metrics Grid (2 rows x 4 columns)
        const metricsData = [
            { label: 'OVERALL AVERAGE', value: `${summary.overallAveragePercentage}%`, icon: '', color: this.primaryColor },
            { label: 'TOTAL SUBMISSIONS', value: summary.totalSubmissions.toLocaleString(), icon: '', color: this.successColor },
            { label: 'PASSING RATE', value: `${summary.averagePassingRate}%`, icon: '', color: this.warningColor },
            { label: 'CONSISTENCY', value: `${summary.overallConsistency}%`, icon: '', color: [59, 130, 246] },
            { label: 'HIGH PERFORMERS', value: `${summary.averageHighPerformerRate}%`, icon: '', color: this.successColor },
            { label: 'NEED SUPPORT', value: `${summary.averageLowPerformerRate}%`, icon: '', color: this.dangerColor },
            { label: 'ACTIVE MONTHS', value: `${summary.activeMonths}/${summary.totalMonthsInRange}`, icon: '', color: [107, 114, 128] },
            { label: '', value: '', icon: '', color: [0, 0, 0] } // Empty space
        ];

        // Draw metrics in grid
        const metricBoxWidth = (cardWidth - 12) / 4;
        const metricBoxHeight = 12;

        for (let i = 0; i < 8; i++) {
            if (!metricsData[i].label) continue;

            const row = Math.floor(i / 4);
            const col = i % 4;
            const boxX = cardX + 4 + (col * metricBoxWidth);
            const boxY = contentY + (row * (metricBoxHeight + 2));

            // Metric box background
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(boxX, boxY, metricBoxWidth - 2, metricBoxHeight, 2, 2, 'F');
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.2);
            doc.roundedRect(boxX, boxY, metricBoxWidth - 2, metricBoxHeight, 2, 2, 'S');

            // Label
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
            doc.text(metricsData[i].label, boxX + 2, boxY + 4);

            // Value
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(metricsData[i].color[0], metricsData[i].color[1], metricsData[i].color[2]);
            doc.text(String(metricsData[i].value), boxX + 2, boxY + 9);
        }

        contentY += 30;

        // Key Insights Section
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

        const insight1 = `• Most Productive: ${insights.mostProductiveMonth}`;
        const insight2 = `• Best Performance: ${insights.bestPerformanceMonth}`;
        const insight3 = `• Most Consistent: ${insights.mostConsistentMonth}`;

        doc.text(insight1, cardX + 7, contentY + 11);
        doc.text(insight2, cardX + 7, contentY + 15.5);
        doc.text(insight3, cardX + 7, contentY + 20);
    }

    // FORMAT PERCENTAGE - Adds "%" symbol to numeric values
    private formatPercentageCell(value: number): string {
        return `${value}%`;
    }

    // TRUNCATE TEXT - Cuts off long text and adds "..." for table cells
    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    // LOAD IMAGE - Loads image with white background and converts to base64 for PDF embedding
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
                    // Fill with white background to remove black
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

