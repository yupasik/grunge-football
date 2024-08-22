import React from 'react';
import { Helmet } from 'react-helmet';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Account from './components/Account';


function App() {
  return (
    <div className="App">
        <Helmet>
            <title>Win Bet Ball - Football Predictions</title>
            <meta name="description"
                  content="Join Win Bet Ball for exciting football predictions and compete with friends!"/>
            <meta property="og:title" content="Win Bet Ball - Football Predictions"/>
            <meta property="og:description"
                  content="Join Win Bet Ball for exciting football predictions and compete with friends!"/>
            <meta property="og:image" content="https://ibb.co/KXfPQFH"/>
            <meta property="og:url" content="https://win-bet-ball.ru/"/>
            <meta property="og:type" content="website"/>
            <meta name="twitter:card" content="summary_large_image"/>
            <meta name="twitter:title" content="Win Bet Ball - Football Predictions"/>
            <meta name="twitter:description"
                  content="Join Win Bet Ball for exciting football predictions and compete with friends!"/>
            <meta name="twitter:image" content="https://ibb.co/KXfPQFH"/>
            <meta name="yandex-verification" content="4d9471422d42b0ca"/>
        </Helmet>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/account" element={<Account />} />
        </Routes>
    </div>
  );
}

export default App;