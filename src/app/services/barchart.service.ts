import { Injectable } from '@angular/core';
import { ChartConfiguration } from 'chart.js';

@Injectable({
  providedIn: 'root'
})
export class BarchartService {

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['3A', '3B', '3C', '3B', '2D', '1B', '4A', '4D'],
    datasets: [{
      data: [85, 65, 55, 45, 35, 55, 40, 55],
      backgroundColor: '#0052CC',
      label: 'Performance'
    }]
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 100,
    devicePixelRatio: window.devicePixelRatio || 2,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        align: 'center',
        labels: {
          usePointStyle: true,
          padding: 15,
          boxWidth: 8,
          boxHeight: 8,
          font: { size: 11 }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        titleFont: { weight: 'bold', size: 12 },
        bodyFont: { size: 11 },
        displayColors: true,
        boxPadding: 3
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { display: true, color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          font: { size: 10 },
          maxTicksLimit: 5,
          padding: 5,
          callback: function (value) { return value + '%'; }
        },
        border: { dash: [2, 4] }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      }
    },
    animation: { duration: 1000, easing: 'easeOutQuart' },
    layout: { padding: { top: 5, right: 10, bottom: 5, left: 10 } },
    transitions: { active: { animation: { duration: 400 } } }
  };

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Block A', 'Block B', 'Block C', 'Block D'],
    datasets: [{
      data: [30, 20, 25, 25],
      backgroundColor: ['#0052CC', '#4C2A85', '#E63946', '#40C4AA']
    }]
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 100,
    devicePixelRatio: window.devicePixelRatio || 2,
    layout: { padding: { top: 5, right: 10, bottom: 5, left: 10 } },
    plugins: {
      legend: {
        position: 'bottom',
        align: 'center',
        labels: {
          usePointStyle: true,
          padding: 15,
          boxWidth: 8,
          boxHeight: 8,
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.chart.data.datasets[0].data.reduce((a, b) => (a as number) + (b as number), 0) as number;
            const percentage = Math.round(value as number / total * 100);
            return `${label}: ${value} students (${percentage}%)`;
          }
        },
        displayColors: true,
        boxPadding: 3
      }
    },
    animation: { animateRotate: true, animateScale: true, duration: 1000, easing: 'easeOutQuart' },
    cutout: '50%',
    radius: '90%'
  };

  buildBarChartData(charts: any[]): void {
    if (!charts || charts.length === 0) return;

    const labels = charts.map(c => c.className);
    const performanceData = charts.map(c => c.overallPerformance || 0);
    const averageScores = charts.map(c => c.averageScore || 0);
    const completionRates = charts.map(c => c.completionRate || 0);

    this.barChartData = {
      labels,
      datasets: [
        { data: performanceData, backgroundColor: '#0052CC', label: 'Overall Performance' },
        { data: averageScores, backgroundColor: '#4C2A85', label: 'Average Score' },
        { data: completionRates, backgroundColor: '#40C4AA', label: 'Completion Rate' }
      ]
    };
  }

  buildPieChartData(charts: any[]): void {
    if (!charts || charts.length === 0) return;

    const labels = charts.map(c => c.className);
    const studentCounts = charts.map(c => c.studentCount || 0);

    this.pieChartData = {
      labels,
      datasets: [{
        data: studentCounts,
        backgroundColor: ['#0052CC', '#4C2A85', '#E63946', '#40C4AA', '#F59E0B', '#10B981']
      }]
    };
  }
}
