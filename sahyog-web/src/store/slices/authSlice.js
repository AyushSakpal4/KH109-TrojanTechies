import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null, // { id, email, role, created_at, last_login_at } from /api/users/me
  isProfileLoaded: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setProfile(state, action) {
      state.profile = action.payload;
      state.isProfileLoaded = true;
    },
    clearProfile(state) {
      state.profile = null;
      state.isProfileLoaded = false;
    },
  },
});

export const { setProfile, clearProfile } = authSlice.actions;
export default authSlice.reducer;

export const selectProfile = (state) => state.auth.profile;
export const selectRole = (state) => state.auth.profile?.role ?? null;
export const selectIsAdmin = (state) => state.auth.profile?.role === 'org:admin';
