interface CandidateRecord {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  img: string;
  position: string;
}

interface CandidateListProps {
  panels: {
    img: string;
    id: number;
    createdAt: string;
    updatedAt: string;
    Candidates: {
      id: number;
      createdAt: string;
      updatedAt: string;
      panelId: number;
      candidateId: number;
      Candidate: CandidateRecord;
    }[];
    panelName: string;
    panelColor: string;
    textColor: string;
    votingId: number | null;
  }[];
  selection: Record<string, number>;
  setSelection: (id: number, officeKey: string) => void;
  panelCount: number;
  officeSlots: {
    key: string;
    label: string;
    position: string;
    index: number;
  }[];
  compactLayout?: boolean;
  ultraCompactLayout?: boolean;
  microCompactLayout?: boolean;
}

export function CandidatesList({
  panels,
  selection,
  setSelection,
  panelCount,
  officeSlots,
  compactLayout = false,
  ultraCompactLayout = false,
  microCompactLayout = false,
}: CandidateListProps) {
  const compact = compactLayout || panelCount >= 4;
  const ultraCompact = ultraCompactLayout || panelCount >= 5;
  const microCompact = microCompactLayout;
  const gridColumnsClass =
    panelCount <= 1
      ? "grid-cols-1"
      : panelCount === 2
        ? "grid-cols-1 md:grid-cols-2"
        : panelCount === 3
          ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          : panelCount === 4
            ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
            : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5";

  return (
    <div
      className={`mx-auto grid w-full items-start gap-3 pr-1 ${gridColumnsClass}`}
    >
      {panels.map((panel) => {
        const panelCandidates = panel.Candidates.map((candidateLink) => candidateLink.Candidate);

        return (
          <article
            key={panel.id}
            className={`flex w-full flex-col items-start justify-start rounded-[1.6rem] shadow-lg ${
              microCompact ? "p-1.5" : ultraCompact ? "p-2" : compact ? "p-2.5" : "p-3"
            }`}
            style={{
              backgroundColor: panel.panelColor,
              color: panel.textColor,
            }}
          >
            <div className="group relative">
              <div
                className={`flex items-center ${
                  microCompact ? "gap-2" : ultraCompact ? "gap-2.5" : "gap-3"
                }`}
              >
                <img
                  src={panel.img}
                  alt={panel.panelName}
                  className={`rounded-full object-cover bg-white/30 ${
                    microCompact
                      ? "h-10 w-10"
                      : ultraCompact
                        ? "h-12 w-12"
                        : compact
                          ? "h-14 w-14"
                          : "h-16 w-16"
                  }`}
                />
                <h3
                  className={`font-semibold ${
                    microCompact
                      ? "text-[1.18rem] leading-5"
                      : ultraCompact
                        ? "text-[1.3rem] leading-5"
                        : compact
                          ? "text-[1.45rem] leading-6"
                          : "text-[1.6rem] leading-7"
                  }`}
                >
                  {panel.panelName}
                </h3>
              </div>
              {!microCompact && (
                <p
                  className={`opacity-90 ${
                    ultraCompact
                      ? "mt-1 text-[0.72rem] leading-3.5"
                      : compact
                        ? "mt-1 text-[0.82rem] leading-4"
                        : "mt-1.5 text-[0.92rem] leading-5"
                  }`}
                >
                  Select one candidate for each office in this panel.
                </p>
              )}
            </div>
            <div
              className={`mt-3 flex w-full flex-1 flex-col justify-start ${
                microCompact ? "gap-1" : ultraCompact ? "gap-1.5" : compact ? "gap-2.5" : "gap-3"
              }`}
            >
              {officeSlots.map((officeSlot) => {
                const candidate = panelCandidates[officeSlot.index];

                if (!candidate) {
                  return (
                    <div
                      key={`${panel.id}-${officeSlot.key}-empty`}
                      className={`flex w-full items-center rounded-2xl border border-dashed border-white/35 bg-white/5 ${
                        microCompact
                          ? "min-h-[42px] px-1.5 py-1"
                        : ultraCompact
                            ? "min-h-[48px] px-2 py-1.5"
                            : compact
                              ? "min-h-[60px] px-2.5 py-2"
                              : "min-h-[76px] px-4 py-3"
                      }`}
                    >
                      <div
                        className={`opacity-80 ${
                          microCompact
                            ? "text-[0.68rem] leading-3.5"
                            : ultraCompact
                              ? "text-[0.74rem] leading-4"
                              : compact
                                ? "text-[0.84rem] leading-4"
                                : "text-[0.95rem] leading-5"
                        }`}
                      >
                        <p className="font-semibold">{officeSlot.label}</p>
                        <p>No candidate for this office</p>
                      </div>
                    </div>
                  );
                }
                const onSelect = () => {
                  setSelection(candidate.id, officeSlot.key);
                };
                const isSelected = selection[officeSlot.key] === candidate.id;

                return (
                  <div
                    key={`${panel.id}-${officeSlot.key}-${candidate.id}`}
                    className={`relative flex w-full cursor-pointer items-center rounded-2xl transition-colors ${
                      microCompact
                        ? "min-h-[42px] gap-x-1.5 px-1.5 py-1"
                        : ultraCompact
                          ? "min-h-[48px] gap-x-2 px-2 py-1.5"
                          : compact
                            ? "min-h-[60px] gap-x-2.5 px-2.5 py-2"
                            : "min-h-[76px] gap-x-3 px-4 py-3"
                    } ${
                      isSelected ? "ring-2 ring-white bg-white/25" : "bg-white/10"
                    }`}
                    onClick={onSelect}
                  >
                    <img
                      src={candidate.img}
                      alt={candidate.name}
                      className={`rounded-full object-cover bg-white/30 ${
                        microCompact
                          ? "h-12 w-12"
                          : ultraCompact
                            ? "h-14 w-14"
                            : compact
                              ? "h-16 w-16"
                              : "h-20 w-20"
                      }`}
                    />
                    <div
                      className={`${
                        microCompact
                          ? "text-[1.1rem] leading-5"
                        : ultraCompact
                          ? "text-[1.22rem] leading-5"
                          : compact
                            ? "text-[1.35rem] leading-6"
                            : "text-[1.48rem] leading-6"
                      }`}
                    >
                      <p
                        className={`font-semibold ${
                          microCompact
                            ? "text-[1.18rem]"
                            : ultraCompact
                              ? "text-[1.3rem]"
                              : compact
                                ? "text-[1.45rem]"
                                : "text-[1.62rem]"
                        }`}
                      >
                        <span className="absolute inset-0" />
                        {candidate.name}
                      </p>
                      <p
                        className={`mt-0.5 font-medium uppercase tracking-[0.08em] opacity-90 ${
                          microCompact
                            ? "text-[0.9rem]"
                            : ultraCompact
                              ? "text-[1rem]"
                              : compact
                                ? "text-[1.08rem]"
                                : "text-[1.18rem]"
                        }`}
                      >
                        {officeSlot.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}
