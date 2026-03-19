import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { TRPC_REACT } from "../utils/trpc";

const DEFAULT_ELECTION_IMAGE =
  "https://placehold.co/1200x600/png?text=Election+Results";

interface ElectionDetails {
  id: number;
  name: string;
  img: string;
  Votes: {
    id: number;
    voterId: number;
    candidateId: number;
    votingId: number;
    deviceId: number;
  }[];
  Voters: {
    id: number;
    votingId: number;
    voterId: number;
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

interface CandidateResult {
  id: number;
  name: string;
  img: string;
  position: string;
  panelName: string;
  votes: number;
  percentage: number;
}

interface PositionResults {
  position: string;
  label: string;
  candidates: CandidateResult[];
}

interface ElectionResultsSummary {
  registeredVoters: number;
  ballotsCast: number;
  turnout: number;
  positions: PositionResults[];
  projections: {
    position: string;
    candidateName: string;
    votes: number;
    margin: number;
    percentage: number;
    winChance: number;
  }[];
}

export function ElectionResultsPage() {
  const params = useParams();
  const location = useLocation();
  const votingId = Number(params.votingId);
  const isPublicView = !location.pathname.startsWith("/admin");
  const [now, setNow] = useState(() => Date.now());
  const adminQuery = TRPC_REACT.voting.getById.useQuery(
    { votingId },
    {
      enabled: Number.isFinite(votingId) && !isPublicView,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      staleTime: 0,
    }
  );
  const publicQuery = TRPC_REACT.voting.getPublicResults.useQuery(
    { votingId },
    {
      enabled: Number.isFinite(votingId) && isPublicView,
    }
  );

  const data = isPublicView ? publicQuery.data : adminQuery.data;
  const isLoading = isPublicView ? publicQuery.isLoading : adminQuery.isLoading;
  const isError = isPublicView ? publicQuery.isError : adminQuery.isError;
  const election = data as ElectionDetails | null;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const nextHour = useMemo(() => {
    const date = new Date(now);
    date.setMinutes(0, 0, 0);
    date.setHours(date.getHours() + 1);
    return date.getTime();
  }, [now]);

  const msUntilNextHour = Math.max(0, nextHour - now);

  useEffect(() => {
    if (msUntilNextHour !== 0) {
      return;
    }

    window.location.reload();
  }, [msUntilNextHour]);

  const refreshCountdown = useMemo(() => {
    const totalSeconds = Math.floor(msUntilNextHour / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }, [msUntilNextHour]);

  const getWinChance = (
    leaderVotes: number,
    runnerUpVotes: number,
    ballotsCast: number,
    leaderPercentage: number,
    candidateCount: number
  ) => {
    if (ballotsCast === 0 || leaderVotes === 0) {
      return 0;
    }

    if (candidateCount <= 1) {
      return 99;
    }

    const marginPercentage = ((leaderVotes - runnerUpVotes) / ballotsCast) * 100;
    const score =
      50 +
      marginPercentage * 2 +
      Math.max(0, leaderPercentage - 33) * 0.6;

    return Math.max(50, Math.min(99, Math.round(score * 10) / 10));
  };

  const results = useMemo<ElectionResultsSummary | null>(() => {
    if (!election) {
      return null;
    }

    const uniqueVotersWhoVoted = new Set(election.Votes.map((vote) => vote.voterId));
    const ballotsCast = uniqueVotersWhoVoted.size;
    const registeredVoters = election.Voters.length;
    const turnout =
      registeredVoters === 0
        ? 0
        : Math.round((ballotsCast / registeredVoters) * 1000) / 10;

    const candidates = election.Panels.flatMap((panel) =>
      panel.Candidates.map((candidateLink) => ({
        id: candidateLink.Candidate.id,
        name: candidateLink.Candidate.name,
        img: candidateLink.Candidate.img,
        position: candidateLink.Candidate.position,
        panelName: panel.panelName,
      }))
    );

    const uniquePositions = Array.from(
      new Set(candidates.map((candidate) => candidate.position))
    ).sort((left, right) => left.localeCompare(right));

    const positions = uniquePositions.map((position) => {
      const candidatesForPosition = candidates
        .filter((candidate) => candidate.position === position)
        .map((candidate) => {
          const votes = election.Votes.filter(
            (vote) => vote.candidateId === candidate.id
          ).length;

          return {
            ...candidate,
            votes,
            percentage:
              ballotsCast === 0 ? 0 : Math.round((votes / ballotsCast) * 1000) / 10,
          };
        })
        .sort((left, right) => {
          if (right.votes !== left.votes) {
            return right.votes - left.votes;
          }

          return left.name.localeCompare(right.name);
        });

      return {
        position,
        label: position,
        candidates: candidatesForPosition,
      };
    });

    const projections = positions
      .map((position) => {
        const leader = position.candidates[0];
        const runnerUp = position.candidates[1];

        if (!leader || leader.votes === 0) {
          return null;
        }

        return {
          position: position.label,
          candidateName: leader.name,
          votes: leader.votes,
          margin: leader.votes - (runnerUp?.votes || 0),
          percentage: leader.percentage,
          winChance: getWinChance(
            leader.votes,
            runnerUp?.votes || 0,
            ballotsCast,
            leader.percentage,
            position.candidates.length
          ),
        };
      })
      .filter(
        (
          projection
        ): projection is {
          position: string;
          candidateName: string;
          votes: number;
          margin: number;
          percentage: number;
          winChance: number;
        } => !!projection
      );

    return {
      registeredVoters,
      ballotsCast,
      turnout,
      positions,
      projections,
    };
  }, [election]);

  if (isLoading) {
    return <p className="py-10 text-center text-gray-600">Loading results...</p>;
  }

  if (isError || !election || !results) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-600">
          {isPublicView
            ? "Public results are not published yet. Try again in a moment."
            : "Unable to load election results."}
        </p>
        {!isPublicView && (
          <Link className="mt-4 inline-block text-blue-600" to="/admin">
            Back to admin
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4">
      <div className="mx-auto flex max-w-7xl flex-col px-4 lg:px-6">
        <div className="overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
          <div
            className="relative overflow-hidden px-5 py-5 lg:px-8 lg:py-6"
            style={{
              backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.88)), url(${
                election.img || DEFAULT_ELECTION_IMAGE
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
                  {isPublicView ? "Public Election Results" : "Election Results"}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">
                  {election.name}
                </h1>
                {isPublicView && (
                  <p className="mt-1 text-sm text-slate-300">
                    Next update in {refreshCountdown}.
                  </p>
                )}
                {!isPublicView && (
                  <p className="mt-1 text-sm text-slate-300">
                    Next hourly refresh in {refreshCountdown}.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {!isPublicView && (
                  <>
                    <Link
                      to={`/admin/elections/${election.id}/voters`}
                      className="rounded bg-white/15 px-4 py-2 font-semibold text-white backdrop-blur-sm"
                    >
                      Open voter roster
                    </Link>
                    <Link
                      to={`/admin/elections/${election.id}/ballots`}
                      className="rounded bg-violet-600 px-4 py-2 font-semibold text-white"
                    >
                      Print cast ballots
                    </Link>
                    <Link
                      to="/admin"
                      className="rounded bg-white px-4 py-2 font-semibold text-slate-900"
                    >
                      Back to admin
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">
                  Registered Voters
                </p>
                <p className="mt-1 text-xl font-bold">{results.registeredVoters}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">
                  Ballots Cast
                </p>
                <p className="mt-1 text-xl font-bold">{results.ballotsCast}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">
                  Turnout
                </p>
                <p className="mt-1 text-xl font-bold">{results.turnout}%</p>
              </div>
            </div>
          </div>
        </div>

        {results.ballotsCast === 0 && (
          <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="relative px-6 py-10 sm:px-8 sm:py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_34%)]" />
              <div className="relative mx-auto max-w-3xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white shadow-lg">
                  0
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                  Awaiting first ballot
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Election Has Not Started
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  No ballots have been recorded for this election yet. Results
                  will appear here automatically once voting begins.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                    Registered voters: {results.registeredVoters}
                  </div>
                  <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                    Published results update hourly
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {results.ballotsCast > 0 && (
          <>
        <div className="mt-4 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Chance To Win</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Unofficial
            </span>
          </div>
          {results.projections.length === 0 ? (
            <p className="text-sm text-slate-500">
              No estimates yet. Win chance will appear once votes come in.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {results.projections.map((projection) => (
                <div
                  key={projection.position}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    Current Leader
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {projection.position}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {projection.candidateName}
                  </p>
                  <p className="mt-2 text-xl font-bold text-emerald-700">
                    {projection.winChance}%
                  </p>
                  <p className="text-xs font-semibold text-slate-600">
                    estimated chance to win
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    {projection.votes} votes
                  </p>
                  <p className="text-xs text-slate-600">
                    {projection.percentage}% of ballots cast
                  </p>
                  <p className="text-xs text-slate-600">
                    Lead margin: {projection.margin}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-3">
          {results.positions.map((group) => (
            <section
              key={group.position}
              className="flex min-h-0 flex-col rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{group.label}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {group.candidates.length} candidates
                </span>
              </div>

              {group.candidates.length === 0 ? (
                <p className="text-slate-500">No candidates added for this position.</p>
              ) : (
                <div className="flex min-h-0 flex-col gap-2">
                  {group.candidates.map((candidate, index) => (
                    <div
                      key={candidate.id}
                      className={`rounded-2xl border p-3 ${
                        index === 0
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            candidate.img ||
                            "https://placehold.co/120x120/png?text=Candidate"
                          }
                          alt={candidate.name}
                          className={`object-cover ring-1 ring-slate-200 ${
                            index === 0
                              ? "h-10 w-10 rounded-xl"
                              : "h-8 w-8 rounded-lg"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {candidate.name}
                            </p>
                            {index === 0 && candidate.votes > 0 && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                                Leading
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-slate-500">
                            {candidate.panelName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {candidate.votes}
                          </p>
                          <p className="text-xs text-slate-500">
                            {candidate.percentage}%
                          </p>
                        </div>
                      </div>
                      <div
                        className={`mt-2 overflow-hidden rounded-full ${
                          index === 0 ? "h-2 bg-white" : "h-1.5 bg-slate-200"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full transition-all ${
                            index === 0 ? "bg-blue-600" : "bg-slate-500"
                          }`}
                          style={{ width: `${Math.max(candidate.percentage, 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
