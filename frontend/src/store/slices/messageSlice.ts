import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
	id: number;
	content: string;
	user_id: number;
	user: {
		id: number;
		username: string;
	};
	created_at: string;
}

interface MessageState {
	messages: Message[];
}

const initialState: MessageState = {
	messages: []
};

const messageSlice = createSlice({
	name: 'messages',
	initialState,
	reducers: {
		setMessages: (state, action: PayloadAction<Message[]>) => {
			state.messages = action.payload;
		},
		addMessage: (state, action: PayloadAction<Message>) => {
			state.messages.push(action.payload);
		}
	}
});

export const { setMessages, addMessage } = messageSlice.actions;
export default messageSlice.reducer; 