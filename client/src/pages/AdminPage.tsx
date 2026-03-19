import { useNavigate, useSearchParams } from "react-router-dom";
import { logout } from "../store/features/authSlice";
import { useAppDispatch } from "../store/store";
import Devices from "../components/Devices";
import { useState } from "react";
import Votings from "../components/Votings";

export function AdminPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") === "votings" ? "votings" : "devices";
  const initialElectionId = Number(searchParams.get("electionId"));

  const [activeTab, setActiveTab] = useState<"devices" | "votings">(initialTab);

  const onLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const onChangeTab = (tab: "devices" | "votings") => {
    setActiveTab(tab);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tab);
    if (tab !== "votings") {
      nextParams.delete("electionId");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const tabOptions: Array<{
    key: "devices" | "votings";
    label: string;
    description: string;
  }> = [
    {
      key: "devices",
      label: "Devices",
      description: "Approve, assign, and manage live voting stations.",
    },
    {
      key: "votings",
      label: "Elections",
      description: "Configure panels, rosters, operators, and results.",
    },
  ];

  return (
    <div className="bg-slate-50 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Admin Control Center
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Welcome back
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Manage election devices, voter check-in, ballot setup, and published results from one workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center rounded-2xl bg-red-100 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-200"
            >
              Logout
            </button>
          </div>

          <div className="sticky top-4 z-20 mt-6 rounded-[1.75rem] border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
            <div className="grid gap-3 md:grid-cols-2">
              {tabOptions.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onChangeTab(tab.key)}
                    className={`rounded-[1.5rem] border px-5 py-4 text-left transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-lg font-semibold">{tab.label}</span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isActive ? "Open" : "View"}
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-sm leading-5 ${
                        isActive ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {tab.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <div
              className={`${
                activeTab === "devices" ? "block" : "hidden"
              } opacity-100 transition-opacity duration-150 ease-linear`}
              id="tabs-devices"
              role="tabpanel"
            >
              <Devices />
            </div>
            <div
              className={`${
                activeTab === "votings" ? "block" : "hidden"
              } opacity-100 transition-opacity duration-150 ease-linear`}
              id="tabs-votings"
            >
              <Votings
                initialSelectedElectionId={
                  Number.isFinite(initialElectionId) ? initialElectionId : null
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
