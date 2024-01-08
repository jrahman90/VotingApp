import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { TRPC_REACT } from "./utils/trpc";

function App() {
  const [count, setCount] = useState(0);

  const userQuery = TRPC_REACT.userById.useQuery(1);
  console.log("🚀 ~ file: App.tsx:11 ~ App ~ userQuery:", userQuery.data);
  const usersQuery = TRPC_REACT.userList.useQuery();
  console.log("🚀 ~ file: App.tsx:13 ~ App ~ usersQuery:", usersQuery.data);
  const userCreator = TRPC_REACT.userCreate.useMutation();

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={() => userCreator.mutate({ name: "seb" })}>
          create user
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
