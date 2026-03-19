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
  setSelection: (id: number, position: string) => void;
  panelCount: number;
  compactLayout?: boolean;
  ultraCompactLayout?: boolean;
  microCompactLayout?: boolean;
}

export function CandidatesList({
  panels,
  selection,
  setSelection,
  panelCount,
  compactLayout = false,
  ultraCompactLayout = false,
  microCompactLayout = false,
}: CandidateListProps) {
  const positionOrder = Array.from(
    new Set(
      panels.flatMap((panel) =>
        panel.Candidates.map((candidateLink) => candidateLink.Candidate.position)
      )
    )
  ).sort((left, right) => left.localeCompare(right));

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
      className={`mx-auto grid h-full w-full auto-rows-fr gap-3 ${gridColumnsClass}`}
    >
      {panels.map((panel) => {
        const panelCandidates = panel.Candidates.map((candidateLink) => {
          return candidateLink.Candidate;
        });

        return (
          <article
            key={panel.id}
            className={`flex h-full min-h-0 flex-col items-start justify-start rounded-[1.6rem] shadow-lg ${
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
                  microCompact ? "gap-1.5" : ultraCompact ? "gap-2" : "gap-2.5"
                }`}
              >
                <img
                  src={panel.img}
                  alt={panel.panelName}
                  className={`rounded-full object-cover bg-white/30 ${
                    microCompact
                      ? "h-6 w-6"
                      : ultraCompact
                        ? "h-7 w-7"
                        : compact
                          ? "h-9 w-9"
                          : "h-12 w-12"
                  }`}
                />
                <h3
                  className={`font-semibold ${
                    microCompact
                      ? "text-[0.82rem] leading-3.5"
                      : ultraCompact
                        ? "text-[0.92rem] leading-4"
                        : compact
                          ? "text-[1rem] leading-4"
                          : "text-[1.15rem] leading-5"
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
              {positionOrder.map((position) => {
                const candidate = panelCandidates.find(
                  (panelCandidate) => panelCandidate.position === position
                );

                if (!candidate) {
                  return (
                    <div
                      key={`${panel.id}-${position}-empty`}
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
                        <p className="font-semibold">{position}</p>
                        <p>No candidate in this panel</p>
                      </div>
                    </div>
                  );
                }

                const onSelect = () => {
                  setSelection(candidate.id, candidate.position);
                };
                const isSelected = selection[candidate.position] === candidate.id;

                return (
                  <div
                    key={candidate.id}
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
                          ? "h-7 w-7"
                          : ultraCompact
                            ? "h-8 w-8"
                            : compact
                              ? "h-10 w-10"
                              : "h-14 w-14"
                      }`}
                    />
                    <div
                      className={`${
                        microCompact
                          ? "text-[0.94rem] leading-4"
                        : ultraCompact
                            ? "text-[1.02rem] leading-4"
                            : compact
                              ? "text-[1.12rem] leading-4.5"
                              : "text-[1.18rem] leading-5"
                      }`}
                    >
                      <p
                        className={`font-semibold ${
                          microCompact
                            ? "text-[0.98rem]"
                          : ultraCompact
                              ? "text-[1.08rem]"
                              : compact
                                ? "text-[1.16rem]"
                                : "text-[1.26rem]"
                        }`}
                      >
                        <span className="absolute inset-0" />
                        {candidate.name}
                      </p>
                      <p
                        className={`mt-0.5 font-medium uppercase tracking-[0.08em] opacity-90 ${
                          microCompact
                            ? "text-[0.74rem]"
                          : ultraCompact
                              ? "text-[0.8rem]"
                              : compact
                                ? "text-[0.88rem]"
                                : "text-[1rem]"
                        }`}
                      >
                        {candidate.position}
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
