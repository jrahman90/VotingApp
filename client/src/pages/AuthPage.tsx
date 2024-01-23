export function AuthPage() {
  return (
    <div className="bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex justify-center">
        <div className="w-full max-w-xs">
          {/* REGISTER DEVICE */}
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-center mb-5 mt-16">
            Voting device
          </h2>
          <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                for="name"
              >
                Device name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                placeholder="Device name"
              />
            </div>
            <div className="flex justify-center">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
              >
                Continue
              </button>
            </div>
          </form>

          <p className="text-xl font-bold tracking-tight text-gray-900 sm:text-1xl text-center mb-5 mt-5">
            or
          </p>

          {/* ADMIN USER */}
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-center mb-5">
            Admin user
          </h2>
          <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                for="username"
              >
                Username
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="username"
                type="text"
                placeholder="Username"
              />
            </div>
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                for="password"
              >
                Password
              </label>
              <input
                className="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                placeholder="******************"
              />
              <p className="text-red-500 text-xs italic">
                Please choose a password.
              </p>
            </div>
            <div className="flex justify-center">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
