import axios, { InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

const API_URL = 'http://localhost:8080/api';

// axiosのデフォルト設定
axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	const token = localStorage.getItem('token');
	if (token && config.headers) {
		// 既存のヘッダーを保持しながら、Authorizationヘッダーを設定
		const headers = new AxiosHeaders(config.headers);
		headers.set('Authorization', `Bearer ${token}`);
		config.headers = headers;
	}
	return config;
}, (error) => {
	return Promise.reject(error);
});

// レスポンスインターセプターを追加
axios.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// トークンが無効な場合、ローカルストレージから削除
			localStorage.removeItem('token');
			// ログインページにリダイレクト
			window.location.href = '/login';
		}
		return Promise.reject(error);
	}
);

interface AuthResponse {
	token: string;
}

interface Message {
	id: number;
	content: string;
	user_id: number;
	created_at: string;
	user: {
		id: number;
		username: string;
	};
}

export const register = async (username: string, email: string, password: string): Promise<AuthResponse> => {
	const response = await axios.post(`${API_URL}/auth/register`, { username, email, password });
	return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
	const response = await axios.post(`${API_URL}/auth/login`, { email, password });
	if (response.data.token) {
		localStorage.setItem('token', response.data.token);
	}
	return response.data;
};

export const getMessages = async (): Promise<Message[]> => {
	const response = await axios.get(`${API_URL}/messages`);
	return response.data;
};

export const sendMessage = async (content: string): Promise<Message> => {
	const response = await axios.post(`${API_URL}/messages`, { content });
	return response.data;
}; 