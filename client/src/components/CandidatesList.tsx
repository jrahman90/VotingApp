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
}

export function CandidatesList({
  panels,
  selection,
  setSelection,
  panelCount,
}: CandidateListProps) {
  const positionOrder = Array.from(
    new Set(
      panels.flatMap((panel) =>
        panel.Candidates.map((candidateLink) => candidateLink.Candidate.position)
      )
    )
  ).sort((left, right) => left.localeCompare(right));

  const compact = panelCount >= 4;
  const ultraCompact = panelCount >= 5;
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
            className={`flex h-full min-h-0 flex-col items-start justify-between rounded-3xl shadow-lg ${
              ultraCompact ? "p-2.5" : compact ? "p-3" : "p-4"
            }`}
            style={{
              backgroundColor: panel.panelColor,
              color: panel.textColor,
            }}
          >
            <div className="group relative">
              <div className={`flex items-center ${ultraCompact ? "gap-2" : "gap-3"}`}>
                <img
                  src={panel.img}
                  alt={panel.panelName}
                  className={`rounded-full object-cover bg-white/30 ${
                    ultraCompact ? "h-8 w-8" : compact ? "h-10 w-10" : "h-12 w-12"
                  }`}
                />
                <h3
                  className={`font-semibold ${
                    ultraCompact ? "text-sm leading-4" : compact ? "text-base leading-5" : "text-lg leading-5"
                  }`}
                >
                  {panel.panelName}
                </h3>
              </div>
              <p
                className={`opacity-90 ${
                  ultraCompact ? "mt-1 text-[10px] leading-4" : compact ? "mt-1.5 text-[11px] leading-4" : "mt-2 text-xs leading-5"
                }`}
              >
                Select one candidate for each office in this panel.
              </p>
            </div>
            <div className={`mt-3 flex w-full flex-col ${ultraCompact ? "gap-2" : "gap-3"}`}>
              {positionOrder.map((position) => {
                const candidate = panelCandidates.find(
                  (panelCandidate) => panelCandidate.position === position
                );

                if (!candidate) {
                  return (
                    <div
                      key={`${panel.id}-${position}-empty`}
                      className={`flex w-full items-center rounded-2xl border border-dashed border-white/35 bg-white/5 ${
                        ultraCompact
                          ? "min-h-[58px] px-2.5 py-2"
                          : compact
                            ? "min-h-[64px] px-3 py-2.5"
                            : "min-h-[72px] px-3 py-3"
                      }`}
                    >
                      <div
                        className={`opacity-80 ${
                          ultraCompact ? "text-[10px] leading-4" : "text-xs leading-5"
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
                      ultraCompact
                        ? "min-h-[58px] gap-x-2 px-2.5 py-2"
                        : compact
                          ? "min-h-[64px] gap-x-2.5 px-3 py-2.5"
                          : "min-h-[72px] gap-x-3 px-3 py-3"
                    } ${
                      isSelected ? "ring-2 ring-white bg-white/25" : "bg-white/10"
                    }`}
                    onClick={onSelect}
                  >
                    <img
                      src={candidate.img}
                      alt={candidate.name}
                      className={`rounded-full object-cover bg-white/30 ${
                        ultraCompact ? "h-8 w-8" : compact ? "h-9 w-9" : "h-10 w-10"
                      }`}
                    />
                    <div
                      className={`${
                        ultraCompact ? "text-xs leading-4" : "text-sm leading-5"
                      }`}
                    >
                      <p
                        className={`font-semibold ${
                          ultraCompact ? "text-xs" : compact ? "text-sm" : ""
                        }`}
                      >
                        <span className="absolute inset-0" />
                        {candidate.name}
                      </p>
                      <p
                        className={`opacity-80 ${
                          ultraCompact ? "text-[10px]" : "text-xs"
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
