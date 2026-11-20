import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  FileJson,
  ArrowLeft,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code2,
  Layers,
  Sparkles,
  Edit3,
  Save,
  Check,
  TrendingUp,
  Brain,
  Shield,
  Clock,
  User,
  FileDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { Textarea } from '@/components/ui/Textarea';
import { db } from '@/services/db';
import { generateReportPdf } from '@/services/pdf/reportPdfGenerator';
import { generateQuestionsPdf } from '@/services/pdf/questionBankPdfGenerator';
import type { FinalReport, HiringRecommendation } from '@/types';
import { formatDate } from '@/lib/utils';
import { HIRING_RECOMMENDATIONS } from '@/lib/constants';

interface ReportPageProps {
  reportId?: string;
  onReturnToDashboard: () => void;
}

export function ReportPage({ reportId, onReturnToDashboard }: ReportPageProps) {
  const [report, setReport] = useState<FinalReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [overrideRec, setOverrideRec] = useState<HiringRecommendation | ''>('');
  const [finalComments, setFinalComments] = useState('');
  const [isSavedComments, setIsSavedComments] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        let rep: FinalReport | undefined;
        if (reportId) {
          rep = await db.reports.get(reportId);
        } else {
          // get latest report
          rep = await db.reports.orderBy('generatedAt').reverse().first();
        }

        if (rep) {
          setReport(rep);
          setOverrideRec(rep.interviewerOverrideRecommendation || rep.hiringRecommendation);
          setFinalComments(rep.interviewerFinalComments || '');

          // Trigger celebratory confetti on report load
          try {
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981'],
            });
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [reportId]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground animate-pulse">
        Loading comprehensive evaluation report...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-24 text-center space-y-4">
        <h3 className="text-lg font-bold text-foreground">Report Not Found</h3>
        <p className="text-xs text-muted-foreground">
          The requested interview evaluation report could not be located in local storage.
        </p>
        <Button onClick={onReturnToDashboard} size="sm">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const effectiveRecommendation =
    overrideRec || report.interviewerOverrideRecommendation || report.hiringRecommendation;

  const handleSaveOverrides = async () => {
    if (!report) return;
    const updated: FinalReport = {
      ...report,
      interviewerOverrideRecommendation: (overrideRec as HiringRecommendation) || undefined,
      interviewerFinalComments: finalComments,
    };
    await db.reports.put(updated);
    setReport(updated);
    setIsEditingOverride(false);
    setIsSavedComments(true);
    setTimeout(() => setIsSavedComments(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `InterviewReport_${report.candidateName.replace(/\s+/g, '_')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateReportPdf(report);
  };

  const handleDownloadQuestionsPdf = async () => {
    if (!report) return;
    try {
      const session = await db.sessions.get(report.sessionId);
      if (!session) {
        alert('Session data not found.');
        return;
      }
      const questions = await db.questions.where('sessionId').equals(report.sessionId).sortBy('number');
      const dsaProblems = await db.dsaProblems.where('sessionId').equals(report.sessionId).toArray();
      const rawAlternatives = await db.contextualAlternatives.where('sessionId').equals(report.sessionId).toArray();
      const contextualAlternatives: Record<string, any[]> = {};
      rawAlternatives.forEach((alt) => {
        if (!contextualAlternatives[alt.originalQuestionId]) {
          contextualAlternatives[alt.originalQuestionId] = [];
        }
        contextualAlternatives[alt.originalQuestionId].push(alt);
      });
      const rawEvaluations = await db.evaluations.where('sessionId').equals(report.sessionId).toArray();
      const evaluations: Record<string, any> = {};
      rawEvaluations.forEach((ev) => {
        evaluations[ev.questionId] = ev;
      });

      generateQuestionsPdf({
        session,
        questions,
        dsaProblems,
        contextualAlternatives,
        evaluations,
      });
    } catch (err) {
      console.error('Failed to export questions PDF from report:', err);
      alert('Failed to generate Questions & Answers PDF.');
    }
  };

  // Recharts Data Prep: Category Bar Chart
  const categoryChartData = report.categoryScores.map((c) => ({
    name: c.category.length > 18 ? c.category.slice(0, 16) + '...' : c.category,
    fullName: c.category,
    percentage: c.percentage,
  }));

  // Recharts Data Prep: Competencies Radar Chart
  const radarData = [
    { subject: 'Java & JVM', score: report.competencies.java.score },
    { subject: 'Spring / Micro', score: report.competencies.springBootMicroservices.score },
    { subject: 'Kafka Msg', score: report.competencies.kafka.score },
    { subject: 'MySQL / DB', score: report.competencies.mySql.score },
    { subject: 'Sys Design', score: report.competencies.systemDesign.score },
    { subject: 'Patterns', score: report.competencies.designPatterns.score },
    { subject: 'Incidents', score: report.competencies.realWorldProblemSolving.score },
    { subject: 'DSA Coding', score: report.competencies.dsa.score },
  ];

  return (
    <div className="w-full px-[10%] pt-[80px] pb-16 space-y-8 animate-fade-in print:p-0 print:max-w-none">
      {/* Top Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReturnToDashboard}
          className="text-xs text-muted-foreground hover:text-foreground self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Dashboard</span>
        </Button>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="h-8 px-3.5 text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 border-amber-300/80 bg-white hover:bg-amber-50/70"
          >
            <FileJson className="h-3.5 w-3.5 text-amber-600" />
            <span>Export JSON</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 px-3.5 text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 border-amber-300/80 bg-white hover:bg-amber-50/70"
          >
            <Printer className="h-3.5 w-3.5 text-amber-600" />
            <span>Print Report</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadQuestionsPdf}
            className="h-8 px-3.5 text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 border-amber-300/80 bg-white hover:bg-amber-50/70 text-stone-900"
            title="Download Questions, Answers & Key Check Points PDF to share"
          >
            <FileDown className="h-3.5 w-3.5 text-amber-600" />
            <span>Export Q&A PDF</span>
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadPdf}
            className="h-8 px-3.5 text-xs font-bold rounded-lg inline-flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Download className="h-3.5 w-3.5 text-stone-950" />
            <span>Download Official PDF</span>
          </Button>
        </div>
      </div>

      {/* Hero Evaluation Summary Banner */}
      <div className="relative rounded-2xl border border-amber-200/80 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-400/15 via-yellow-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-800 font-bold px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-300/60">
                Official Engineering Evaluation
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {formatDate(report.interviewDate)}
              </span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {report.candidateName}
              </h1>
              <p className="text-base text-amber-800 font-semibold mt-0.5">
                {report.jobPosition} • {report.totalExperience} Experience
              </p>
            </div>

            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed pt-1">
              {report.candidateOverview}
            </p>

            {report.candidateContextSummary && (
              <div className="pt-2 space-y-1.5 border-t border-border/40">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Identified Candidate Systems & Architecture:
                </span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {report.candidateContextSummary.domain && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-900 border border-amber-300/50 font-medium">
                      Domain: {report.candidateContextSummary.domain}
                    </span>
                  )}
                  {report.candidateContextSummary.technologies?.map((tech, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-amber-50 text-stone-800 border border-amber-200/80 font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                  {report.candidateContextSummary.architecture?.map((arch, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200 font-medium"
                    >
                      {arch}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 font-mono">
              <span>Interviewer: {report.interviewerName}</span>
              <span>•</span>
              <span>
                Duration: {Math.round(report.actualDurationSeconds / 60)}m / {report.durationMinutes}m target
              </span>
            </div>
          </div>

          {/* Right Hero: Overall Score & Hiring Verdict */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end gap-4 shrink-0 p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center lg:text-right">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Deterministic Overall Score
              </span>
              <div className="flex items-baseline justify-center lg:justify-end gap-1.5 font-mono">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-amber-950">
                  {report.overallScore100}
                </span>
                <span className="text-muted-foreground text-lg font-bold">/ 100</span>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/70 w-full flex flex-col items-center lg:items-end">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Hiring Recommendation
              </span>
              <ScoreBadge recommendation={effectiveRecommendation} size="lg" />
              {report.interviewerOverrideRecommendation && (
                <span className="text-[10px] text-amber-700 italic mt-1">
                  (Adjusted by Interviewer)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Charts Row (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Performance Bar Chart (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base font-semibold">
                  Category Breakdown (%)
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Performance percentage across individual evaluated modules
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#75716b', fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#75716b', fontSize: 10 }}
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-lg border border-amber-200 bg-white shadow-lg text-xs font-mono space-y-1">
                              <p className="font-bold text-foreground font-sans">{data.fullName}</p>
                              <p className="text-amber-800 font-bold">Score: {data.percentage}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.percentage >= 80
                              ? '#d97706'
                              : entry.percentage >= 60
                                ? '#f59e0b'
                                : '#fbbf24'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Competencies Radar Chart (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base font-semibold">
                  Competency Radar Profile
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Holistic engineering balance across 8 technical dimensions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 sm:h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: '#9ca3af', fontSize: 9 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#d97706"
                      fill="#f59e0b"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Strengths, Weaknesses & Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strengths */}
        <Card className="border-emerald-500/30 bg-emerald-50/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold">Key Technical Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-foreground/90">
              {report.technicalStrengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card className="border-rose-500/30 bg-rose-50/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-rose-800">
              <XCircle className="h-4 w-4 text-rose-600" />
              <CardTitle className="text-sm font-bold">Identified Technical Gaps</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-foreground/90">
              {report.technicalWeaknesses.map((wk, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                  <span>{wk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="border-amber-400/50 bg-amber-50/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm font-bold">Recommended Improvement Areas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-foreground/90">
              {report.areasForImprovement.map((area, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Practical Engineering Competency Verdict */}
      <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm font-bold">
              Practical Engineering & Production Readiness
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
            {report.practicalEngineeringCompetency}
          </p>
        </CardContent>
      </Card>

      {/* DSA Coding Problems Performance Section */}
      {report.dsaAssessment && report.dsaAssessment.problems.length > 0 && (
        <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm font-bold">
                Data Structures & Algorithms Submissions
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {report.dsaAssessment.summary}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.dsaAssessment.problems.map((prob, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/30 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Problem {i + 1}: {prob.problemTitle}
                      </h4>
                      <span className="text-[10px] font-mono text-muted-foreground capitalize">
                        Language: {prob.language}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-amber-800 block">
                        Score: {prob.interviewerScore} / 100
                      </span>
                      {prob.aiScore !== prob.interviewerScore && (
                        <span className="text-[10px] text-muted-foreground">
                          (AI: {prob.aiScore})
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {prob.summary}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] font-mono text-amber-700 pt-1">
                    <span>Complexity: {prob.timeComplexity}</span>
                    <span>•</span>
                    <span>Space: {prob.spaceComplexity}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Question-by-Question Evaluation Table */}
      <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm font-bold">
              Detailed Question-by-Question Assessment
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-1">Category</th>
                  <th className="pb-3">Question Title</th>
                  <th className="pb-3">Evaluation</th>
                  <th className="pb-3">Score Awarded</th>
                  <th className="pb-3">Interviewer Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {report.detailedQuestionAssessment.map((q, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 pl-1 font-mono text-muted-foreground whitespace-nowrap">
                      {q.category}
                    </td>
                    <td className="py-3 font-semibold text-foreground max-w-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {q.isContextual ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-900 border border-amber-300/60">
                              <Sparkles className="h-2.5 w-2.5 text-amber-600" />
                              <span>AI Contextual</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground">
                              Original
                            </span>
                          )}
                          <span>{q.questionTitle}</span>
                        </div>
                        {q.isContextual && q.projectContextUsed && (
                          <div className="text-[10px] text-amber-800 font-normal">
                            Context: {q.projectContextUsed}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${q.interviewerEvaluation === 'correct'
                          ? 'bg-emerald-500/15 text-emerald-800'
                          : q.interviewerEvaluation === 'partially_correct'
                            ? 'bg-amber-500/15 text-amber-800'
                            : q.interviewerEvaluation === 'skipped'
                              ? 'bg-stone-500/15 text-stone-700'
                              : 'bg-rose-500/15 text-rose-800'
                          }`}
                      >
                        {q.interviewerEvaluation}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-foreground">
                      {q.scoreAwarded} / {q.maxScore}
                    </td>
                    <td className="py-3 text-muted-foreground italic max-w-sm">
                      {q.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Interviewer Decision Override & Final Comments */}
      <Card className="border-amber-200/70 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 print:hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm font-bold">
                Interviewer Decision Override & Notes
              </CardTitle>
            </div>
            {isSavedComments && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 animate-fade-in">
                <Check className="h-3.5 w-3.5" />
                <span>Saved successfully</span>
              </span>
            )}
          </div>
          <CardDescription className="text-xs">
            The interviewer maintains final authority to override the AI recommendation and append hiring notes.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Override Final Hiring Recommendation:
              </label>
              <select
                value={effectiveRecommendation}
                onChange={(e) => setOverrideRec(e.target.value as HiringRecommendation)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {HIRING_RECOMMENDATIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-muted-foreground pt-4">
              AI Initial Recommendation: <strong className="text-foreground">{report.hiringRecommendation}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Additional Interviewer Final Comments (Optional):
            </label>
            <Textarea
              value={finalComments}
              onChange={(e) => setFinalComments(e.target.value)}
              placeholder="Candidate communicated architectural patterns with high clarity; strongly recommend for the Core Payments team..."
              rows={3}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              onClick={handleSaveOverrides}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Final Verdict & Comments</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

