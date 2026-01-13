export function SpaStreamLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" opacity="0.1" />

      <path
        d="M 30 45 Q 50 25 70 45"
        stroke="url(#logoGradient)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      <path
        d="M 30 55 Q 50 35 70 55"
        stroke="url(#logoGradient)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />

      <circle cx="35" cy="45" r="3" fill="#3b82f6" />
      <circle cx="50" cy="32" r="3" fill="#06b6d4" />
      <circle cx="65" cy="45" r="3" fill="#3b82f6" />

      <path
        d="M 45 65 L 50 70 L 55 65"
        stroke="url(#logoGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="50" cy="50" r="6" fill="url(#logoGradient)" opacity="0.8" />
      <circle cx="50" cy="50" r="3" fill="white" />
    </svg>
  );
}

export function SpaStreamLogoWithText({
  className = "",
  showTagline = true
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SpaStreamLogo />
      <div>
        <h1 className="text-xl font-light text-slate-800">SpaStream</h1>
        {showTagline && <p className="text-xs text-slate-500">Practice Management</p>}
      </div>
    </div>
  );
}
