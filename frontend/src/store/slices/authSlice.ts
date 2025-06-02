import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
	token: string | null;
	isAuthenticated: boolean;
	user: { id: number; username: string; email: string } | null;
}

const initialState: AuthState = {
	token: localStorage.getItem('token'),
	isAuthenticated: !!localStorage.getItem('token'),
	user: null
};

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setToken: (state, action: PayloadAction<string | null>) => {
			state.token = action.payload;
			state.isAuthenticated = !!action.payload;
			if (action.payload) {
				localStorage.setItem('token', action.payload);
			} else {
				localStorage.removeItem('token');
			}
		},
		logout: (state) => {
			state.token = null;
			state.isAuthenticated = false;
			state.user = null;
			localStorage.removeItem('token');
		}
	}
});

export const { setToken, logout } = authSlice.actions;
export default authSlice.reducer; 