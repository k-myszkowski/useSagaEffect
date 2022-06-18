import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { take, useSagaEffect } from './hooks/useSagaEffect/useSagaEffect';
import { useEffect } from 'react';

function App() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [c, setC] = useState(false);
  const [d, setD] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setA(true);
    }, 100);

    setTimeout(() => {
      setA(false);
    }, 400);

    setTimeout(() => {
      setA(true);
    }, 700);
  }, [])

  useSagaEffect(function* () {
    while(true) {
      yield take('a');
      console.log('A')
      setC(!c)
      yield take('b');
      console.log('B')
      setD(!d)
    }
  }, {
    a,
    b,
  })

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
