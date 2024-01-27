import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface IStaff {
  email: string;
  password: string;
  id: number;
  createdAt: string;
  updatedAt: string;
}

interface IDevice {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
}

// Define a type for the slice state
interface AuthState {
  type: "staff" | "device" | undefined;
  staff: IStaff | undefined;
  device: IDevice | undefined;
}

// Define the initial state using that type
const initialState: AuthState = {
  type: undefined,
  staff: undefined,
  device: undefined,
};

export const counterSlice = createSlice({
  name: "auth",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    logout: (state) => {
      state.type = undefined;
      state.staff = undefined;
      state.device = undefined;
    },
    loginStaff: (state, action: PayloadAction<{ staff: IStaff }>) => {
      state.type = "staff";
      state.staff = action.payload.staff;
    },
    registerDevice: (
      state,
      action: PayloadAction<{
        device: IDevice;
      }>
    ) => {
      state.type = "device";
      state.device = action.payload.device;
    },
  },
});

export const { loginStaff, registerDevice, logout } = counterSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectAuth = (state: RootState) => state.auth;

export default counterSlice.reducer;
