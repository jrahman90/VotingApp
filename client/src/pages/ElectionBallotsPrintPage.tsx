import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { TRPC_REACT } from "../utils/trpc";

interface ElectionDetails {
  id: number;
  name: string;
  img: string;
  Votes: {
    id: string;
    voterId: number;
    candidateId: number;
    votingId: number;
    deviceId: number;
  }[];
  Voters: {
    id: number;
    votingId: number;
    voterId: number;
    Voter: {
      id: number;
      voterId: number;
      firstAndMiddleName: string;
      lastName: string;
      streetAddress: string;
      city: string;
      state: string;
      phone: string;
      yob: number;
      permanentAddress: string;
      comments?: string | null;
    };
  }[];
  Panels: {
    id: number;
    panelName: string;
    Candidates: {
      id: number;
      candidateId: number;
      Candidate: {
        id: number;
        name: string;
        img: string;
        position: string;
      };
    }[];
  }[];
}

interface PrintedBallot {
  voterId: number;
  voterName: string;
  address: string;
  ballotSelections: {
    position: string;
    candidateName: string;
    panelName: string;
    candidateImg: string;
  }[];
}

export function ElectionBallotsPrintPage() {
  const params = useParams();
  const votingId = Number(params.votingId);

  const { data, isLoading, isError } = TRPC_REACT.voting.getById.useQuery(
    { votingId },
    {
      enabled: Number.isFinite(votingId),
      refetchOnWindowFocus: true,
    }
  );

  const election = data as ElectionDetails | null;

  const printedBallots = useMemo<PrintedBallot[]>(() => {
    if (!election) {
      return [];
    }

    const candidateLookup = new Map(
      election.Panels.flatMap((panel) =>
        panel.Candidates.map((candidateLink) => [
          candidateLink.Candidate.id,
          {
            candidateName: candidateLink.Candidate.name,
            position: candidateLink.Candidate.position,
            panelName: panel.panelName,
            candidateImg: candidateLink.Candidate.img,
          },
        ])
      )
    );

    const voterLookup = new Map(
      election.Voters.map((entry) => [
        entry.Voter.voterId,
        {
          voterName: `${entry.Voter.firstAndMiddleName} ${entry.Voter.lastName}`.trim(),
          address: `${entry.Voter.streetAddress}, ${entry.Voter.city}, ${entry.Voter.state}`,
        },
      ])
    );

    const groupedVotes = election.Votes.reduce<Map<number, ElectionDetails["Votes"]>>(
      (accumulator, vote) => {
        const existing = accumulator.get(vote.voterId) || [];
        existing.push(vote);
        accumulator.set(vote.voterId, existing);
        return accumulator;
      },
      new Map()
    );

    return Array.from(groupedVotes.entries())
      .map(([voterId, votes]) => {
        const voter = voterLookup.get(voterId);
        const ballotSelections = votes
          .map((vote) => candidateLookup.get(vote.candidateId))
          .filter(
            (
              value
            ): value is {
              position: string;
              candidateName: string;
              panelName: string;
              candidateImg: string;
            } => !!value
          )
          .sort((left, right) => left.position.localeCompare(right.position));

        return {
          voterId,
          voterName: voter?.voterName || `Voter ${voterId}`,
          address: voter?.address || "Address not available",
          ballotSelections,
        };
      })
      .sort((left, right) => left.voterId - right.voterId);
  }, [election]);

  if (isLoading) {
    return <p className="py-10 text-center text-gray-600">Loading ballots...</p>;
  }

  if (isError || !election) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-600">Unable to load cast ballots.</p>
        <Link className="mt-4 inline-block text-blue-600" to="/admin">
          Back to admin
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              Cast Ballots
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {election.name}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {printedBallots.length} ballots ready to print
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Print ballots
            </button>
            <Link
              to={`/admin/elections/${election.id}/results`}
              className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
            >
              Back to results
            </Link>
          </div>
        </div>

        <div className="mb-6 hidden print:block">
          <h1 className="text-3xl font-bold text-slate-900">{election.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Cast Ballots Report • {printedBallots.length} ballots
          </p>
        </div>

        {printedBallots.length === 0 ? (
          <div className="rounded-3xl bg-white px-8 py-12 text-center shadow-sm ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              No ballots
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              No cast ballots yet
            </h2>
            <p className="mt-3 text-slate-600">
              Once voters begin submitting ballots, they will appear here in a
              print-friendly report.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 print:block">
            {printedBallots.map((ballot, index) => (
              <article
                key={`${ballot.voterId}-${index}`}
                className="break-inside-avoid rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 print:mb-6 print:rounded-none print:p-0 print:shadow-none print:ring-0"
              >
                <div
                  className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white"
                  style={{
                    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.88)), url(${
                      election.img || "https://placehold.co/1200x600/png?text=Election"
                    })`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="flex items-center justify-between gap-4 px-6 py-5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                        Cast ballot
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-white">
                        {election.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-200">
                        Voter #{ballot.voterId} • {ballot.voterName}
                      </p>
                    </div>
                    <img
                      src={
                        election.img ||
                        "https://placehold.co/160x160/png?text=Election"
                      }
                      alt={election.name}
                      className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white/30"
                    />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Ballot details
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">
                      Voter #{ballot.voterId}
                    </h3>
                    <p className="mt-1 text-base text-slate-700">
                      {ballot.voterName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{ballot.address}</p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                    {ballot.ballotSelections.length} selections
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {ballot.ballotSelections.map((selection) => (
                    <div
                      key={`${ballot.voterId}-${selection.position}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            selection.candidateImg ||
                            "https://placehold.co/120x120/png?text=Candidate"
                          }
                          alt={selection.candidateName}
                          className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {selection.position}
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {selection.candidateName}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Panel: {selection.panelName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
