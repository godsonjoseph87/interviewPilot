import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FinalReport } from '@/types';
import { formatDate } from '@/lib/utils';

export function generateReportPdf(report: FinalReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [14, 116, 144]; // cyan-700
  const darkTextColor = [30, 41, 59]; // slate-800
  const mutedTextColor = [100, 116, 139]; // slate-500

  // Header Title
  doc.setFillColor(15, 23, 42); // slate-900 background banner
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERVIEWPILOT AI', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Technical Engineering Evaluation Report', 14, 25);

  const recText = report.interviewerOverrideRecommendation || report.hiringRecommendation;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248); // cyan-400
  doc.text(`VERDICT: ${recText.toUpperCase()}`, 145, 18);

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Score: ${report.overallScore100} / 100`, 145, 25);

  // Metadata Grid
  let y = 42;
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  doc.text('Candidate:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(report.candidateName, 42, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Role / Position:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(report.jobPosition, 148, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Experience:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(report.totalExperience, 42, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Interviewer:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(report.interviewerName, 148, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(report.interviewDate), 42, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Duration:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${Math.round(report.actualDurationSeconds / 60)} min / ${report.durationMinutes} min target`, 148, y);

  y += 12;

  // Executive Summary Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, y, 182, 24, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('EXECUTIVE CANDIDATE OVERVIEW', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  const splitOverview = doc.splitTextToSize(report.candidateOverview, 174);
  doc.text(splitOverview.slice(0, 3), 18, y + 12);

  y += 32;

  // Category Score Breakdown Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Category-Wise Performance', 14, y);

  const categoryRows = report.categoryScores.map((c) => [
    c.category,
    `${c.earned} / ${c.possible}`,
    `${c.percentage}%`,
    c.percentage >= 80 ? 'Proficient' : c.percentage >= 60 ? 'Adequate' : 'Needs Focus',
  ]);

  autoTable(doc, {
    startY: y + 4,
    head: [['Technical Category', 'Score Earned', 'Percentage', 'Assessment']],
    body: categoryRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    margin: { left: 14, right: 14 },
  });

  // Competency Ratings Table
  const finalY1 = (doc as any).lastAutoTable.finalY || y + 45;
  let compY = finalY1 + 10;

  if (compY > 230) {
    doc.addPage();
    compY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Core Technical Competency Ratings', 14, compY);

  const compData = [
    ['Java & JVM Internals', `${report.competencies.java.score}%`, report.competencies.java.level, report.competencies.java.notes],
    ['Spring Boot & Microservices', `${report.competencies.springBootMicroservices.score}%`, report.competencies.springBootMicroservices.level, report.competencies.springBootMicroservices.notes],
    ['Kafka & Distributed Messaging', `${report.competencies.kafka.score}%`, report.competencies.kafka.level, report.competencies.kafka.notes],
    ['MySQL & Storage Optimization', `${report.competencies.mySql.score}%`, report.competencies.mySql.level, report.competencies.mySql.notes],
    ['System Design & Architecture', `${report.competencies.systemDesign.score}%`, report.competencies.systemDesign.level, report.competencies.systemDesign.notes],
    ['Design Patterns & Class Design', `${report.competencies.designPatterns.score}%`, report.competencies.designPatterns.level, report.competencies.designPatterns.notes],
    ['Real-World Problem Solving', `${report.competencies.realWorldProblemSolving.score}%`, report.competencies.realWorldProblemSolving.level, report.competencies.realWorldProblemSolving.notes],
    ['Data Structures & Algorithms', `${report.competencies.dsa.score}%`, report.competencies.dsa.level, report.competencies.dsa.notes],
  ];

  autoTable(doc, {
    startY: compY + 4,
    head: [['Competency Area', 'Rating', 'Proficiency', 'Key Evaluator Notes']],
    body: compData,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 116, 144],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      3: { cellWidth: 90 },
    },
    margin: { left: 14, right: 14 },
  });

  // New Page for Strengths, Weaknesses & Detailed Questions
  doc.addPage();
  let page2Y = 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Strengths & Weaknesses Analysis', 14, page2Y);

  // Strengths
  page2Y += 6;
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129); // green
  doc.text('Identified Technical Strengths:', 14, page2Y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  report.technicalStrengths.forEach((st) => {
    page2Y += 5;
    doc.text(`• ${st}`, 18, page2Y);
  });

  // Weaknesses
  page2Y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(244, 63, 94); // rose
  doc.text('Identified Technical Weaknesses:', 14, page2Y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  report.technicalWeaknesses.forEach((wk) => {
    page2Y += 5;
    doc.text(`• ${wk}`, 18, page2Y);
  });

  // Areas for improvement
  page2Y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(245, 158, 11); // amber
  doc.text('Key Recommended Improvement Areas:', 14, page2Y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  report.areasForImprovement.forEach((ar) => {
    page2Y += 5;
    doc.text(`• ${ar}`, 18, page2Y);
  });

  // DSA Assessment Section
  page2Y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Data Structures & Algorithms Performance', 14, page2Y);

  const dsaRows = report.dsaAssessment.problems.map((p) => [
    p.problemTitle,
    p.language,
    `${p.aiScore}/100`,
    `${p.interviewerScore}/100`,
    p.summary,
  ]);

  autoTable(doc, {
    startY: page2Y + 4,
    head: [['DSA Problem', 'Language', 'AI Score', 'Final Score', 'Key Takeaways']],
    body: dsaRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      4: { cellWidth: 80 },
    },
    margin: { left: 14, right: 14 },
  });

  // Question-by-Question Assessment Table
  const finalY2 = (doc as any).lastAutoTable.finalY || page2Y + 40;
  let qTableY = finalY2 + 10;

  if (qTableY > 220) {
    doc.addPage();
    qTableY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Detailed Question-Level Evaluations', 14, qTableY);

  const qRows = report.detailedQuestionAssessment.map((q) => [
    q.category,
    q.isContextual ? `[AI Contextual] ${q.questionTitle}` : `[Original] ${q.questionTitle}`,
    q.interviewerEvaluation.toUpperCase(),
    `${q.scoreAwarded} / ${q.maxScore}`,
    q.notes
      ? q.isContextual && q.projectContextUsed
        ? `${q.notes} (Domain Context: ${q.projectContextUsed})`
        : q.notes
      : q.isContextual && q.projectContextUsed
      ? `Domain Context: ${q.projectContextUsed}`
      : '-',
  ]);

  autoTable(doc, {
    startY: qTableY + 4,
    head: [['Category', 'Question Title', 'Evaluation', 'Score', 'Interviewer Notes']],
    body: qRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      1: { cellWidth: 55 },
      4: { cellWidth: 50 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(
      `InterviewPilot AI Evaluation • Candidate: ${report.candidateName} • Page ${i} of ${pageCount}`,
      14,
      290
    );
  }

  // Save the PDF
  const filename = `Interview_Report_${report.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

