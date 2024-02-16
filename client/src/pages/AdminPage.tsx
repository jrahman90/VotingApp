import { useNavigate } from "react-router-dom";
import { logout } from "../store/features/authSlice";
import { useAppDispatch } from "../store/store";
import Devices from "../components/Devices";
import { useState } from "react";
import Votings from "../components/Votings";

export function AdminPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"devices" | "votings">("devices");

  const onLogout = () => {
    dispatch(logout());
    navigate("/");
  };
  return (
    <div className="bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          className="mx-auto max-w-7xl px-6 lg:px-8 flex-row justify-between border-b border-gray-200 pb-10"
          style={{ display: "flex" }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome back
          </h1>
          <button
            type="button"
            onClick={onLogout}
            className="bg-red-400 hover:bg-red-600 text-black font-bold py-2 px-4 rounded mr-4"
          >
            Logout
          </button>
        </div>

        <ul
          className="mb-5 flex list-none flex-row flex-wrap border-b-0 pl-0"
          role="tablist"
          data-te-nav-ref
        >
          <li
            role="presentation"
            className="flex-auto text-center"
            onClick={() => setActiveTab("devices")}
          >
            <a
              href="#tabs-devices"
              className={`my-2 block border-x-0 border-b-2 border-t-0 border-transparent px-7 pb-3.5 pt-4 text-xs font-medium uppercase leading-tight text-neutral-500 hover:isolate hover:border-transparent hover:bg-neutral-100 focus:isolate focus:border-transparent border-primary   ${
                activeTab === "devices" ? "text-blue-600" : "text-neutral-400"
              }`}
              data-te-toggle="pill"
              data-te-target="#tabs-home01"
              data-te-nav-active
              role="tab"
              aria-controls="tabs-home01"
              aria-selected="true"
            >
              Devices
            </a>
          </li>
          <li
            role="presentation"
            className="flex-auto text-center"
            onClick={() => setActiveTab("votings")}
          >
            <a
              href="#tabs-votings"
              className={`my-2 block border-x-0 border-b-2 border-t-0 border-transparent px-7 pb-3.5 pt-4 text-xs font-medium uppercase leading-tight text-neutral-500 hover:isolate hover:border-transparent hover:bg-neutral-100 focus:isolate focus:border-transparent border-primary   ${
                activeTab === "votings" ? "text-blue-600" : "text-neutral-400"
              }`}
              data-te-toggle="pill"
              data-te-target="#tabs-profile01"
              role="tab"
              aria-controls="tabs-profile01"
              aria-selected="false"
            >
              Votings
            </a>
          </li>
        </ul>

        <div className="mb-6">
          <div
            className={`${
              activeTab === "devices" ? "block" : "hidden"
            } opacity-100 transition-opacity duration-150 ease-linear`}
            id="tabs-devices"
            role="tabpanel"
            aria-labelledby="tabs-home-tab01"
            data-te-tab-active
          >
            <Devices />
          </div>
          <div
            className={`${
              activeTab === "votings" ? "block" : "hidden"
            } opacity-100 transition-opacity duration-150 ease-linear`}
            id="tabs-votings"
            role="tabpanel"
            aria-labelledby="tabs-profile-tab01"
          >
            <Votings />
          </div>
        </div>
      </div>
    </div>
  );
}
