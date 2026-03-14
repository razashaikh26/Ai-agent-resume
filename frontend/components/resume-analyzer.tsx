"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Briefcase, 
  Target, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Award, 
  Mail, 
  MessageSquare, 
  TrendingUp,
  Upload,
  X,
  ArrowLeft,
  Copy,
  Check,
  Building2,
  GraduationCap,
  Zap,
  Code2,
  ListChecks,
  Users,
  Lightbulb,
  Sparkles,
  ChevronRight
} from "lucide-react"

interface AnalysisResult {
  company_name: string | null
  role_title: string | null
  jd_requirements: string[] | null
  tech_stack: string[] | null
  job_responsibilities: string[] | null
  experience_level: string | null
  company_info: string | null
  company_tech_stack: string[] | null
  role_expectations: string | null
  company_focus: string | null
  resume_skills: string[] | null
  matching_skills: string[] | null
  missing_skills: string[] | null
  gap_analysis: string | null
  tailored_resume: string | null
  cover_letter: string | null
  fit_score: number | null
  alignment_summary: string | null
  feedback: string | null
}

const API_BASE_URL = "https://razashaikh9921-ai-agent.hf.space"

export function ResumeAnalyzer() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jdText, setJdText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showBanner, setShowBanner] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBanner(false)
    }, 30000)
    return () => clearTimeout(timer)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setResumeFile(file)
      setError(null)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.txt')) {
        setResumeFile(file)
        setError(null)
      } else {
        setError("Please upload a PDF, DOC, DOCX, or TXT file")
      }
    }
  }, [])

  const removeFile = () => {
    setResumeFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleAnalyze = async () => {
    if (!resumeFile || !jdText.trim()) {
      setError("Please provide both a resume file and job description")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", resumeFile)
      formData.append("jd", jdText)

      const response = await fetch(`${API_BASE_URL}/inject`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while analyzing")
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400"
    if (score >= 60) return "text-amber-400"
    return "text-red-400"
  }

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return "stroke-emerald-400"
    if (score >= 60) return "stroke-amber-400"
    return "stroke-red-400"
  }

  const handleNewAnalysis = () => {
    setResult(null)
    setResumeFile(null)
    setJdText("")
  }

  const renderSkillBadge = (skill: string, variant: 'default' | 'success' | 'danger') => {
    const styles = {
      default: "bg-primary/10 text-primary border-primary/20",
      success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      danger: "bg-red-500/10 text-red-400 border-red-500/20"
    }
    return (
      <span key={skill} className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
        {skill}
      </span>
    )
  }

  const ScoreCircle = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 45
    const strokeDashoffset = circumference - (score / 100) * circumference
    
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/30"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className={getScoreRingColor(score)}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 1s ease-in-out'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{Math.round(score)}%</span>
          <span className="text-xs text-muted-foreground">Match</span>
        </div>
      </div>
    )
  }

return (
  <div className="min-h-screen bg-background">
  {/* Server Wake Banner */}
  {showBanner && (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 transition-opacity duration-500">
      <p className="text-center text-xs text-amber-400">
        <AlertCircle className="inline-block h-3 w-3 mr-1.5 -mt-0.5" />
        First load may take 20-30 seconds while the server wakes from sleep.
      </p>
    </div>
  )}
  
  {/* Header */}
  <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm">Resume Analyzer</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Input Section */}
        {!result && !loading && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h1 className="text-xl font-semibold text-foreground">Analyze Your Resume</h1>
              <p className="text-xs text-muted-foreground">
                Get AI-powered insights to improve your job application
              </p>
            </div>

            {/* Resume Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Resume
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !resumeFile && fileInputRef.current?.click()}
                className={`
                  relative rounded-lg border transition-all duration-200 cursor-pointer
                  ${isDragging 
                    ? 'border-primary bg-primary/5 border-dashed' 
                    : resumeFile 
                      ? 'border-emerald-500/30 bg-emerald-500/5' 
                      : 'border-border border-dashed hover:border-primary/40 hover:bg-muted/20'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {resumeFile ? (
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
                        <FileText className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{resumeFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(resumeFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); removeFile() }}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        Drop your resume or <span className="text-primary font-medium">browse</span>
                      </p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, TXT supported</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Job Description
              </label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the complete job description here including requirements, responsibilities, and qualifications..."
                className="w-full h-40 resize-none rounded-lg border border-border bg-card/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={loading || !resumeFile || !jdText.trim()}
              size="lg"
              className="w-full font-medium"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Resume
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-medium text-foreground mt-4">Analyzing your resume...</p>
            <p className="text-xs text-muted-foreground mt-1">AI is reviewing your application fit</p>
          </div>
        )}

        {/* Results Section */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Back Button */}
            <button
              onClick={handleNewAnalysis}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Start Over
            </button>

            {/* Score + Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Score Card */}
              <Card className="md:row-span-2 bg-card/50 border-border/50">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                  <ScoreCircle score={result.fit_score || 0} />
                  <div className="mt-3 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fit Score</p>
                    {result.alignment_summary && (
                      <p className="text-xs text-muted-foreground mt-2 max-w-[200px] line-clamp-3">{result.alignment_summary}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Company</p>
                      <p className="text-sm font-medium text-foreground truncate">{result.company_name || "Not specified"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role */}
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="text-sm font-medium text-foreground truncate">{result.role_title || "Not specified"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Experience Level */}
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Experience Level</p>
                      <p className="text-sm font-medium text-foreground truncate">{result.experience_level || "Not specified"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Focus */}
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Focus Area</p>
                      <p className="text-sm font-medium text-foreground truncate">{result.company_focus || "Not specified"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for detailed info */}
            <Tabs defaultValue="skills" className="w-full">
              <TabsList className="w-full grid grid-cols-5 h-9">
                <TabsTrigger value="skills" className="text-xs">Skills</TabsTrigger>
                <TabsTrigger value="job" className="text-xs">Job Details</TabsTrigger>
                <TabsTrigger value="company" className="text-xs">Company</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
                <TabsTrigger value="feedback" className="text-xs">Feedback</TabsTrigger>
              </TabsList>

              {/* Skills Tab */}
              <TabsContent value="skills" className="mt-3 space-y-3">
                {/* Your Skills */}
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                      <Code2 className="h-3.5 w-3.5" />
                      Your Skills ({result.resume_skills?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {result.resume_skills?.map(skill => renderSkillBadge(skill, 'default'))}
                      {(!result.resume_skills || result.resume_skills.length === 0) && (
                        <p className="text-xs text-muted-foreground">No skills detected</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Matching Skills */}
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Matching Skills ({result.matching_skills?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {result.matching_skills?.map(skill => renderSkillBadge(skill, 'success'))}
                      {(!result.matching_skills || result.matching_skills.length === 0) && (
                        <p className="text-xs text-muted-foreground">No matching skills found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Missing Skills */}
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-red-400">
                      <XCircle className="h-3.5 w-3.5" />
                      Missing Skills ({result.missing_skills?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {result.missing_skills?.map(skill => renderSkillBadge(skill, 'danger'))}
                      {(!result.missing_skills || result.missing_skills.length === 0) && (
                        <p className="text-xs text-muted-foreground">Great! No critical skills missing</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Gap Analysis */}
                {result.gap_analysis && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-amber-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Gap Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{result.gap_analysis}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Job Details Tab */}
              <TabsContent value="job" className="mt-3 space-y-3">
                {/* Tech Stack */}
                {result.tech_stack && result.tech_stack.length > 0 && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <Code2 className="h-3.5 w-3.5" />
                        Required Tech Stack
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {result.tech_stack.map(tech => (
                          <span key={tech} className="inline-flex items-center rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-xs font-medium text-foreground">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Job Requirements */}
                {result.jd_requirements && result.jd_requirements.length > 0 && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <ListChecks className="h-3.5 w-3.5" />
                        Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <ul className="space-y-1.5">
                        {result.jd_requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                            <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Job Responsibilities */}
                {result.job_responsibilities && result.job_responsibilities.length > 0 && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        Responsibilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <ul className="space-y-1.5">
                        {result.job_responsibilities.map((resp, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                            <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Role Expectations */}
                {result.role_expectations && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <Target className="h-3.5 w-3.5" />
                        Role Expectations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{result.role_expectations}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Company Tab */}
              <TabsContent value="company" className="mt-3 space-y-3">
                {/* Company Info */}
                {result.company_info && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        About {result.company_name || 'Company'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{result.company_info}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Company Tech Stack */}
                {result.company_tech_stack && result.company_tech_stack.length > 0 && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <Code2 className="h-3.5 w-3.5" />
                        Company Tech Stack
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {result.company_tech_stack.map(tech => (
                          <span key={tech} className="inline-flex items-center rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-xs font-medium text-foreground">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Company Focus */}
                {result.company_focus && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Company Focus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{result.company_focus}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-3 space-y-3">
                {/* Tailored Resume */}
                {result.tailored_resume && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        Tailored Resume
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.tailored_resume!, 'resume')}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copiedField === 'resume' ? <><Check className="h-3 w-3 mr-1" />Copied</> : <><Copy className="h-3 w-3 mr-1" />Copy</>}
                      </Button>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="max-h-96 overflow-y-auto rounded-md bg-background/50 border border-border/50 p-3">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">{result.tailored_resume}</pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cover Letter */}
                {result.cover_letter && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        Cover Letter
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.cover_letter!, 'cover')}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copiedField === 'cover' ? <><Check className="h-3 w-3 mr-1" />Copied</> : <><Copy className="h-3 w-3 mr-1" />Copy</>}
                      </Button>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="max-h-96 overflow-y-auto rounded-md bg-background/50 border border-border/50 p-3">
                        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{result.cover_letter}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!result.tailored_resume && !result.cover_letter && (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No documents generated</p>
                  </div>
                )}
              </TabsContent>

              {/* Feedback Tab */}
              <TabsContent value="feedback" className="mt-3 space-y-3">
                {/* Alignment Summary */}
                {result.alignment_summary && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <Award className="h-3.5 w-3.5" />
                        Alignment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{result.alignment_summary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* AI Feedback */}
                {result.feedback && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                        <Lightbulb className="h-3.5 w-3.5" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{result.feedback}</p>
                    </CardContent>
                  </Card>
                )}

                {!result.alignment_summary && !result.feedback && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No feedback available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}
