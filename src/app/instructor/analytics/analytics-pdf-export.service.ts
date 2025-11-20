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

    /**
     * MAIN FUNCTION: Exports PDF report for an individual class
     * 
     * This function generates a comprehensive PDF report containing:
     * - Class overview metrics (students, performance, passing rate)
     * - Assessment performance timeline
     * - Top performing students
     * - Students needing attention
     * - Performance distribution by grade
     * - Topic analysis with recommendations
     * 
     * @param data Object containing all the analytics data for the class
     * 
     * To adjust spacing between sections: Look for "yPosition +=" statements
     * To adjust page margins: Change the "margin: { left: X, right: X }" values in autoTable calls
     */
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

        yPosition += 30;

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
                head: [['Assessment Title', 'Date', 'Avg Score', 'Participation', 'Passing Rate', 'Submissions']],
                body: assessmentData,
                theme: 'plain',
                headStyles: {
                    fillColor: [this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                    cellPadding: { top: 4, right: 3, bottom: 4, left: 3 }
                },
                styles: {
                    fontSize: 8,
                    cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
                    lineColor: [229, 231, 235],
                    lineWidth: 0.1
                },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 22, halign: 'center' },
                    3: { cellWidth: 28, halign: 'center' },
                    4: { cellWidth: 24, halign: 'center' },
                    5: { cellWidth: 24, halign: 'center' }
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
                    0: { cellWidth: 18, halign: 'center' },
                    1: { cellWidth: 95 },
                    2: { cellWidth: 25, halign: 'center' },
                    3: { cellWidth: 25, halign: 'center' },
                    4: { cellWidth: 25, halign: 'center' }
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
                    0: { cellWidth: 18, halign: 'center' },
                    1: { cellWidth: 95 },
                    2: { cellWidth: 25, halign: 'center' },
                    3: { cellWidth: 25, halign: 'center' },
                    4: { cellWidth: 25, halign: 'center' }
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
                    0: { cellWidth: 20, halign: 'center' },
                    1: { cellWidth: 28, halign: 'center' },
                    2: { cellWidth: 30, halign: 'center' },
                    3: { cellWidth: 30, halign: 'center' },
                    4: { cellWidth: 80, halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [this.bgLight[0], this.bgLight[1], this.bgLight[2]]
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // Topic Analysis
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
            yPosition += 10;

            // Top Performing Topics
            if (data.topicDistribution.top && data.topicDistribution.top.length > 0) {
                this.addSubsectionTitle(doc, 'Top Performing Topics', yPosition, 14, this.successColor);
                yPosition += 8;

                data.topicDistribution.top.forEach((topic: any, index: number) => {
                    if (yPosition > pageHeight - 40) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    this.addTopicCard(doc, topic, yPosition, pageWidth, 'success');
                    yPosition += 32;
                });

                yPosition += 5;
            }

            // Topics Needing Attention
            if (data.topicDistribution.needs_attention && data.topicDistribution.needs_attention.length > 0) {
                if (yPosition > pageHeight - 50) {
                    doc.addPage();
                    yPosition = 20;
                }

                this.addSubsectionTitle(doc, 'Topics Needing Attention', yPosition, 14, this.dangerColor);
                yPosition += 8;

                data.topicDistribution.needs_attention.forEach((topic: any, index: number) => {
                    if (yPosition > pageHeight - 50) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    this.addTopicCard(doc, topic, yPosition, pageWidth, 'danger');
                    yPosition += 42;
                });
            }
        }

        // Footer on all pages
        this.addFooter(doc);

        // Save PDF
        const fileName = `PRISM_Individual_Class_${data.selectedClassCode}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    /**
     * MAIN FUNCTION: Exports PDF report for platform-wide overview
     * 
     * This function generates a comprehensive PDF report containing:
     * - Platform performance summary metrics
     * - Class performance comparison across all classes
     * - Topic performance analysis (top and commonly missed)
     * - Performance trends over time
     * - Detailed summary statistics
     * - Topic distribution details
     * 
     * @param data Object containing all platform-wide analytics data
     * 
     * To adjust spacing between sections: Look for "yPosition +=" statements
     * To adjust page margins: Change the "margin: { left: X, right: X }" values in autoTable calls
     */
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
        this.addSectionTitle(doc, 'Platform Performance Summary', yPosition);
        yPosition += 6;

        this.addMetricCards(doc, [
            { label: 'Total Assessments', value: data.platformOverviewData.totalAssessments || 0, icon: '', color: this.primaryColor },
            { label: 'Average Score', value: `${data.platformOverviewData.averageScore || 0}%`, icon: '', color: this.successColor },
            { label: 'Total Classes', value: data.platformOverviewData.totalClasses || 0, icon: '', color: this.warningColor }
        ], yPosition);

        yPosition += 30;

        // Class Performance Comparison
        if (data.overallClassPerformanceData && data.overallClassPerformanceData.length > 0) {
            this.addSectionTitle(doc, 'Class Performance Comparison', yPosition);
            yPosition += 8;

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
                head: [['Class Name', 'Avg Score', 'Participation', 'Pass Rate', 'Students', 'Assessments', 'Performance']],
                body: classData,
                theme: 'plain',
                headStyles: {
                    fillColor: [this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                    cellPadding: 3
                },
                styles: {
                    fontSize: 7.5,
                    cellPadding: 2.5
                },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 23 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 21 },
                    4: { cellWidth: 21 },
                    5: { cellWidth: 25 },
                    6: { cellWidth: 23 }
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

        this.addSectionTitle(doc, 'Topic Performance Analysis', yPosition);
        yPosition += 8;

        // Top Topics (Full Width)
        if (data.topTopics && data.topTopics.length > 0) {
            this.addSubsectionTitle(doc, 'Top Performing Topics', yPosition, 14, this.successColor);
            yPosition += 6;

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
                    0: { cellWidth: 128 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 30 }
                },
                alternateRowStyles: {
                    fillColor: [240, 253, 244]
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // Check if we need a new page for Missed Topics
        if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = 20;
        }

        // Missed Topics (Full Width)
        if (data.leastTopics && data.leastTopics.length > 0) {
            this.addSubsectionTitle(doc, 'Commonly Missed Topics', yPosition, 14, this.dangerColor);
            yPosition += 6;

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
                    0: { cellWidth: 128 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 30 }
                },
                alternateRowStyles: {
                    fillColor: [254, 242, 242]
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // Performance Trend
        if (data.performanceTrendData?.trends && data.performanceTrendData.trends.length > 0) {
            if (yPosition > pageHeight - 60) {
                doc.addPage();
                yPosition = 20;
            }

            this.addSectionTitle(doc, 'Performance Trend Over Time', yPosition);
            yPosition += 8;

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
                    0: { cellWidth: 62 },
                    1: { cellWidth: 42 },
                    2: { cellWidth: 42 },
                    3: { cellWidth: 42 }
                },
                alternateRowStyles: {
                    fillColor: [this.bgLight[0], this.bgLight[1], this.bgLight[2]]
                },
                margin: { left: 10, right: 10 }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 12;
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
            const improvementText = improvement > 0 ? `↑ ${Math.abs(improvement)}%` : improvement < 0 ? `↓ ${Math.abs(improvement)}%` : `→ ${Math.abs(improvement)}%`;
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
                    0: { cellWidth: 62 },
                    1: { cellWidth: 35, fontStyle: 'bold', textColor: [this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]] },
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

            this.addSectionTitle(doc, 'Topic Distribution Details', yPosition);
            yPosition += 10;

            // Display as horizontal cards
            this.addTopicDistributionCards(doc, data.topicDistribution, yPosition, pageWidth, pageHeight);
        }

        // Footer
        this.addFooter(doc);

        // Save PDF
        const fileName = `PRISM_Platform_Overview_${data.selectedPreset}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    /**
     * HELPER FUNCTION: Adds a modern branded header to the PDF
     * 
     * Creates a two-tone gradient header with:
     * - PRISM logo with rounded white background
     * - Platform title and subtitle
     * - Report title (right-aligned)
     * - Current date
     * - Decorative underline
     * 
     * To adjust header height: Change the rectangle heights (currently 38mm and 20mm)
     * To adjust logo size: Change the addImage parameters (currently 22x22mm at position 14,8)
     * To adjust logo border radius: Change the roundedRect radius parameter (currently 3)
     * To change background colors: Modify the setFillColor RGB values
     */
    private async addModernHeader(doc: jsPDF, title: string, subtitle: string) {
        const pageWidth = doc.internal.pageSize.getWidth();

        // Gradient background simulation - darker indigo
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, pageWidth, 38, 'F');

        // Lighter indigo overlay for gradient effect
        doc.setFillColor(67, 56, 202);
        doc.rect(0, 0, pageWidth, 20, 'F');

        // Add logo with rounded background
        try {
            const logoPath = '/prism_logo.webp';
            const logoData = await this.loadImage(logoPath);

            // White rounded rectangle background for logo (border radius = 3)
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(14, 8, 22, 22, 3, 3, 'F');

            // Add logo image on top of rounded background
            doc.addImage(logoData, 'PNG', 14, 8, 22, 22);
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
        doc.text('Analytics Platform', 40, 24);

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

        // Decorative line
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.line(14, 36, pageWidth - 14, 36);
    }

    /**
     * HELPER FUNCTION: Adds a main section title with underline
     * 
     * Creates a bold, large title with a colored underline for major sections
     * 
     * @param doc The jsPDF document instance
     * @param title The text to display as the section title
     * @param yPosition Vertical position in mm from the top of the page
     * @param xPosition Horizontal position in mm from the left (default: 10mm)
     * 
     * To adjust font size: Change setFontSize value (currently 13)
     * To adjust underline thickness: Change setLineWidth value (currently 0.8)
     * To adjust underline color: Modify the setDrawColor RGB values (uses primaryColor)
     * To adjust title position: Change xPosition parameter
     */
    private addSectionTitle(doc: jsPDF, title: string, yPosition: number, xPosition: number = 10) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
        doc.text(title, xPosition, yPosition);

        // Underline with primary color
        const textWidth = doc.getTextWidth(title);
        doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setLineWidth(0.8);
        doc.line(xPosition, yPosition + 1, xPosition + textWidth, yPosition + 1);
    }

    /**
     * HELPER FUNCTION: Adds a subsection title without underline
     * 
     * Creates a smaller, colored title for subsections within a major section
     * 
     * @param doc The jsPDF document instance
     * @param title The text to display as the subsection title
     * @param yPosition Vertical position in mm from the top of the page
     * @param xPosition Horizontal position in mm from the left (default: 10mm)
     * @param color RGB color array for the title text (default: primaryColor)
     * 
     * To adjust font size: Change setFontSize value (currently 11)
     * To change text color: Pass a different color parameter
     */
    private addSubsectionTitle(doc: jsPDF, title: string, yPosition: number, xPosition: number = 10, color: [number, number, number] = this.primaryColor) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(title, xPosition, yPosition);
    }

    /**
     * HELPER FUNCTION: Adds a row of metric cards for overview statistics
     * 
     * Creates 3 evenly-spaced cards displaying key metrics with:
     * - Light gray background with colored border
     * - Uppercase label text
     * - Large, bold, colored value
     * - Optional icon (currently not used)
     * 
     * @param doc The jsPDF document instance
     * @param metrics Array of metric objects with label, value, icon, and color
     * @param yPosition Vertical position in mm from the top of the page
     * 
     * To adjust card width: Change the calculation (pageWidth - 40) / 3
     * To adjust card height: Change cardHeight value (currently 22mm)
     * To adjust spacing between cards: Change the "+ 10" value at the end
     * To adjust card border radius: Change roundedRect radius (currently 2)
     * To adjust label font size: Change the first setFontSize (currently 8)
     * To adjust value font size: Change the second setFontSize (currently 16)
     * To adjust overall card positioning: Change xPosition initial value (currently 10mm)
     */
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

    /**
     * HELPER FUNCTION: Adds a topic analysis card with recommendations
     * 
     * Creates a full-width card for individual topic analysis displaying:
     * - Topic title (can wrap to multiple lines)
     * - Status reason/explanation
     * - Health score badge (colored, rounded)
     * - Recommended actions (only for "danger" type topics)
     * 
     * @param doc The jsPDF document instance
     * @param topic Object containing topic data (title, status_reason, health_score, recommended_actions)
     * @param yPosition Vertical position in mm from the top of the page
     * @param pageWidth Width of the page for full-width card calculation
     * @param type 'success' for top performers (green), 'danger' for needs attention (red)
     * 
     * To adjust card height: Change cardHeight value (28mm for success, 38mm for danger)
     * To adjust card margins: Change the "pageWidth - 20" calculation (currently 10mm margins)
     * To adjust title font size: Change the first setFontSize (currently 10)
     * To adjust health score badge size: Change the roundedRect dimensions (currently 24x8mm)
     */
    private addTopicCard(doc: jsPDF, topic: any, yPosition: number, pageWidth: number, type: 'success' | 'danger') {
        const bgColor: [number, number, number] = type === 'success' ? [240, 253, 244] : [254, 242, 242];
        const borderColor: [number, number, number] = type === 'success' ? this.successColor : this.dangerColor;
        const cardHeight = type === 'danger' ? 38 : 28;

        // Card
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.roundedRect(10, yPosition, pageWidth - 20, cardHeight, 2, 2, 'F');

        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(10, yPosition, pageWidth - 20, cardHeight, 2, 2, 'S');

        // Title
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
        const titleLines = doc.splitTextToSize(topic.title, pageWidth - 40);
        doc.text(titleLines, 14, yPosition + 6);

        // Status
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
        const statusLines = doc.splitTextToSize(topic.status_reason || '', pageWidth - 40);
        doc.text(statusLines, 14, yPosition + 13);

        // Health Score Badge
        doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.roundedRect(pageWidth - 34, yPosition + 5, 24, 8, 1, 1, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${topic.health_score}`, pageWidth - 22, yPosition + 10, { align: 'center' });

        // Recommendation (for danger type)
        if (type === 'danger' && topic.recommended_actions) {
            doc.setFontSize(7);
            doc.setTextColor(59, 130, 246);
            doc.setFont('helvetica', 'italic');
            const actionLines = doc.splitTextToSize(`Recommendation: ${topic.recommended_actions}`, pageWidth - 40);
            doc.text(actionLines, 14, yPosition + 26);
        }
    }

    /**
     * HELPER FUNCTION: Adds a horizontal row of 3 topic distribution summary cards
     * 
     * Creates three side-by-side cards showing topic distribution overview:
     * 1. Top Titles (green) - High performing topics
     * 2. Average Titles (yellow) - Moderately performing topics
     * 3. Needs Attention (red) - Low performing topics
     * 
     * Each card displays:
     * - Colored header with title
     * - Topic count
     * - First 3 topics listed
     * - "+X more..." indicator if there are additional topics
     * 
     * @param doc The jsPDF document instance
     * @param topicDistribution Object with top, average, and needs_attention arrays
     * @param yPosition Vertical position in mm from the top of the page
     * @param pageWidth Width of the page for card width calculation
     * @param pageHeight Height of the page (currently unused)
     * 
     * To adjust card width: Change the calculation (pageWidth - 40) / 3
     * To adjust card height: Change cardHeight value (currently 45mm)
     * To adjust spacing between cards: Change the "+ 10" at xPosition increment
     * To adjust number of topics shown: Change the .slice(0, 3) parameter
     * To adjust card border radius: Change roundedRect radius (currently 3)
     */
    private addTopicDistributionCards(doc: jsPDF, topicDistribution: any, yPosition: number, pageWidth: number, pageHeight: number) {
        const cardWidth = (pageWidth - 40) / 3; // Width for 3 cards with margins
        const cardHeight = 45; // Card height in mm
        let xPosition = 10; // Starting position from left

        // Top Titles Card
        if (topicDistribution.top && topicDistribution.top.length > 0) {
            doc.setFillColor(240, 253, 244); // Light green background
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 3, 3, 'F');
            doc.setDrawColor(this.successColor[0], this.successColor[1], this.successColor[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 3, 3, 'S');

            // Card header
            doc.setFillColor(this.successColor[0], this.successColor[1], this.successColor[2]);
            doc.roundedRect(xPosition + 2, yPosition + 2, cardWidth - 4, 10, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('Top Titles', xPosition + cardWidth / 2, yPosition + 8, { align: 'center' });

            // Topics count
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
            doc.text(`${topicDistribution.top.length} topics`, xPosition + 5, yPosition + 18);

            // Topics list (first 3)
            let itemY = yPosition + 24;
            topicDistribution.top.slice(0, 3).forEach((topic: any) => {
                doc.setFontSize(7);
                doc.text(`• ${this.truncateText(topic.title, 25)}`, xPosition + 5, itemY);
                itemY += 5;
            });

            if (topicDistribution.top.length > 3) {
                doc.setFontSize(7);
                doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
                doc.text(`+${topicDistribution.top.length - 3} more...`, xPosition + 5, itemY);
            }

            xPosition += cardWidth + 10;
        }

        // Average Titles Card
        if (topicDistribution.average && topicDistribution.average.length > 0) {
            doc.setFillColor(254, 252, 232); // Light yellow background
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 3, 3, 'F');
            doc.setDrawColor(this.warningColor[0], this.warningColor[1], this.warningColor[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 3, 3, 'S');

            // Card header
            doc.setFillColor(this.warningColor[0], this.warningColor[1], this.warningColor[2]);
            doc.roundedRect(xPosition + 2, yPosition + 2, cardWidth - 4, 10, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('Average Titles', xPosition + cardWidth / 2, yPosition + 8, { align: 'center' });

            // Topics count
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
            doc.text(`${topicDistribution.average.length} topics`, xPosition + 5, yPosition + 18);

            // Topics list (first 3)
            let itemY = yPosition + 24;
            topicDistribution.average.slice(0, 3).forEach((topic: any) => {
                doc.setFontSize(7);
                doc.text(`• ${this.truncateText(topic.title, 25)}`, xPosition + 5, itemY);
                itemY += 5;
            });

            if (topicDistribution.average.length > 3) {
                doc.setFontSize(7);
                doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
                doc.text(`+${topicDistribution.average.length - 3} more...`, xPosition + 5, itemY);
            }

            xPosition += cardWidth + 10;
        }

        // Needs Attention Card
        if (topicDistribution.needs_attention && topicDistribution.needs_attention.length > 0) {
            doc.setFillColor(254, 242, 242); // Light red background
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 3, 3, 'F');
            doc.setDrawColor(this.dangerColor[0], this.dangerColor[1], this.dangerColor[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 3, 3, 'S');

            // Card header
            doc.setFillColor(this.dangerColor[0], this.dangerColor[1], this.dangerColor[2]);
            doc.roundedRect(xPosition + 2, yPosition + 2, cardWidth - 4, 10, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('Needs Attention', xPosition + cardWidth / 2, yPosition + 8, { align: 'center' });

            // Topics count
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
            doc.text(`${topicDistribution.needs_attention.length} topics`, xPosition + 5, yPosition + 18);

            // Topics list (first 3)
            let itemY = yPosition + 24;
            topicDistribution.needs_attention.slice(0, 3).forEach((topic: any) => {
                doc.setFontSize(7);
                doc.text(`• ${this.truncateText(topic.title, 25)}`, xPosition + 5, itemY);
                itemY += 5;
            });

            if (topicDistribution.needs_attention.length > 3) {
                doc.setFontSize(7);
                doc.setTextColor(this.textLight[0], this.textLight[1], this.textLight[2]);
                doc.text(`+${topicDistribution.needs_attention.length - 3} more...`, xPosition + 5, itemY);
            }
        }
    }

    private addTopicColumn(doc: jsPDF, title: string, topics: any[], xPosition: number, yPosition: number, width: number, color: [number, number, number]) {
        // Column header
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(xPosition, yPosition, width, 8, 1, 1, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(title, xPosition + 4, yPosition + 5.5);

        // Topics list
        let itemY = yPosition + 12;
        const bgColor: [number, number, number] = color === this.successColor ? [240, 253, 244] : color === this.dangerColor ? [254, 242, 242] : [254, 252, 232];

        topics.slice(0, 10).forEach((topic: any, index: number) => {
            if (index % 2 === 0) {
                doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                doc.rect(xPosition, itemY - 3, width, 5, 'F');
            }

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(this.textDark[0], this.textDark[1], this.textDark[2]);
            const topicText = this.truncateText(topic.title, 35);
            doc.text(`• ${topicText}`, xPosition + 2, itemY);

            itemY += 5;
        });
    }

    /**
     * HELPER FUNCTION: Adds footer to all pages of the PDF
     * 
     * Adds a consistent footer to every page containing:
     * - Horizontal line separator
     * - Copyright text on the left
     * - Page numbers on the right
     * 
     * This function loops through all pages and stamps the footer on each one
     * 
     * To adjust footer position: Change the "pageHeight - X" values
     * To adjust line position: Change the line() Y coordinate (currently pageHeight - 12)
     * To adjust text position: Change the text() Y coordinate (currently pageHeight - 7)
     * To change footer text: Modify the copyright text string
     */
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

    /**
     * UTILITY FUNCTION: Formats a number as a percentage string
     * 
     * Simple helper that adds a "%" symbol to numeric values
     * 
     * @param value The numeric value to format
     * @returns String with percentage symbol (e.g., "85%")
     */
    private formatPercentageCell(value: number): string {
        return `${value}%`;
    }

    /**
     * UTILITY FUNCTION: Truncates long text strings for table cells
     * 
     * Prevents text overflow in table cells by cutting off long strings
     * and adding ellipsis (...) to indicate truncation
     * 
     * @param text The text string to truncate
     * @param maxLength Maximum number of characters before truncation
     * @returns Truncated string with "..." if longer than maxLength
     * 
     * To adjust truncation point for specific tables:
     * - Assessment titles: maxLength = 35
     * - Student names: maxLength = 30
     * - Topic names: maxLength = 25-40 depending on column width
     */
    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * UTILITY FUNCTION: Loads and processes images for PDF embedding
     * 
     * Loads an image file and converts it to a data URL format that jsPDF can use
     * Adds a white background to transparent images to prevent black backgrounds
     * 
     * @param path Path to the image file (relative to public folder)
     * @returns Promise<string> Base64-encoded image data URL
     * 
     * To change logo path: Update the logoPath in addModernHeader()
     * To adjust white background: Modify the fillStyle color (currently '#FFFFFF')
     */
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

