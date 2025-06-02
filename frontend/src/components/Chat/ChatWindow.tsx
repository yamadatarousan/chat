import React, { useEffect, useRef, useState } from 'react';
import { 
	Box, 
	Paper, 
	Typography, 
	TextField, 
	Button, 
	List, 
	ListItem, 
	Divider,
	Alert,
	Container,
	Card,
	CardContent,
	AppBar,
	Toolbar,
	IconButton
} from '@mui/material';
import { Send as SendIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { getMessages } from '../../services/api';
import { connectWebSocket, disconnectWebSocket, sendMessage, onMessage, onAuth, onError } from '../../services/websocket';
import { useNavigate } from 'react-router-dom';

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

export const ChatWindow: React.FC = () => {
	const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const socketRef = useRef<WebSocket | null>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		// 認証チェック
		if (!isAuthenticated || !token) {
			navigate('/login');
			return;
		}

		const initializeChat = async () => {
			try {
				setLoading(true);
				setError(null);

				// メッセージ履歴の取得
				console.log('Fetching message history...');
				const history = await getMessages();
				console.log('Fetched messages:', history);
				setMessages(history || []);

				// WebSocket接続の確立
				console.log('Connecting to WebSocket...');
				const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
				const socket = connectWebSocket(formattedToken);
				
				if (socket) {
					socketRef.current = socket;
					setConnectionStatus('Connecting...');

					// WebSocketイベントリスナーの設定
					onAuth((user) => {
						console.log('WebSocket authentication successful:', user);
						setConnectionStatus('Connected & Authenticated');
					});

					onMessage((message: ChatMessage) => {
						console.log('Received new message via WebSocket:', message);
						setMessages(prev => {
							// 楽観的アップデートしたメッセージがある場合は置き換え
							const filteredMessages = prev.filter(m => 
								!(typeof m.id === 'number' && m.id > 1000000000000) // 一時的なIDを除去
							);
							
							// 重複チェック（実際のメッセージIDで）
							if (filteredMessages.find(m => m.id === message.id)) {
								return prev;
							}
							
							return [...filteredMessages, message];
						});
					});

					onError((error: string) => {
						console.error('WebSocket error:', error);
						setError(error);
						setConnectionStatus('Error');
					});

					// 接続状態の監視
					if (socket.readyState === WebSocket.CONNECTING) {
						setConnectionStatus('Connecting...');
					} else if (socket.readyState === WebSocket.OPEN) {
						setConnectionStatus('Connected');
					}

					console.log('WebSocket connected successfully');
				} else {
					throw new Error('Failed to connect to WebSocket');
				}

			} catch (err: any) {
				console.error('Chat initialization error:', err);
				setError(err.message || 'Failed to initialize chat');
			} finally {
				setLoading(false);
			}
		};

		initializeChat();

		return () => {
			disconnectWebSocket();
			socketRef.current = null;
		};
	}, [token, isAuthenticated, navigate]);

	const handleSendMessage = async () => {
		if (!newMessage.trim() || !socketRef.current) return;

		const messageContent = newMessage.trim();
		const tempId = Math.floor(Math.random() * 1000000000000) + 1000000000000; // 一時的なID
		setNewMessage(''); // 入力をすぐにクリア

		try {
			setError(null);
			
			// 楽観的アップデート：即座にメッセージを表示
			const tempMessage: ChatMessage = {
				id: tempId,
				content: messageContent,
				user: {
					id: 0,
					username: 'You' // 送信者として表示
				},
				created_at: new Date().toISOString(),
				user_id: 0
			};
			
			setMessages(prev => [...prev, tempMessage]);
			
			// WebSocketでメッセージを送信
			const success = sendMessage(messageContent);
			if (!success) {
				throw new Error('Failed to send message via WebSocket');
			}
			console.log('Message sent via WebSocket:', messageContent);
			
		} catch (err: any) {
			console.error('Message send error:', err);
			setError('Failed to send message');
			// エラーの場合、楽観的に追加したメッセージを削除
			setMessages(prev => prev.filter(m => m.id !== tempId));
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleLogout = () => {
		disconnectWebSocket();
		dispatch(logout());
		navigate('/login');
	};

	const formatDate = (dateString: string) => {
		if (!dateString || dateString === '0001-01-01T00:00:00Z') {
			return 'Just now';
		}
		try {
			const date = new Date(dateString);
			return date.toLocaleString('ja-JP', {
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return 'Invalid date';
		}
	};

	if (loading) {
		return (
			<Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography>Loading chat...</Typography>
			</Container>
		);
	}

	return (
		<Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
			{/* ヘッダー */}
			<AppBar position="static">
				<Toolbar>
					<Typography variant="h6" sx={{ flexGrow: 1 }}>
						Chat Application
					</Typography>
					<Typography variant="body2" sx={{ mr: 2, opacity: 0.8 }}>
						Status: {connectionStatus}
					</Typography>
					<IconButton color="inherit" onClick={handleLogout}>
						<LogoutIcon />
					</IconButton>
				</Toolbar>
			</AppBar>

			{/* メインコンテンツ */}
			<Container maxWidth="lg" sx={{ flex: 1, py: 2, display: 'flex', flexDirection: 'column' }}>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				<Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
					<CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
						{/* メッセージリスト */}
						<Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
							{messages.length === 0 ? (
								<Typography color="text.secondary" align="center">
									No messages yet. Start the conversation!
								</Typography>
							) : (
								<List>
									{messages.map((message, index) => (
										<React.Fragment key={message.id || index}>
											<ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
												<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
													<Typography variant="subtitle2" color="primary">
														{message.user?.username || 'Unknown User'}
													</Typography>
													<Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
														{formatDate(message.created_at)}
													</Typography>
												</Box>
												<Paper sx={{ p: 2, bgcolor: 'grey.100', width: '100%' }}>
													<Typography variant="body1">
														{message.content}
													</Typography>
												</Paper>
											</ListItem>
											{index < messages.length - 1 && <Divider />}
										</React.Fragment>
									))}
								</List>
							)}
							<div ref={messagesEndRef} />
						</Box>

						{/* メッセージ入力 */}
						<Divider />
						<Box sx={{ p: 2 }}>
							<Box sx={{ display: 'flex', gap: 1 }}>
								<TextField
									fullWidth
									multiline
									maxRows={3}
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onKeyPress={handleKeyPress}
									placeholder="Type your message..."
									variant="outlined"
									size="small"
								/>
								<Button
									variant="contained"
									onClick={handleSendMessage}
									disabled={!newMessage.trim()}
									sx={{ minWidth: 'auto', px: 2 }}
								>
									<SendIcon />
								</Button>
							</Box>
						</Box>
					</CardContent>
				</Card>
			</Container>
		</Box>
	);
}; 