import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InterviewSession, Question, DsaProblem, ContextualAlternative, QuestionEvaluation } from '@/types';
import { formatDate } from '@/lib/utils';

export interface GenerateQuestionsPdfParams {
  session: InterviewSession;
  questions: Question[];
  dsaProblems: DsaProblem[];
  contextualAlternatives?: Record<string, ContextualAlternative[]>;
  evaluations?: Record<string, QuestionEvaluation>;
}

export function generateQuestionsPdf({
  session,
  questions,
  dsaProblems,
  contextualAlternatives = {},
  evaluations = {},
}: GenerateQuestionsPdfParams): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Color Palette
  const brandDark = [15, 23, 42]; // slate-900
  const brandAmber = [217, 119, 6]; // amber-600
  const brandEmerald = [16, 185, 129]; // emerald-500
  const brandRose = [225, 29, 72]; // rose-600
  const textDark = [30, 41, 59]; // slate-800
  const textMuted = [100, 116, 139]; // slate-500
  const bgCard = [248, 250, 252]; // slate-50
  const borderCard = [226, 232, 240]; // slate-200

  let y = 0;

  // Helper: check space on page and add new page if needed
  const checkPageBreak = (neededHeight: number): void => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 16;
    }
  };

  // ==========================================
  // PAGE 1: HEADER & METADATA BANNER
  // ==========================================
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERVIEWPILOT AI', margin, 17);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Technical Interview Questions, Expected Answers & Evaluation Key Points', margin, 24);

  // Right Badge
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text('INTERVIEWER CHEAT SHEET', pageWidth - margin, 17, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `${questions.length} Technical Questions • ${dsaProblems.length} DSA Problems`,
    pageWidth - margin,
    24,
    { align: 'right' }
  );

  y = 40;

  // Metadata Card
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'FD');

  const col1X = margin + 4;
  const col2X = margin + 94;
  let metaY = y + 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Candidate:', col1X, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(session.candidateName || 'N/A', col1X + 25, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Target Role:', col2X, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(session.jobPosition || 'Software Engineer', col2X + 25, metaY);

  metaY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Experience:', col1X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(
    `${session.totalExperience || '5+ Years'} (Java: ${session.relevantJavaExperience || '3+ Years'})`,
    col1X + 25,
    metaY
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Interviewer:', col2X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(session.interviewerName || 'Technical Interviewer', col2X + 25, metaY);

  metaY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Difficulty:', col1X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text((session.difficulty || 'hard').toUpperCase(), col1X + 25, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Date / Time:', col2X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${formatDate(session.createdAt || Date.now())} • ${session.durationMinutes} min`, col2X + 25, metaY);

  y += 36;

  // ==========================================
  // QUICK INDEX TABLE (Table of Contents)
  // ==========================================
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text('Interview Questions Overview', margin, y);

  const indexRows = [
    ...questions.map((q) => [
      `Q${q.number}`,
      'Technical Question',
      q.topic,
      q.title,
      (q.difficulty || 'Medium').toUpperCase(),
      `${q.suggestedTimeMinutes || 7} min`,
    ]),
    ...dsaProblems.map((p, idx) => [
      `DSA ${idx + 1}`,
      'Coding Assessment',
      'Algorithms & Data Structures',
      p.title,
      (session.difficulty || 'hard').toUpperCase(),
      `${p.suggestedTimeMinutes || 12} min`,
    ]),
  ];

  autoTable(doc, {
    startY: y + 3,
    head: [['#', 'Section', 'Category / Topic', 'Question Title', 'Level', 'Time']],
    body: indexRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 14, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 36 },
      3: { cellWidth: 64 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ==========================================
  // SECTION 1: TECHNICAL QUESTIONS & ANSWERS
  // ==========================================
  checkPageBreak(30);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text('Part I: Technical Engineering Questions & Solutions', margin, y);
  y += 6;

  questions.forEach((q) => {
    // Check if this question was regenerated/adapted with an alternative
    const alternatives = contextualAlternatives[q.id] || [];
    const evaluation = evaluations[q.id];
    const selectedVersionId = evaluation?.selectedVersion;
    const selectedAlt = alternatives.find((a) => a.id === selectedVersionId) || (alternatives.length > 0 ? alternatives[0] : null);

    const activeTitle = selectedAlt ? `${q.title} (Adapted: ${selectedAlt.title})` : q.title;
    const activeQuestion = selectedAlt ? selectedAlt.question : q.question;
    const activeExpectedAnswer = selectedAlt ? selectedAlt.expectedAnswer : q.expectedAnswer;
    const activeEvalPoints = selectedAlt?.evaluationPoints?.length ? selectedAlt.evaluationPoints : q.evaluationPoints;
    const activeCommonMistakes = selectedAlt?.commonMistakes?.length ? selectedAlt.commonMistakes : q.commonMistakes;
    const activeRedFlags = selectedAlt?.redFlags?.length ? selectedAlt.redFlags : q.redFlags;
    const activeFollowUps = selectedAlt?.followUpQuestions?.length ? selectedAlt.followUpQuestions : q.followUpQuestions;

    checkPageBreak(50);

    // Question Header Box
    doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.rect(margin, y, contentWidth, 7, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`QUESTION #${q.number}: ${activeTitle}`, margin + 3, y + 5);

    doc.setFontSize(7.5);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text(`${q.topic} • ${(q.difficulty || 'Medium').toUpperCase()} • ${q.suggestedTimeMinutes || 7} min`, pageWidth - margin - 3, y + 5, {
      align: 'right',
    });
    y += 10;

    // 1. Question Statement
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text('Question Statement:', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const splitPrompt = doc.splitTextToSize(activeQuestion, contentWidth);
    doc.text(splitPrompt, margin, y);
    y += splitPrompt.length * 3.6 + 3;

    // If an alternative option exists, note it
    if (selectedAlt) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(brandAmber[0], brandAmber[1], brandAmber[2]);
      doc.text(`* Tailored to candidate project domain: ${selectedAlt.projectContextUsed}`, margin, y);
      y += 4;
    }

    // 2. Expected Answer (Paginated Answer Guide Box)
    checkPageBreak(25);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
    doc.text('Expected Answer & Architectural Depth:', margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitAnswer: string[] = doc.splitTextToSize(activeExpectedAnswer, contentWidth - 8);

    const ansLineHeight = 3.6;
    let ansLineIdx = 0;

    while (ansLineIdx < splitAnswer.length) {
      checkPageBreak(15);
      const availableHeight = pageHeight - 18 - y;
      const maxLinesOnThisPage = Math.max(1, Math.floor((availableHeight - 6) / ansLineHeight));
      const linesChunk = splitAnswer.slice(ansLineIdx, ansLineIdx + maxLinesOnThisPage);
      const chunkHeight = linesChunk.length * ansLineHeight + 5;

      doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
      doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
      doc.roundedRect(margin, y, contentWidth, chunkHeight, 1.5, 1.5, 'FD');

      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(linesChunk, margin + 4, y + 4);

      y += chunkHeight + 2;
      ansLineIdx += linesChunk.length;

      if (ansLineIdx < splitAnswer.length) {
        doc.addPage();
        y = 16;
      }
    }
    y += 2;

    // 3. Key Points to Check (Evaluation Checklist)
    if (activeEvalPoints && activeEvalPoints.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
      doc.text('Key Evaluation Points to Check:', margin, y);
      y += 4;

      activeEvalPoints.forEach((point) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
        doc.text('[✓]', margin + 2, y);

        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        const splitPoint = doc.splitTextToSize(point, contentWidth - 10);
        doc.text(splitPoint, margin + 8, y);
        y += splitPoint.length * 3.4;
      });
      y += 2;
    }

    // 4. Common Mistakes & Red Flags Grid
    const hasMistakes = activeCommonMistakes && activeCommonMistakes.length > 0;
    const hasRedFlags = activeRedFlags && activeRedFlags.length > 0;

    if (hasMistakes || hasRedFlags) {
      checkPageBreak(25);
      const halfWidth = (contentWidth - 4) / 2;

      let startY = y;
      let leftEndY = y;
      let rightEndY = y;

      // Common Mistakes Column (Left)
      if (hasMistakes) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(brandAmber[0], brandAmber[1], brandAmber[2]);
        doc.text('Common Pitfalls & Mistakes:', margin, startY);
        let curY = startY + 4;

        activeCommonMistakes.slice(0, 3).forEach((m) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.2);
          doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
          const splitM = doc.splitTextToSize(`• ${m}`, halfWidth);
          doc.text(splitM, margin, curY);
          curY += splitM.length * 3.2;
        });
        leftEndY = curY;
      }

      // Red Flags Column (Right)
      if (hasRedFlags) {
        const rightX = margin + halfWidth + 4;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(brandRose[0], brandRose[1], brandRose[2]);
        doc.text('Red Flags to Watch For:', rightX, startY);
        let curY = startY + 4;

        activeRedFlags.slice(0, 3).forEach((rf) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.2);
          doc.setTextColor(brandRose[0], brandRose[1], brandRose[2]);
          const splitRf = doc.splitTextToSize(`! ${rf}`, halfWidth);
          doc.text(splitRf, rightX, curY);
          curY += splitRf.length * 3.2;
        });
        rightEndY = curY;
      }

      y = Math.max(leftEndY, rightEndY) + 3;
    }

    // 5. Follow-Up Questions
    if (activeFollowUps && activeFollowUps.length > 0) {
      checkPageBreak(18);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
      doc.text('Suggested Probing Follow-Ups:', margin, y);
      y += 4;

      activeFollowUps.slice(0, 2).forEach((f) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        const splitF = doc.splitTextToSize(`→ "${f}"`, contentWidth - 4);
        doc.text(splitF, margin + 2, y);
        y += splitF.length * 3.4;
      });
      y += 2;
    }

    // Divider
    y += 4;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  });

  // ==========================================
  // SECTION 2: CODING ASSESSMENT (DSA & WORKING CODE)
  // ==========================================
  if (dsaProblems.length > 0) {
    checkPageBreak(35);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text('Part II: Coding Assessment (DSA Problems & Working Code)', margin, y);
    y += 6;

    dsaProblems.forEach((p, idx) => {
      checkPageBreak(70);

      // Header Bar
      doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
      doc.rect(margin, y, contentWidth, 7, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`DSA PROBLEM #${idx + 1}: ${p.title}`, margin + 3, y + 5);

      doc.setFontSize(7.5);
      doc.setTextColor(251, 191, 36);
      doc.text(
        `${(session.dsaLanguage || 'Java').toUpperCase()} • Time: ${p.expectedTimeComplexity || 'O(N)'} • Space: ${p.expectedSpaceComplexity || 'O(1)'}`,
        pageWidth - margin - 3,
        y + 5,
        { align: 'right' }
      );
      y += 10;

      // 1. Problem Statement
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
      doc.text('Problem Statement & Constraints:', margin, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      const splitDesc = doc.splitTextToSize(p.description, contentWidth);
      doc.text(splitDesc, margin, y);
      y += splitDesc.length * 3.6 + 3;

      // Constraints
      if (p.constraints && p.constraints.length > 0) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text('Constraints:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(p.constraints.join(' • '), margin + 18, y);
        y += 4;
      }

      // 2. Expected Algorithmic Approach & Complexity
      checkPageBreak(25);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brandEmerald[0], brandEmerald[1], brandEmerald[2]);
      doc.text('Optimal Algorithmic Approach:', margin, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      const splitApproach = doc.splitTextToSize(p.expectedApproach, contentWidth);
      doc.text(splitApproach, margin, y);
      y += splitApproach.length * 3.6 + 4;

      // 3. Complete Working Code Solution (Paginated Dark IDE code box)
      if (p.workingCode) {
        checkPageBreak(30);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
        doc.text(`Working Solution Code (${(session.dsaLanguage || 'Java').toUpperCase()}):`, margin, y);
        y += 4.5;

        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        const splitCode: string[] = doc.splitTextToSize(p.workingCode, contentWidth - 6);

        const codeLineHeight = 3.2;
        let lineIdx = 0;

        while (lineIdx < splitCode.length) {
          checkPageBreak(15);
          const availableHeight = pageHeight - 18 - y;
          const maxLinesOnThisPage = Math.max(1, Math.floor((availableHeight - 4) / codeLineHeight));
          const linesChunk = splitCode.slice(lineIdx, lineIdx + maxLinesOnThisPage);
          const chunkHeight = linesChunk.length * codeLineHeight + 4;

          // Draw dark code container for this chunk
          doc.setFillColor(15, 23, 42); // slate-900
          doc.roundedRect(margin, y, contentWidth, chunkHeight, 1.5, 1.5, 'F');

          doc.setTextColor(241, 245, 249); // light code text
          doc.text(linesChunk, margin + 3, y + 3.5);

          y += chunkHeight + 2;
          lineIdx += linesChunk.length;

          if (lineIdx < splitCode.length) {
            doc.addPage();
            y = 16;
          }
        }
        y += 3;
      }

      // 4. Edge Cases to Test
      if (p.edgeCases && p.edgeCases.length > 0) {
        checkPageBreak(18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(brandAmber[0], brandAmber[1], brandAmber[2]);
        doc.text('Edge Cases to Challenge Candidate:', margin, y);
        y += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        p.edgeCases.forEach((ec) => {
          checkPageBreak(6);
          const splitEc = doc.splitTextToSize(`• ${ec}`, contentWidth - 4);
          doc.text(splitEc, margin + 2, y);
          y += splitEc.length * 3.2;
        });
        y += 2;
      }

      // Divider
      y += 4;
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    });
  }

  // ==========================================
  // FOOTER (Page X of Y on all pages)
  // ==========================================
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `InterviewPilot AI • Technical Interview Q&A Guide • Candidate: ${session.candidateName || 'N/A'} • Page ${i} of ${totalPages}`,
      margin,
      pageHeight - 8
    );
    doc.text(
      `CONFIDENTIAL INTERVIEWER GUIDE`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // Save PDF
  const safeCandidate = (session.candidateName || 'Candidate').replace(/\s+/g, '_');
  const safePosition = (session.jobPosition || 'Software_Engineer').replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Interview_QA_Guide_${safeCandidate}_${safePosition}_${dateStr}.pdf`;
  doc.save(filename);
}
