import { useState } from "react";
import { CandidateType, OnlineDeviceType } from "../../../server";
import { CandidatesList } from "../components/CandidatesList";
import { TRPC_REACT } from "../utils/trpc";
import React from "react";
import { useAppDispatch, useAppSelector } from "../store/store";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/features/authSlice";

const initialState = {
  President: 0,
  VicePresident: 0,
  Secretary: 0,
};

export function VotingPage() {
  const { device } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data, isError, isLoading } =
    TRPC_REACT.voting.getOneDetailed.useQuery();
  const { data: candidates } = TRPC_REACT.candidate.getAll.useQuery();

  const [devices, setDevices] = useState<OnlineDeviceType[]>([]);

  TRPC_REACT.device.getConnectedDevices.useSubscription(undefined, {
    onData(data) {
      console.log("🚀 ~ onData ~ data:", data);
      setDevices(data as unknown as OnlineDeviceType[]);
    },
    onError(err) {
      console.log("🚀 ~ onError ~ err:", err);
    },
  });

  const voterId = devices.find((d) => d.name === device?.name)?.voterId;

  const voteMutation = TRPC_REACT.vote.vote.useMutation({
    onError(error) {
      console.log("🚀  vote ~ onError ~ error:", error);
      alert(
        JSON.stringify({
          msg: error.message,
          code: error.data?.code,
          status: error.data?.httpStatus,
        })
      );
    },
    onSuccess(data) {
      console.log("🚀 ~ vote onSuccess ~ data:", data);
      alert("Success!");
      onClear();
    },
  });

  const logoutMutation = TRPC_REACT.device.unregister.useMutation({
    onError(error) {
      console.log("🚀 ~ logoutMutation onError ~ error:", error);
    },
    onSuccess(data) {
      console.log("🚀 ~ logoutMutation onSuccess ~ data:", data);
      dispatch(logout());
      navigate("/");
    },
  });

  const [selection, setSelection] = useState(initialState);

  const isEnabled = !!voterId;

  const onLogout = () => {
    logoutMutation.mutate({
      name: device?.name as string,
    });
  };

  const onVote = () => {
    if (
      selection["President"] === 0 ||
      selection["VicePresident"] === 0 ||
      selection["Secretary"] === 0
    ) {
      alert("You must select one candidate for all the positions");
      return;
    }
    console.log("🚀 ~ VotingPage ~ selection:", selection);
    voteMutation.mutate({
      deviceId: device?.id as number,
      voterId: voterId as number,
      votingId: data?.id as number,
      presidentId: selection.President,
      vicePresidentId: selection.VicePresident,
      secretaryId: selection.Secretary,
    });
  };
  const onClear = () => {
    setSelection(initialState);
  };
  const onSelection = (id: number, position: string) => {
    setSelection({ ...selection, [position]: id });
  };

  return (
    <div className="bg-white py-12 sm:py-14">
      {isLoading && (
        <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600 text-center">
          loading...
        </p>
      )}
      {isError && (
        <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600 text-center">
          error while fetching the data
        </p>
      )}
      {!isError && !isLoading && (
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <div className="flex flex-row justify-between">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {data?.name}
              </h1>
              <button
                type="button"
                onClick={onLogout}
                className="bg-red-400 hover:bg-red-600 text-black font-bold py-2 px-4 rounded mr-4"
              >
                Close
              </button>
            </div>
            <p className="tracking-tight text-gray-900 mt-3">
              Device name: <b>{device?.name}</b>
            </p>
            <p className="tracking-tight text-gray-900">
              Voter number: <b>{voterId ?? "null"}</b>
            </p>
          </div>
          {!isEnabled && (
            <div className="mx-auto mt-10 max-w-2xl border-t border-gray-200 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none">
              <p className="tracking-tight text-gray-900 text-center">
                Device not enabled. Please identify with your voter number
              </p>
            </div>
          )}
          {isEnabled && (
            <React.Fragment>
              <CandidatesList
                panels={data?.Panels || []}
                candidates={candidates as unknown as CandidateType[]}
                selection={selection}
                setSelection={onSelection}
              />
              <div className="w-full flex justify-center my-20">
                <button
                  className="bg-slate-200 hover:bg-slate-400 text-black font-bold py-2 px-4 rounded mr-4"
                  onClick={onClear}
                >
                  Clear
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={onVote}
                >
                  Vote
                </button>
              </div>
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );
}
