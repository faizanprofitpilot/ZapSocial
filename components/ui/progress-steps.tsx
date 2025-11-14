"use client";

interface ProgressStep {
  label: string;
  status: "pending" | "active" | "completed";
}

interface ProgressStepsProps {
  steps: ProgressStep[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2 flex-1">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step.status === "completed"
                  ? "bg-brand-500 border-brand-500 text-white"
                  : step.status === "active"
                  ? "border-brand-500 text-brand-400 animate-pulse"
                  : "border-gray-600 text-gray-500"
              }`}
            >
              {step.status === "completed" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                step.status === "active" ? "text-brand-400" : step.status === "completed" ? "text-gray-300" : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 transition-all ${
                step.status === "completed" ? "bg-brand-500" : "bg-gray-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

