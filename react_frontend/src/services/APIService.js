import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {

  signIn: (credentials) => api.post('/signin', credentials),
  signUp: (userData) => api.post('/signup', userData),
  signOut: () => {
    localStorage.removeItem('token');
  },
};

export const userService = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
};

export const gameService = {
  getGames: () => api.get('/games'),
  placeBet: (gameId, betData) => api.post(`/games/${gameId}/bets`, betData),
};

export const tournamentService = {
  getTournaments: () => api.get('/tournaments'),
  getTournamentDetails: (id) => api.get(`/tournaments/${id}`),
};

export default api;