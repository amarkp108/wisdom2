import { useState, useEffect } from "react";
import { domains, type Domain, type Club } from "@/lib/clubData";
import { submitRegistrationToGoogleSheet } from "@/lib/googleSheet";
import { loginAndGetToken, fetchStudentDetails } from "@/lib/server-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, BookOpen, CheckCircle2, ChevronDown, Lock, School, Search, Loader2 } from "lucide-react";
import schoolLogo from "@/assets/school-logo.jpeg";
import { toast } from "sonner";

// ── Student form state ─────────────────────────────────────────────────────────
interface StudentInfo {
  scholarNo: string;
  studentName: string;
  fatherName: string;
  grade: string;
  section: string;
}

const emptyStudent = (): StudentInfo => ({
  scholarNo: "",
  studentName: "",
  fatherName: "",
  grade: "",
  section: "",
});

// Grade string → domain id (1=Grade6, 2=Grade7/8/9, 3=Grade10/11/12)
function getUnlockedDomainId(grade: string): number | null {
  const g = grade.trim();
  if (!g) return null;
  if (/\b6\b|grade.?6|\bvi\b/i.test(g)) return 1;
  if (/\b[789]\b|grade.?[789]|\bvii\b|\bviii\b|\bix\b/i.test(g)) return 2;
  if (/\b1[012]\b|grade.?1[012]|\bxi{0,2}\b/i.test(g)) return 3;
  return null;
}

export function ClubSelectionForm({ initialRegNo }: { initialRegNo?: string }) {
  const [student, setStudent] = useState<StudentInfo>(emptyStudent());
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedClubs, setSelectedClubs] = useState<Club[]>([]);
  const [expandedClub, setExpandedClub] = useState<string | null>(null);
  const [isFetchingStudent, setIsFetchingStudent] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [maxDialogOpen, setMaxDialogOpen] = useState(false);
  const [confirmationDialogState, setConfirmationDialogState] = useState<
    "confirm" | "minimum" | null
  >(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const maxSelections = selectedDomain?.maxSelections ?? 1;
  const totalSelected = selectedClubs.filter(c => !c.isDesignation).length;
  const isSubmitReady = totalSelected >= 1;
  const selectedDomainAllowsMultiple = maxSelections > 1;
  const isMaxReached = totalSelected >= maxSelections;
  const unlockedDomainId = getUnlockedDomainId(student.grade);

  // Validation
  const isStudentFilled =
    student.scholarNo.trim() !== "" &&
    student.studentName.trim() !== "" &&
    student.fatherName.trim() !== "" &&
    student.grade.trim() !== "" &&
    student.section.trim() !== "";

  const handleFieldChange = (field: keyof StudentInfo, value: string) => {
    setStudent((prev) => ({ ...prev, [field]: value }));
    if (field === "grade") {
      const newDomainId = getUnlockedDomainId(value);
      const newDomain = domains.find((d) => d.id === newDomainId) ?? null;
      if (newDomain?.id !== selectedDomain?.id) {
        setSelectedDomain(newDomain);
        setSelectedClubs([]);
        setExpandedClub(null);
      }
    }
  };

  const getDomainNameForClub = (club: Club) =>
    domains.find((domain) =>
      domain.clubs.some((dc) =>
        dc.name === club.name || dc.subClubs?.some((sc) => sc.name === club.name)
      )
    )?.name ?? "";

  const handleDomainSelect = (domain: Domain) => {
    if (selectedDomain?.id === domain.id) {
      setSelectedDomain(null);
      setSelectedClubs([]);
      setPreviewOpen(false);
      setExpandedClub(null);
      return;
    }
    setSelectedDomain(domain);
    setSelectedClubs([]);
    setPreviewOpen(false);
    setExpandedClub(null);
  };

  const handleFetchStudent = async (specificRegNo?: string) => {
    const regToFetch = specificRegNo || student.scholarNo;
    if (!regToFetch.trim()) {
      toast.error("Please enter a Scholar No.");
      return;
    }

    setIsFetchingStudent(true);
    try {
      // Ensure the field is updated to reflect what we are fetching
      setStudent(prev => ({ ...prev, scholarNo: regToFetch }));

      const result = await fetchStudentDetails(regToFetch);
      console.log("Student Data Response:", result);

      if (result.success && result.data) {
        const s = result.data.data || result.data;

        if (s && (s.name || s.studentName)) {
          setStudent(prev => ({
            ...prev,
            studentName: s.name || s.studentName || prev.studentName,
            fatherName: s.fatherName || prev.fatherName,
            grade: s.grade || s.class || prev.grade,
            section: s.section || prev.section,
          }));
          toast.success("Student details loaded successfully!");
        } else {
          // If student not found or unauthorized, we still keep the regNo in the field
          toast.error("Could not find student details (Unauthorized or Not Found).");
        }
      } else {
        toast.error("Student fetch failed (API Error).");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to connect to student database.");
    } finally {
      setIsFetchingStudent(false);
    }
  };

  useEffect(() => {
    if (initialRegNo) {
      handleFetchStudent(initialRegNo);
    }
  }, [initialRegNo]);

  const handleSubmit = () => {
    if (!isStudentFilled) {
      setSubmitError("Please fill in all student details before submitting.");
      setConfirmationDialogState("minimum");
      return;
    }
    if (!isSubmitReady) {
      setSubmitError(null);
      setConfirmationDialogState("minimum");
      return;
    }
    setSubmitError(null);
    setConfirmationDialogState("confirm");
  };

  const handleConfirmSubmit = async () => {
    setConfirmationDialogState(null);
    setSubmitError(null);
    setSubmitting(true);

    // Format each selected club — sub-clubs show as "Portfolios → Academic"
    const selectedClubNames = selectedClubs
      .map((club) => (club.parentName ? `${club.parentName} → ${club.name}` : club.name))
      .join(", ");

    try {
      await submitRegistrationToGoogleSheet({
        scholarNo: student.scholarNo,
        studentName: student.studentName,
        fatherName: student.fatherName,
        grade: student.grade,
        section: student.section,
        clubs: selectedClubNames,
      });
      setSubmitted(true);
    } catch {
      setSubmitError("Submission failed. Please try again.");
      setConfirmationDialogState("confirm");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStudent(emptyStudent());
    setSelectedDomain(null);
    setSelectedClubs([]);
    setExpandedClub(null);
    setPreviewOpen(false);
    setMaxDialogOpen(false);
    setSubmitted(false);
  };

  const selectedCountForDomain = (domain: Domain) =>
    selectedClubs.filter((club) =>
      !club.isDesignation && (domain.clubs.some((dc) => dc.name === club.name || dc.name === club.parentName))
    ).length;

  const moveClub = (index: number, direction: -1 | 1) => {
    setSelectedClubs((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const selectedClubsPreview = selectedClubs.map((club, index) => ({
    club,
    domainName: selectedDomain?.name ?? "",
    position: index + 1,
    showDomainName: index === 0,
  }));


  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f0f2f5]">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1b3a2d]">Registration Successful!</h2>
            <p className="mt-2 text-[#6b7280]">Your Topic preference has been recorded.</p>
            <div className="mt-3 flex flex-col gap-1 text-sm text-[#6b7280]">
              <p>Scholar No: <span className="font-semibold text-[#1b3a2d]">{student.scholarNo}</span></p>
              <p>Name: <span className="font-semibold text-[#1b3a2d]">{student.studentName}</span></p>
              <p>Father's Name: <span className="font-semibold text-[#1b3a2d]">{student.fatherName}</span></p>
              <p>Grade &amp; Section: <span className="font-semibold text-[#1b3a2d]">{student.grade} · {student.section}</span></p>
            </div>
            <div className="mt-6 rounded-xl bg-[#f8faf9] p-6 text-left text-sm max-w-md mx-auto">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-[#eff1f3] px-4 py-3 text-sm font-semibold text-[#1b3a2d]">
                <span>Selected topic</span>
                <span className="text-[#6b7280]">{totalSelected}/{maxSelections}</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#e5e7eb] text-sm">
                <div className="grid grid-cols-2 gap-4 bg-[#f3f4f6] px-4 py-3 text-xs uppercase tracking-[0.12em] text-[#6b7280]">
                  <span>Domain</span>
                  <span>Topic</span>
                </div>
                <div className="divide-y divide-[#e5e7eb] bg-white">
                  {selectedClubsPreview.map((item, index) => (
                    <div
                      key={`${item.domainName}-${item.club.name}`}
                      className={cn(
                        "grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 px-4 py-3 text-sm text-[#1b3a2d]",
                        index === selectedClubsPreview.length - 1
                          ? "border-b-2 border-slate-500"
                          : "border-b border-slate-300",
                      )}
                    >
                      <span className={item.showDomainName ? "font-semibold" : "text-[#6b7280]"}>
                        {item.showDomainName ? item.domainName : ""}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e2e8f0] text-xs font-semibold text-[#1b3a2d]">
                          {item.position}
                        </span>
                        <span>{item.club.parentName ? `${item.club.parentName} → ${item.club.name}` : item.club.name}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button
              onClick={handleReset}
              className="mt-6 px-6 h-11 rounded-xl bg-[#1b3a2d] hover:bg-[#153024] text-white"
            >
              Register Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-8 -mt-8 relative z-10 space-y-6">

        {/* ── Student Details ── */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f2f5]">
              <BookOpen className="h-5 w-5 text-[#1b3a2d]" />
            </div>
            <div>
              <h3 className="font-bold text-[#1b3a2d]">Student Details</h3>
              <p className="text-xs text-[#6b7280]">Fill in your details below</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scholar No */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#6b7280]">
                Scholar No. / Reg No.
              </label>
              <input
                type="text"
                id="scholarNo"
                value={student.scholarNo}
                onChange={(e) => handleFieldChange("scholarNo", e.target.value)}
                placeholder="e.g. 1231/2014"
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#1b3a2d] outline-none transition-colors focus:border-[#1b3a2d] pr-10"
              />
              <button
                type="button"
                onClick={() => handleFetchStudent()}
                disabled={isFetchingStudent}
                className="absolute right-2 top-[30px] p-1.5 rounded-md text-[#1b3a2d] hover:bg-slate-100 transition-colors disabled:opacity-50"
                title="Fetch student details"
              >
                {isFetchingStudent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Student Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#6b7280]">
                Student Name
              </label>
              <input
                type="text"
                id="studentName"
                value={student.studentName}
                onChange={(e) => handleFieldChange("studentName", e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#1b3a2d] outline-none transition-colors focus:border-[#1b3a2d]"
              />
            </div>

            {/* Father Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#6b7280]">
                Father's Name
              </label>
              <input
                type="text"
                id="fatherName"
                value={student.fatherName}
                onChange={(e) => handleFieldChange("fatherName", e.target.value)}
                placeholder="e.g. Suresh Sharma"
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#1b3a2d] outline-none transition-colors focus:border-[#1b3a2d]"
              />
            </div>

            {/* Grade */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#6b7280]">
                Grade
              </label>
              <input
                type="text"
                id="grade"
                value={student.grade}
                onChange={(e) => handleFieldChange("grade", e.target.value)}
                placeholder="e.g. GRADE-11"
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#1b3a2d] outline-none transition-colors focus:border-[#1b3a2d]"
              />
            </div>

            {/* Section */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-[#6b7280]">
                Section
              </label>
              <input
                type="text"
                id="section"
                value={student.section}
                onChange={(e) => handleFieldChange("section", e.target.value)}
                placeholder="e.g. KAUTILYA"
                className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#1b3a2d] outline-none transition-colors focus:border-[#1b3a2d]"
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 rounded-full overflow-hidden bg-[#e5e7eb]">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#c8a951] to-[#e0c86e]"
            style={{
              width: selectedDomain
                ? `${Math.min((totalSelected / maxSelections) * 100, 100)}%`
                : "0%",
            }}
          />
        </div>

        {/* Domain Selection */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f2f5]">
              <BookOpen className="h-5 w-5 text-[#1b3a2d]" />
            </div>
            <div>
              <h3 className="font-bold text-[#1b3a2d]">Choose Topic</h3>
              <p className="text-xs text-[#6b7280]">
                {unlockedDomainId !== null
                  ? "Your grade has been detected — select your topic below"
                  : "Fill your Grade above to unlock topics"}
              </p>
            </div>
          </div>

          {unlockedDomainId === null ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-[#e5e7eb] bg-[#f8faf9] text-center">
              <Lock className="h-7 w-7 text-[#9ca3af]" />
              <p className="text-sm font-medium text-[#9ca3af]">Topics locked</p>
              <p className="text-xs text-[#9ca3af]">Please fill in your Grade field above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {domains.map((domain) => {
                const selectedCount = selectedCountForDomain(domain);
                const isLocked = unlockedDomainId !== null && domain.id !== unlockedDomainId;
                return (
                  <button
                    key={domain.id}
                    onClick={() => handleDomainSelect(domain)}
                    disabled={isLocked}
                    className={cn(
                      "rounded-xl border-2 px-4 py-3 text-left transition-all text-sm font-medium",
                      isLocked
                        ? "border-[#e5e7eb] bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed opacity-50"
                        : selectedDomain?.id === domain.id
                          ? "border-[#1b3a2d] bg-[#1b3a2d] text-white shadow-md"
                          : "border-[#e5e7eb] bg-white text-[#1b3a2d] hover:border-[#1b3a2d]/30 hover:bg-[#f8faf9]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{domain.name}</span>
                      {isLocked ? (
                        <Lock className="h-3.5 w-3.5 text-[#9ca3af]" />
                      ) : (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                            selectedCount > 0
                              ? "bg-white text-[#1b3a2d]"
                              : selectedDomain?.id === domain.id ? "bg-white/20 text-white" : "bg-[#e5e7eb] text-[#6b7280]",
                          )}
                        >
                          {selectedCount}/{domain.maxSelections}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "block text-xs mt-1 font-normal",
                        isLocked ? "text-[#9ca3af]" : selectedDomain?.id === domain.id ? "text-white/70" : "text-[#9ca3af]",
                      )}
                    >
                      {isLocked ? "🔒 Locked" : `${domain.clubs.length} Topics · max ${domain.maxSelections}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Club Selection */}
        {selectedDomain && (
          <>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0f2f5]">
                  <School className="h-5 w-5 text-[#1b3a2d]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#1b3a2d]">Choose Topic</h3>
                  <p className="text-xs text-[#6b7280]">
                    {maxSelections === 1
                      ? "Select any one choice"
                      : `Select up to ${maxSelections} topics`}
                  </p>
                </div>
                <div className="text-right text-xs text-[#6b7280]">
                  <div>Total selected</div>
                  <div className="font-semibold text-[#1b3a2d]">
                    {totalSelected}/{maxSelections}
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                {(() => {
                  const domainClubNames = selectedDomain.clubs.map((dc) => dc.name);
                  const hasSameDomainSelected = selectedClubs.some((s) =>
                    domainClubNames.includes(s.name) || domainClubNames.includes(s.parentName ?? "")
                  );
                  return selectedDomain.clubs.map((club) => {
                    if (club.subClubs && club.subClubs.length > 0) {
                      const selectedSubClub = selectedClubs.find((s) => s.parentName === club.name);
                      const isExpanded = expandedClub === club.name;
                      return (
                        <div key={club.name} className="grid gap-2">
                          <button
                            onClick={() => setExpandedClub(isExpanded ? null : club.name)}
                            className={cn(
                              "flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all",
                              selectedSubClub
                                ? "border-[#1b3a2d] bg-[#1b3a2d]/5 shadow-sm"
                                : "border-[#e5e7eb] hover:border-[#1b3a2d]/30 hover:bg-[#f8faf9]",
                            )}
                          >
                            <span className="font-semibold text-[#1b3a2d] text-sm">{club.name}</span>
                            <div className="flex items-center gap-2">
                              <ChevronDown className={cn("h-4 w-4 text-[#6b7280] transition-transform duration-200", isExpanded && "rotate-180")} />
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="ml-4 flex flex-col gap-2">
                              {(() => {
                                const designations = club.subClubs!.filter(sc => sc.isDesignation);
                                const topics = club.subClubs!.filter(sc => !sc.isDesignation);
                                return (
                                  <>
                                    {designations.length > 0 && (
                                      <div className="grid grid-cols-2 gap-2 mb-1">
                                        {designations.map((subClub) => {
                                          const isSubSelected = selectedClubs.some(
                                            (s) => s.name === subClub.name && s.parentName === club.name
                                          );
                                          return (
                                            <button
                                              key={subClub.name}
                                              onClick={() => {
                                                if (isSubSelected) {
                                                  setSelectedClubs((prev) =>
                                                    prev.filter((s) => !(s.name === subClub.name && s.parentName === club.name))
                                                  );
                                                } else {
                                                  setSelectedClubs((prev) => [
                                                    ...prev.filter((s) => !(s.isDesignation && s.parentName === club.name)),
                                                    { ...subClub, parentName: club.name }
                                                  ]);
                                                }
                                              }}
                                              className={cn(
                                                "flex items-center justify-center rounded-xl border-2 p-2.5 transition-all",
                                                isSubSelected
                                                  ? "border-[#1b3a2d] bg-[#1b3a2d] shadow-sm"
                                                  : "border-[#e5e7eb] hover:border-[#1b3a2d]/30 hover:bg-[#f8faf9]"
                                              )}
                                            >
                                              <span className={cn("font-medium text-sm", isSubSelected ? "text-white" : "text-[#1b3a2d]")}>{subClub.name}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                    <div className="grid gap-2">
                                      {topics.map((subClub) => {
                                        const isSubSelected = selectedClubs.some(
                                          (s) => s.name === subClub.name && s.parentName === club.name
                                        );
                                        return (
                                          <button
                                            key={subClub.name}
                                            onClick={() => {
                                              if (isSubSelected) {
                                                setSelectedClubs((prev) =>
                                                  prev.filter((s) => !(s.name === subClub.name && s.parentName === club.name))
                                                );
                                                return;
                                              }
                                              
                                              const hasExistingTopic = selectedClubs.some(
                                                (s) => !s.isDesignation && s.parentName === club.name
                                              );
                                              
                                              if (!hasExistingTopic && isMaxReached) {
                                                setMaxDialogOpen(true);
                                                return;
                                              }
                                              
                                              const newClub: Club = { ...subClub, parentName: club.name };
                                              setSelectedClubs((prev) => [
                                                ...prev.filter((s) => !(!s.isDesignation && s.parentName === club.name)),
                                                newClub
                                              ]);
                                            }}
                                            className={cn(
                                              "flex items-center justify-between rounded-xl border-2 p-3 text-left transition-all",
                                              isSubSelected
                                                ? "border-[#1b3a2d] bg-[#1b3a2d]/5 shadow-sm"
                                                : "border-[#e5e7eb] hover:border-[#1b3a2d]/30 hover:bg-[#f8faf9]",
                                            )}
                                          >
                                            <span className="font-medium text-[#1b3a2d] text-sm">{subClub.name}</span>
                                            {isSubSelected && <CheckCircle2 className="h-5 w-5 text-[#1b3a2d] shrink-0" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    }
                    const isSelected = selectedClubs.some((s) => s.name === club.name);
                    return (
                      <button
                        key={club.name}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedClubs((prev) => prev.filter((s) => s.name !== club.name));
                            return;
                          }
                          if (isMaxReached) {
                            setMaxDialogOpen(true);
                            return;
                          }
                          if (selectedDomainAllowsMultiple) {
                            // Multi-select: just add
                            setSelectedClubs((prev) => [...prev, club]);
                          } else {
                            // Single-select: replace any same-domain selection
                            setSelectedClubs((prev) => [
                              ...prev.filter(
                                (s) => !domainClubNames.includes(s.name) && !domainClubNames.includes(s.parentName ?? "")
                              ),
                              club,
                            ]);
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all",
                          isSelected
                            ? "border-[#1b3a2d] bg-[#1b3a2d]/5 shadow-sm"
                            : "border-[#e5e7eb] hover:border-[#1b3a2d]/30 hover:bg-[#f8faf9]",
                        )}
                      >
                        <span className="font-semibold text-[#1b3a2d] text-sm">{club.name}</span>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-[#1b3a2d] shrink-0" />}
                      </button>
                    );
                  });
                })()}
              </div>
              <div className="flex justify-end pt-5 gap-3 flex-wrap">
                <Button
                  onClick={() => setPreviewOpen((prev) => !prev)}
                  className="px-4 h-11 rounded-xl bg-[#1b3a2d] hover:bg-[#153024] text-white"
                >
                  {previewOpen ? "Hide Preview" : "Show Preview"}
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="px-8 h-11 rounded-xl bg-[#1b3a2d] hover:bg-[#153024] text-white"
                >
                  Submit Registration
                </Button>
              </div>
              {previewOpen && (
                <div className="mt-5 overflow-hidden rounded-2xl bg-[#f8faf9] p-4 text-sm">
                  {selectedClubsPreview.length ? (
                    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white text-sm">
                      <div className="grid grid-cols-2 gap-4 bg-[#f3f4f6] px-4 py-3 text-xs uppercase tracking-[0.12em] text-[#6b7280]">
                        <span>Subjects</span>
                        <span>Topic</span>
                      </div>
                      <div className="divide-y divide-[#e5e7eb] bg-white">
                        {selectedClubsPreview.map((item, index) => (
                          <div
                            key={`${item.domainName}-${item.club.name}`}
                            className={cn(
                              "grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 px-4 py-3 text-sm text-[#1b3a2d]",
                              index === selectedClubsPreview.length - 1
                                ? "border-b-2 border-slate-500"
                                : "border-b border-slate-300",
                            )}
                          >
                            <span className={item.showDomainName ? "font-semibold" : "text-[#6b7280]"}>
                              {item.showDomainName ? item.domainName : ""}
                            </span>
                            <span className="flex flex-col gap-2">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e2e8f0] text-xs font-semibold text-[#1b3a2d]">
                                  {item.position}
                                </span>
                                <span>{item.club.parentName ? `${item.club.parentName} → ${item.club.name}` : item.club.name}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => moveClub(index, -1)}
                                  disabled={index === 0}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:border-slate-400"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveClub(index, 1)}
                                  disabled={index === selectedClubsPreview.length - 1}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:border-slate-400"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </button>
                              </div>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#6b7280]">No Topic selected yet.</p>
                  )}
                </div>
              )}
            </div>

            {/* Confirmation Dialog */}
            <Dialog
              open={confirmationDialogState !== null}
              onOpenChange={(open) => !open && setConfirmationDialogState(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {confirmationDialogState === "confirm" ? "Confirm Submission" : "Action Required"}
                  </DialogTitle>
                  <DialogDescription>
                    {confirmationDialogState === "confirm"
                      ? "No changes can be done once submitted. Are you sure you want to submit?"
                      : !isStudentFilled
                        ? "Please fill in all student details (Scholar No., Name, Father's Name, Grade, Section) before submitting."
                        : "Please select a topic before submitting."}
                  </DialogDescription>
                  {submitError && (
                    <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {submitError}
                    </div>
                  )}
                </DialogHeader>
                <DialogFooter>
                  {confirmationDialogState === "confirm" ? (
                    <>
                      <DialogClose asChild>
                        <Button className="px-6 h-11 rounded-xl bg-[#f3f4f6] text-[#1b3a2d] hover:bg-[#e5e7eb]">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={handleConfirmSubmit}
                        disabled={submitting}
                        className="px-6 h-11 rounded-xl bg-[#1b3a2d] hover:bg-[#153024] text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? "Submitting..." : "Confirm"}
                      </Button>
                    </>
                  ) : (
                    <DialogClose asChild>
                      <Button className="px-6 h-11 rounded-xl bg-[#1b3a2d] hover:bg-[#153024] text-white">
                        OK
                      </Button>
                    </DialogClose>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Max Dialog */}
            <Dialog open={maxDialogOpen} onOpenChange={setMaxDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Maximum reached</DialogTitle>
                  <DialogDescription>
                    You have reached the maximum of {maxSelections} Topic{maxSelections > 1 ? "s" : ""} selection. Remove one to add another.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button className="px-6 h-11 rounded-xl bg-[#1b3a2d] hover:bg-[#153024] text-white">
                      OK
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="pb-14 pt-6 px-4" style={{ backgroundColor: "#1A5C2A" }}>
      <div className="mx-auto max-w-4xl flex flex-col items-center text-center gap-3">
        <img
          src={schoolLogo}
          alt="Wisdom Council"
          className="h-16 w-16 rounded-full object-cover"
        />
        <div>
          <h1 className="text-3xl font-bold text-white">Wisdom Council</h1>
        </div>
        <p className="text-xs text-white">Developed by Okie Dokie</p>
      </div>
    </div>
  );
}
