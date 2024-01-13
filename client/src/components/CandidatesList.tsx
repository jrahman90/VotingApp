import type { CandidateType } from "../../../server";

interface CandidateListProps {
  candidates: CandidateType[];
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
    }[];
    panelName: string;
    panelColor: string;
    textColor: string;
    votingId: number | null;
  }[];
}

export function CandidatesList({ candidates, panels }: CandidateListProps) {
  return (
    <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-gray-200 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
      {panels.map((panel) => {
        const candidatesIds = panel.Candidates.map((c) => c.id);
        const panelCandidates = candidates.filter((c) =>
          candidatesIds.includes(c.id)
        );

        return (
          <article
            key={panel.id}
            className="flex max-w-xl flex-col items-start justify-between"
          >
            <div className="group relative">
              <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                <span className="absolute inset-0" />
                {panel.panelName}
              </h3>
              <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
                Illo sint voluptas. Error voluptates culpa eligendi. Hic vel
                totam vitae illo. Non aliquid explicabo necessitatibus unde. Sed
                exercitationem placeat consectetur nulla deserunt vel. Iusto
                corrupti dicta.
              </p>
            </div>
            {panelCandidates.map((pc) => (
              <div
                key={pc.id}
                className="relative mt-8 flex items-center gap-x-4 hover:bg-slate-200 px-4 rounded-l rounded cursor-pointer"
              >
                <img
                  src={panel.img}
                  alt=""
                  className="h-10 w-10 rounded-full bg-gray-50"
                />
                <div className="text-sm leading-6">
                  <p className="font-semibold text-gray-900">
                    <span className="absolute inset-0" />
                    {pc.name}
                  </p>
                  <p className="text-gray-600">{pc.position}</p>
                </div>
              </div>
            ))}
          </article>
        );
      })}
    </div>
  );
}
