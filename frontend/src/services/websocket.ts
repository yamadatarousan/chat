interface ChatMessage {
	id: number;
	content: string;
	user: {
		id: number;
		username: string;
	};
	created_at: string;
	user_id: number;
}

interface AuthenticatedUser {
	id: number;
	username: string;
}

interface WebSocketMessage {
	type: string;
	data?: any;
	content?: string;
	token?: string;
}

let socket: WebSocket | null = null;
let currentUser: AuthenticatedUser | null = null;
let messageCallback: ((message: ChatMessage) => void) | null = null;
let authCallback: ((user: AuthenticatedUser) => void) | null = null;
let errorCallback: ((error: string) => void) | null = null;

export const connectWebSocket = (token: string): WebSocket | null => {
	console.log('WebSocket: Starting connection with token:', token.substring(0, 20) + '...');
	
	if (socket && socket.readyState === WebSocket.OPEN) {
		console.log('WebSocket: Socket already connected');
		return socket;
	}

	try {
		console.log('WebSocket: Connecting to ws://localhost:8080/ws...');
		
		socket = new WebSocket('ws://localhost:8080/ws');

		socket.onopen = () => {
			console.log('WebSocket: Connected successfully');
			// 接続が確実に確立してから認証メッセージを送信
			setTimeout(() => {
				if (socket && socket.readyState === WebSocket.OPEN) {
					const authMessage: WebSocketMessage = {
						type: 'auth',
						token: token
					};
					socket.send(JSON.stringify(authMessage));
					console.log('WebSocket: Authentication message sent');
				}
			}, 100); // 100ms待機
		};

		socket.onmessage = (event) => {
			try {
				const message: WebSocketMessage = JSON.parse(event.data);
				console.log('WebSocket: Received message:', message);

				switch (message.type) {
					case 'authenticated':
						console.log('WebSocket: Authentication successful:', message.data);
						currentUser = message.data.user;
						if (authCallback && currentUser) {
							authCallback(currentUser);
						}
						break;

					case 'new_message':
						console.log('WebSocket: New message received:', message.data);
						if (messageCallback) {
							messageCallback(message.data);
						}
						break;

					case 'error':
						console.error('WebSocket: Error received:', message.data);
						if (errorCallback) {
							errorCallback(message.data);
						}
						break;
				}
			} catch (error) {
				console.error('WebSocket: Failed to parse message:', error);
			}
		};

		socket.onclose = (event) => {
			console.log('WebSocket: Connection closed:', event.code, event.reason);
			currentUser = null;
			socket = null;
		};

		socket.onerror = (error) => {
			console.error('WebSocket: Connection error:', error);
			if (errorCallback) {
				errorCallback('Connection error');
			}
		};

		console.log('WebSocket: Client initialized successfully');
		return socket;
	} catch (error) {
		console.error('WebSocket: Failed to connect:', error);
		return null;
	}
};

export const disconnectWebSocket = () => {
	if (socket) {
		console.log('WebSocket: Disconnecting...');
		socket.close();
		socket = null;
		currentUser = null;
	}
};

export const sendMessage = (content: string): boolean => {
	if (!socket || socket.readyState !== WebSocket.OPEN) {
		console.error('WebSocket: Not connected');
		return false;
	}

	try {
		const message: WebSocketMessage = {
			type: 'message',
			content: content
		};
		socket.send(JSON.stringify(message));
		console.log('WebSocket: Message sent:', content);
		return true;
	} catch (error) {
		console.error('WebSocket: Failed to send message:', error);
		return false;
	}
};

export const onMessage = (callback: (message: ChatMessage) => void) => {
	messageCallback = callback;
};

export const onAuth = (callback: (user: AuthenticatedUser) => void) => {
	authCallback = callback;
};

export const onError = (callback: (error: string) => void) => {
	errorCallback = callback;
};

export const getCurrentUser = () => currentUser;
export const getSocket = () => socket; 