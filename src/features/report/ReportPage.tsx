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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in print:p-0 print:max-w-none">
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
            className="text-xs flex items-center gap-1.5"
          >
            <FileJson className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5 text-blue-400" />
            <span>Print Report</span>
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadPdf}
            className="text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 font-semibold"
          >
            <Download className="h-3.5 w-3.5 text-slate-950" />
            <span>Download Official PDF</span>
          </Button>
        </div>
      </div>

      {/* Hero Evaluation Summary Banner */}
      <div className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-card to-cyan-950/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                Official Engineering Evaluation
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(report.interviewDate)}
              </span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {report.candidateName}
              </h1>
              <p className="text-base text-cyan-300 font-medium mt-0.5">
                {report.jobPosition} • {report.totalExperience} Experience
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
              {report.candidateOverview}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 font-mono">
              <span>Interviewer: {report.interviewerName}</span>
              <span>•</span>
              <span>
                Duration: {Math.round(report.actualDurationSeconds / 60)}m / {report.durationMinutes}m target
              </span>
            </div>
          </div>

          {/* Right Hero: Overall Score & Hiring Verdict */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end gap-4 shrink-0 p-5 rounded-2xl bg-slate-950/60 border border-border/80 text-center lg:text-right">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Deterministic Overall Score
              </span>
              <div className="flex items-baseline justify-center lg:justify-end gap-1.5 font-mono">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                  {report.overallScore100}
                </span>
                <span className="text-muted-foreground text-lg font-bold">/ 100</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 w-full flex flex-col items-center lg:items-end">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Hiring Recommendation
              </span>
              <ScoreBadge recommendation={effectiveRecommendation} size="lg" />
              {report.interviewerOverrideRecommendation && (
                <span className="text-[10px] text-cyan-400 italic mt-1">
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
          <Card className="border-border/80 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
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
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-lg border border-border bg-card shadow-lg text-xs font-mono space-y-1">
                              <p className="font-bold text-foreground font-sans">{data.fullName}</p>
                              <p className="text-cyan-400">Score: {data.percentage}%</p>
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
                              ? '#06b6d4'
                              : entry.percentage >= 60
                              ? '#3b82f6'
                              : '#f59e0b'
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
          <Card className="border-border/80 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet-400" />
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
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 9 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.4}
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
        <Card className="border-emerald-500/30 bg-emerald-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <CardTitle className="text-sm font-bold">Key Technical Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-foreground/90">
              {report.technicalStrengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card className="border-rose-500/30 bg-rose-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-rose-400">
              <XCircle className="h-4 w-4" />
              <CardTitle className="text-sm font-bold">Identified Technical Gaps</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-foreground/90">
              {report.technicalWeaknesses.map((wk, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{wk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="border-amber-500/30 bg-amber-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <CardTitle className="text-sm font-bold">Recommended Improvement Areas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-foreground/90">
              {report.areasForImprovement.map((area, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Practical Engineering Competency Verdict */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <CardTitle className="text-sm font-bold">
              Practical Engineering & Production Readiness
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {report.practicalEngineeringCompetency}
          </p>
        </CardContent>
      </Card>

      {/* DSA Coding Problems Performance Section */}
      {report.dsaAssessment && report.dsaAssessment.problems.length > 0 && (
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-violet-400" />
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
                  className="p-4 rounded-xl border border-border/80 bg-secondary/30 space-y-2.5"
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
                      <span className="text-xs font-bold text-cyan-400 block">
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

                  <div className="flex items-center gap-4 text-[10px] font-mono text-cyan-300 pt-1">
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
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
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
                  <tr key={idx} className="hover:bg-secondary/40 transition-colors">
                    <td className="py-3 pl-1 font-mono text-muted-foreground whitespace-nowrap">
                      {q.category}
                    </td>
                    <td className="py-3 font-semibold text-foreground max-w-xs">
                      {q.questionTitle}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          q.interviewerEvaluation === 'correct'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : q.interviewerEvaluation === 'partially_correct'
                            ? 'bg-cyan-500/10 text-cyan-400'
                            : q.interviewerEvaluation === 'skipped'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
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
      <Card className="border-border/80 print:hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-cyan-400" />
              <CardTitle className="text-sm font-bold">
                Interviewer Decision Override & Notes
              </CardTitle>
            </div>
            {isSavedComments && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-fade-in">
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

