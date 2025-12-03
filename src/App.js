import React, { useState, useEffect } from "react";
import "./styles.css";
import { auth, db } from "./firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  serverTimestamp,
} from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [quote, setQuote] = useState("");
  const [journal, setJournal] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [savedQuotes, setSavedQuotes] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchFavorites(currentUser.uid);
        fetchJournalEntries(currentUser.uid);
        fetchSavedQuotes(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchQuote = async () => {
    try {
      const zenUrl = `https://zenquotes.io/api/random/bec3604d145eb9a8790a2b0b3044530a`;
      const fullUrl =
        "https://api.allorigins.win/get?url=" +
        encodeURIComponent(zenUrl + "?t=" + Date.now());
      const res = await fetch(fullUrl);
      if (!res.ok) throw new Error("Network response not ok");
      const wrapped = await res.json();
      const data = JSON.parse(wrapped.contents);
      const quoteObj = data[0];
      setQuote(`${quoteObj.q} — ${quoteObj.a}`);
      setCurrentQuote({
        quote: quoteObj.q,
        author: quoteObj.a,
      });
    } catch (err) {
      console.error("Error fetching quote:", err);
      setQuote("Failed to fetch quote. Please try again.");
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  const saveFavorite = async () => {
    if (!user) return alert("Please log in first!");
    await addDoc(collection(db, `users/${user.uid}/favorites`), {
      quote,
      createdAt: serverTimestamp(),
    });
    fetchFavorites(user.uid);
  };

  const saveJournal = async () => {
    if (!user) return alert("Please log in first!");
    await addDoc(collection(db, `users/${user.uid}/journals`), {
      quote,
      entry: journal,
      createdAt: serverTimestamp(),
    });
    setJournal("");
    fetchJournalEntries(user.uid);
    alert("Journal entry saved!");
  };

  const saveQuote = async () => {
    if (!user) return alert("Please log in first!");
    if (!currentQuote) return alert("No quote to save!");
    await addDoc(collection(db, `users/${user.uid}/savedQuotes`), {
      quote: currentQuote.quote,
      author: currentQuote.author,
      createdAt: serverTimestamp(),
    });
    fetchSavedQuotes(user.uid);
    alert("Quote saved!");
  };

  const fetchFavorites = async (uid) => {
    const favQuery = query(collection(db, `users/${uid}/favorites`));
    const snapshot = await getDocs(favQuery);
    const favs = snapshot.docs.map((doc) => doc.data().quote);
    setFavorites(favs);
  };

  const fetchJournalEntries = async (uid) => {
    const journalQuery = query(collection(db, `users/${uid}/journals`));
    const snapshot = await getDocs(journalQuery);
    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      quote: doc.data().quote,
      entry: doc.data().entry,
      createdAt: doc.data().createdAt?.toDate() || null,
    }));
    setJournalEntries(entries);
  };

  const fetchSavedQuotes = async (uid) => {
    const savedQuery = query(collection(db, `users/${uid}/savedQuotes`));
    const snapshot = await getDocs(savedQuery);
    const saved = snapshot.docs.map((doc) => ({
      id: doc.id,
      quote: doc.data().quote,
      author: doc.data().author,
    }));
    setSavedQuotes(saved);
  };

  const handleSignup = () =>
    createUserWithEmailAndPassword(auth, email, password).catch((e) =>
      alert(e.message)
    );

  const handleLogin = () =>
    signInWithEmailAndPassword(auth, email, password).catch((e) =>
      alert(e.message)
    );

  const handleLogout = () => signOut(auth);

  if (!user)
    return (
      <div className="app-container">
        <h2 className="app-title">Daily Quote Journal</h2>

        <input
          className="input-field"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div style={{ marginTop: "10px" }}>
          <button className="blue-button" onClick={handleLogin}>
            Log In
          </button>
          <button className="blue-button" onClick={handleSignup}>
            Sign Up
          </button>
        </div>
      </div>
    );

  return (
    <div className="app-container">
      <h2 className="app-title">Daily Quote Journal</h2>

      <div className="content-layout">
        <div className="left-side">
          <p className="quote-box">"{quote}"</p>

          <div className="button-row">
            <button className="blue-button" onClick={fetchQuote}>
              New Quote
            </button>
            <button className="blue-button" onClick={saveQuote}>
              ❤︎ Save Quote
            </button>
          </div>

          <textarea
            className="journal-textarea"
            placeholder="Write your thoughts..."
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
          />

          <button className="blue-button" onClick={saveJournal}>
            Save Journal Entry
          </button>

          <button className="logout-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>

        <div className="right-side">
          <h3 className="favorites-title">Past Journal Entries</h3>

          <ul className="favorites-list">
            {journalEntries.map((entry) => (
              <li key={entry.id} className="favorite-quote">
                {entry.createdAt && (
                  <div className="entry-date">
                    {entry.createdAt.toLocaleDateString()}
                  </div>
                )}
                <strong>Quote:</strong> "{entry.quote}" <br />
                <strong>Entry:</strong> {entry.entry}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="saved-section">
        <h3 className="saved-title">Saved Quotes</h3>

        <ul className="saved-list">
          {savedQuotes.length === 0 && <p>No saved quotes yet.</p>}
          {savedQuotes.map((q) => (
            <li key={q.id} className="saved-quote-item">
              "{q.quote}" — {q.author}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
