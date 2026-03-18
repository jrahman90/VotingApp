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
}

export function CandidatesList({
  panels,
  selection,
  setSelection,
}: CandidateListProps) {
  const positionOrder = Array.from(
    new Set(
      panels.flatMap((panel) =>
        panel.Candidates.map((candidateLink) => candidateLink.Candidate.position)
      )
    )
  ).sort((left, right) => left.localeCompare(right));

  return (
    <div className="mx-auto grid h-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {panels.map((panel) => {
        const panelCandidates = panel.Candidates.map((candidateLink) => {
          return candidateLink.Candidate;
        });

        return (
          <article
            key={panel.id}
            className="flex h-full min-h-0 flex-col items-start justify-between rounded-3xl p-4 shadow-lg"
            style={{
              backgroundColor: panel.panelColor,
              color: panel.textColor,
            }}
          >
            <div className="group relative">
              <div className="flex items-center gap-4">
                <img
                  src={panel.img}
                  alt={panel.panelName}
                  className="h-12 w-12 rounded-full object-cover bg-white/30"
                />
                <h3 className="text-lg font-semibold leading-5">
                  {panel.panelName}
                </h3>
              </div>
              <p className="mt-2 text-xs leading-5 opacity-90">
                Select one candidate for each office in this panel.
              </p>
            </div>
            <div className="mt-3 flex w-full flex-col gap-3">
              {positionOrder.map((position) => {
                const candidate = panelCandidates.find(
                  (panelCandidate) => panelCandidate.position === position
                );

                if (!candidate) {
                  return (
                    <div
                      key={`${panel.id}-${position}-empty`}
                      className="flex min-h-[72px] w-full items-center rounded-2xl border border-dashed border-white/35 bg-white/5 px-3 py-3"
                    >
                      <div className="text-xs leading-5 opacity-80">
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
                    className={`relative flex min-h-[72px] w-full items-center gap-x-3 rounded-2xl px-3 py-3 cursor-pointer transition-colors ${
                      isSelected ? "ring-2 ring-white bg-white/25" : "bg-white/10"
                    }`}
                    onClick={onSelect}
                  >
                    <img
                      src={candidate.img}
                      alt={candidate.name}
                      className="h-10 w-10 rounded-full object-cover bg-white/30"
                    />
                    <div className="text-sm leading-5">
                      <p className="font-semibold">
                        <span className="absolute inset-0" />
                        {candidate.name}
                      </p>
                      <p className="text-xs opacity-80">{candidate.position}</p>
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
