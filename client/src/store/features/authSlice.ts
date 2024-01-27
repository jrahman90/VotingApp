import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

// Define a type for the slice state
interface AuthState {
  type: "staff" | "device" | undefined;
  email: string | undefined;
  deviceName: string | undefined;
  deviceId: number | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
}

// Define the initial state using that type
const initialState: AuthState = {
  type: undefined,
  email: undefined,
  deviceId: undefined,
  deviceName: undefined,
  metadata: undefined,
};

export const counterSlice = createSlice({
  name: "auth",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    logout: (state) => {
      state.type = undefined;
      state.email = undefined;
      state.deviceName = undefined;
      state.deviceId = undefined;
      state.metadata = undefined;
    },
    loginStaff: (
      state,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      action: PayloadAction<{ email: string; metadata: any }>
    ) => {
      state.email = action.payload.email;
      state.metadata = action.payload.metadata;
    },
    registerDevice: (
      state,
      action: PayloadAction<{
        deviceId: number;
        deviceName: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: any;
      }>
    ) => {
      state.deviceId = action.payload.deviceId;
      state.deviceName = action.payload.deviceName;
      state.metadata = action.payload.metadata;
    },
  },
});

export const { loginStaff, registerDevice, logout } = counterSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectAuth = (state: RootState) => state.auth;

export default counterSlice.reducer;
