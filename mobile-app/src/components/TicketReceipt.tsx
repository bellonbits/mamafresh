
interface FieldPair {
  label: string;
  value: string;
}

interface TicketReceiptProps {
  icon?: string;
  title: string;
  subtitle: string;
  topFields: [FieldPair, FieldPair];
  secondField?: FieldPair;
  paymentTitle: string;
  paymentSubtitle: string;
  paymentIcon?: React.ReactNode;
  code: string;
  /** Page background color behind the ticket, used for the notch/scallop cutouts. */
  bgColor?: string;
}

/** Deterministic decorative barcode — bar widths derived from the code string, not a real scannable symbology. */
function BarcodeBars({ code }: { code: string }) {
  const chars = code.replace(/[^a-zA-Z0-9]/g, "") || "0";
  const bars = Array.from(chars).map((ch, i) => {
    const n = ch.charCodeAt(0);
    const width = 1 + (n % 3);
    return <span key={i} className="inline-block h-10 bg-gray-900" style={{ width: `${width}px`, marginRight: (n % 4 === 0) ? "2px" : "1px" }} />;
  });
  return <div className="flex items-end justify-center">{bars}</div>;
}

export default function TicketReceipt({
  icon = "🎉",
  title,
  subtitle,
  topFields,
  secondField,
  paymentTitle,
  paymentSubtitle,
  paymentIcon,
  code,
  bgColor = "#FFFDF7",
}: TicketReceiptProps) {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_18px_45px_rgba(7,55,41,0.12)]">
        {/* Header */}
        <div className="px-6 pb-6 pt-8 text-center">
          <div className="text-4xl">{icon}</div>
          <h1 className="mt-3 text-xl font-black text-gray-900">{title}</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{subtitle}</p>
        </div>

        {/* Perforated divider with side notches */}
        <div className="relative">
          <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full" style={{ backgroundColor: bgColor }} />
          <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full" style={{ backgroundColor: bgColor }} />
          <div className="mx-6 border-t border-dashed border-gray-200" />
        </div>

        {/* Details */}
        <div className="space-y-4 px-6 py-6 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{topFields[0].label}</p>
              <p className="mt-0.5 text-sm font-black text-gray-900">{topFields[0].value}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{topFields[1].label}</p>
              <p className="mt-0.5 text-sm font-black text-gray-900">{topFields[1].value}</p>
            </div>
          </div>

          {secondField && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{secondField.label}</p>
              <p className="mt-0.5 text-sm font-black text-gray-900">{secondField.value}</p>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-2xl bg-[#EAF7EE] p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#16A34A] shadow-xs">
              {paymentIcon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-gray-900">{paymentTitle}</p>
              <p className="text-[11px] text-gray-500">{paymentSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Perforated divider with side notches */}
        <div className="relative">
          <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full" style={{ backgroundColor: bgColor }} />
          <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full" style={{ backgroundColor: bgColor }} />
          <div className="mx-6 border-t border-dashed border-gray-200" />
        </div>

        {/* Barcode */}
        <div className="px-6 pb-2 pt-5">
          <BarcodeBars code={code} />
          <p className="mt-2 text-center text-[10px] font-semibold tracking-widest text-gray-500">{code}</p>
        </div>

        {/* Scalloped bottom edge */}
        <div className="relative flex h-4 justify-center gap-1 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="h-6 w-6 shrink-0 -translate-y-3 rounded-full" style={{ backgroundColor: bgColor }} />
          ))}
        </div>
      </div>
    </div>
  );
}
