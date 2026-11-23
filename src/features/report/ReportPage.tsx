import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  FileJson,
  ArrowLeft,
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
import { useChartTheme, CustomChartTooltip } from '@/lib/chartTheme';

interface ReportPageProps {
  reportId?: string;
  onReturnToDashboard: () => void;
}

export function ReportPage({ reportId, onReturnToDashboard }: ReportPageProps) {
  const chartTheme = useChartTheme();
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
              particleCount: 50,
              spread: 50,
              origin: { y: 0.6 },
              colors: ['#c49b45', '#9e792f', '#10b981', '#71717a'],
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
        <h3 className="text-h3 font-semibold text-foreground">Report Not Found</h3>
        <p className="text-caption text-muted-foreground">
          The requested interview evaluation report could not be located in local storage.
        </p>
        <Button onClick={onReturnToDashboard} variant="primary" size="sm">
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in print:p-0 print:max-w-none max-w-7xl">
      {/* Top Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 print:hidden">
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
            className="text-xs font-semibold"
          >
            <FileJson className="h-3.5 w-3.5 mr-1.5 text-primary" />
            <span>Export JSON</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5 text-primary" />
            <span>Print Report</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadQuestionsPdf}
            className="text-xs font-semibold"
            title="Download Questions, Answers & Key Check Points PDF to share"
          >
            <FileDown className="h-3.5 w-3.5 mr-1.5 text-primary" />
            <span>Export Q&A PDF</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadPdf}
            className="text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span>Download Official PDF</span>
          </Button>
        </div>
      </div>

      {/* Hero Evaluation Summary Banner */}
      <div className="relative rounded-xl border border-border bg-card p-6 sm:p-8 card-surface ai-surface overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="text-caption font-mono uppercase tracking-[0.12em] text-primary font-semibold px-2.5 py-0.5 rounded-full bg-primary-subtle border border-primary-border">
                Official Engineering Evaluation
              </span>
              <span className="text-caption text-muted-foreground font-mono tabular-nums">
                {formatDate(report.interviewDate)}
              </span>
            </div>

            <div>
              <h1 className="text-display font-display font-semibold tracking-tight text-foreground">
                {report.candidateName}
              </h1>
              <p className="text-small text-primary font-semibold mt-1">
                {report.jobPosition} • {report.totalExperience} Experience
              </p>
            </div>

            <p className="text-body text-muted-foreground leading-relaxed pt-1">
              {report.candidateOverview}
            </p>

            {report.candidateContextSummary && (
              <div className="pt-2 space-y-1.5 border-t border-border">
                <span className="text-caption font-semibold text-muted-foreground uppercase tracking-wider block">
                  Identified Candidate Systems & Architecture:
                </span>
                <div className="flex flex-wrap gap-1.5 text-caption">
                  {report.candidateContextSummary.domain && (
                    <span className="px-2 py-0.5 rounded-md bg-primary-subtle text-primary border border-primary/20 font-medium">
                      Domain: {report.candidateContextSummary.domain}
                    </span>
                  )}
                  {report.candidateContextSummary.technologies?.map((tech, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-surface-raised text-foreground border border-border font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                  {report.candidateContextSummary.architecture?.map((arch, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-surface-raised text-muted-foreground border border-border font-medium"
                    >
                      {arch}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-caption text-muted-foreground pt-2 font-mono tabular-nums">
              <span>Interviewer: {report.interviewerName}</span>
              <span>•</span>
              <span>
                Duration: {Math.round(report.actualDurationSeconds / 60)}m / {report.durationMinutes}m target
              </span>
            </div>
          </div>

          {/* Right Hero: Overall Score & Hiring Verdict */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end gap-4 shrink-0 p-5 rounded-xl bg-surface-raised border border-border text-center lg:text-right">
            <div>
              <span className="text-caption font-semibold text-muted-foreground uppercase tracking-wider block">
                Deterministic Overall Score
              </span>
              <div className="flex items-baseline justify-center lg:justify-end gap-1.5 font-mono tabular-nums">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
                  {report.overallScore100}
                </span>
                <span className="text-muted-foreground text-lg font-bold">/ 100</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border w-full flex flex-col items-center lg:items-end">
              <span className="text-caption font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Hiring Recommendation
              </span>
              <ScoreBadge recommendation={effectiveRecommendation} size="lg" />
              {report.interviewerOverrideRecommendation && (
                <span className="text-caption text-primary italic mt-1">
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
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
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
                      tick={{ fill: chartTheme.mutedForeground, fontSize: 11 }}
                      stroke={chartTheme.gridStroke}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: chartTheme.mutedForeground, fontSize: 11 }}
                      stroke={chartTheme.gridStroke}
                      unit="%"
                    />
                    <Tooltip
                      content={<CustomChartTooltip valueSuffix="%" />}
                    />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]} fill={chartTheme.primary}>
                      {categoryChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartTheme.primary}
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
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
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
                    <PolarGrid stroke={chartTheme.gridStroke} />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: chartTheme.mutedForeground, fontSize: 11, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: chartTheme.mutedForeground, fontSize: 10 }}
                      stroke={chartTheme.gridStroke}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke={chartTheme.primary}
                      fill={chartTheme.primary}
                      fillOpacity={0.25}
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
        <Card className="border-success-border bg-success-subtle/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold text-foreground">Key Technical Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-foreground/90">
              {report.technicalStrengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <div className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card className="border-danger-border bg-danger-subtle/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-danger">
              <XCircle className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold text-foreground">Identified Technical Gaps</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-foreground/90">
              {report.technicalWeaknesses.map((wk, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <div className="h-1.5 w-1.5 rounded-full bg-danger mt-1.5 shrink-0" />
                  <span>{wk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="border-warning-border bg-warning-subtle/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold text-foreground">Recommended Improvement Areas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-foreground/90">
              {report.areasForImprovement.map((area, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <div className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Practical Engineering Competency Verdict */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              Practical Engineering & Production Readiness
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-body text-muted-foreground leading-relaxed">
            {report.practicalEngineeringCompetency}
          </p>
        </CardContent>
      </Card>

      {/* DSA Coding Problems Performance Section */}
      {report.dsaAssessment && report.dsaAssessment.problems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
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
                  className="p-4 rounded-lg border border-border bg-surface-raised space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Problem {i + 1}: {prob.problemTitle}
                      </h4>
                      <span className="text-caption font-mono text-muted-foreground capitalize">
                        Language: {prob.language}
                      </span>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <span className="text-xs font-bold text-primary block">
                        Score: {prob.interviewerScore} / 100
                      </span>
                      {prob.aiScore !== prob.interviewerScore && (
                        <span className="text-caption text-muted-foreground">
                          (AI: {prob.aiScore})
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {prob.summary}
                  </p>

                  <div className="flex items-center gap-4 text-caption font-mono text-muted-foreground pt-1">
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              Detailed Question-by-Question Assessment
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-1">Category</th>
                  <th className="pb-3">Question Title</th>
                  <th className="pb-3">Evaluation</th>
                  <th className="pb-3">Score Awarded</th>
                  <th className="pb-3">Interviewer Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.detailedQuestionAssessment.map((q, idx) => (
                  <tr key={idx} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 pl-1 font-mono text-muted-foreground whitespace-nowrap">
                      {q.category}
                    </td>
                    <td className="py-3 font-semibold text-foreground max-w-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {q.isContextual ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-caption font-semibold bg-primary-subtle text-primary border border-primary/20">
                              <Sparkles className="h-2.5 w-2.5" />
                              <span>AI Contextual</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-caption font-medium bg-surface-raised text-muted-foreground border border-border">
                              Original
                            </span>
                          )}
                          <span>{q.questionTitle}</span>
                        </div>
                        {q.isContextual && q.projectContextUsed && (
                          <div className="text-caption text-primary font-normal">
                            Context: {q.projectContextUsed}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold uppercase ${
                          q.interviewerEvaluation === 'correct'
                            ? 'bg-success-subtle text-success border border-success-border'
                            : q.interviewerEvaluation === 'partially_correct'
                              ? 'bg-primary-subtle text-primary border border-primary/20'
                              : q.interviewerEvaluation === 'skipped'
                                ? 'bg-muted text-muted-foreground border border-border'
                                : 'bg-danger-subtle text-danger border border-danger-border'
                        }`}
                      >
                        {q.interviewerEvaluation}
                      </span>
                    </td>
                    <td className="py-3 font-mono tabular-nums font-bold text-foreground">
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
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
                Interviewer Decision Override & Notes
              </CardTitle>
            </div>
            {isSavedComments && (
              <span className="text-xs text-success font-medium flex items-center gap-1 animate-fade-in">
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
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              variant="primary"
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
