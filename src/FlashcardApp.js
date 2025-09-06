import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import { motion } from "framer-motion";

export default function FlashcardApp() {
  const [data, setData] = useState([]);
  const [current, setCurrent] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const [cardCounter, setCardCounter] = useState(0);
  const [cardHistory, setCardHistory] = useState([]);

  const pickRandom = useCallback((arr = data, addToHistory = true) => {
    console.log("this is data: ", data)
    if (arr.length === 0) return;
    const random = arr[Math.floor(Math.random() * arr.length)];
    
    // Add current card to history before changing to new one
    if (addToHistory) {
      setCurrent(prevCurrent => {
        if (prevCurrent !== null) {
          setCardHistory(prev => [prevCurrent, ...prev.slice(0, 9)]); // Keep last 10 cards 
          setCardCounter(prev => prev + 1);
        }
        return random;
      });
    } else {
      setCurrent(random);
    }
    
    setShowAnswer(false);
  }, [data]);

    // Load CSV file
  useEffect(() => {
    Papa.parse("/flashcards.csv", {
      download: true,
      header: true,
      complete: (result) => {
        setData(result.data);
        if (result.data.length > 0) {
          const random = result.data[Math.floor(Math.random() * result.data.length)];
          setCurrent(random);
          setShowAnswer(false);
        }
      },
    });
  }, []); // Empty dependency array to only run once


  const goBackToPrevious = useCallback(() => {
    if (cardHistory.length > 0) {
      const previousCard = cardHistory[0];
      const remainingHistory = cardHistory.slice(1);
      
      setCardHistory(remainingHistory);
      setCurrent(previousCard);
      setShowAnswer(false);
      setCardCounter(prev => Math.max(0, prev - 1)); // Don't go below 0
    }
  }, [cardHistory]);

  // Keyboard listeners for Enter and Arrow keys
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") {
        pickRandom();
      } else if (e.key === "Enter") {
        setShowAnswer(!showAnswer);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pickRandom, showAnswer]);

  if (!current) return <p className="p-4 text-white">Loading...</p>;

  return (
    <div className="min-h-screen  flex flex-col items-center justify-center bg-gray-800 p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white text-center">Flashcard App</h1>
        <p className="text-gray-300 text-center mt-3">Click card or press Enter to reveal • → for next card</p>
        <div className="flex justify-center mt-4">
          <div className="bg-gray-700 px-6 py-2 rounded-full">
            <span className="text-white font-semibold">Cards Viewed: </span>
            <span className="text-blue-400 font-bold text-lg">{cardCounter}</span>
          </div>
        </div>
      </div>
      
      <motion.div
        className="cursor-pointer mb-12"
        onClick={() => setShowAnswer(!showAnswer)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="rounded-2xl shadow-2xl flex items-center justify-center text-center p-8 min-h-[200px] min-w-[320px] max-w-[600px]"
          animate={{ 
            backgroundColor: showAnswer ? "#10B981" : "#3B82F6"
          }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="text-white font-bold text-2xl leading-relaxed"
            key={showAnswer ? "answer" : "question"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {showAnswer 
              ? (reverseMode ? current.Question : current.Answer)
              : (reverseMode ? current.Answer : current.Question)
            }
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="flex flex-col items-center space-y-6">
        <div className="flex flex-wrap justify-center gap-4">
          <button 
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            {showAnswer ? '← Hide (Enter)' : '→ Reveal (Enter)'}
          </button>
          
          <button 
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
            onClick={() => pickRandom()}
          >
            ⏭ Next Card (→)
          </button>
          
          <button 
            className={`font-semibold py-4 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl ${
              reverseMode 
                ? 'bg-orange-500 hover:bg-orange-400 text-white' 
                : 'bg-gray-300 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setReverseMode(!reverseMode)}
            title={reverseMode ? "Disable reverse mode" : "Enable reverse mode"}
          >
            🔄 Reverse
          </button>
        </div>
        
        {cardHistory.length > 0 && (
          <button 
            className="text-gray-400 hover:text-gray-200 underline text-sm transition-colors duration-200"
            onClick={goBackToPrevious}
          >
            Go back to previous card ←
          </button>
        )}
        
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>Cards loaded: {data.length}</span>
          <span>•</span>
          <span>Current: {showAnswer ? "Answer" : "Question"}</span>
          <span>•</span>
          <span>Mode: {reverseMode ? "Reverse" : "Normal"}</span>
        </div>
      </div>
    </div>
  );
}

/*
📌 Notes:
1. Place your CSV file in `public/flashcards.csv` with headers:
   Question,Answer

2. Example CSV:
Question,Answer
"Capital of France?","Paris"
"2+2?","4"

3. Click the card to flip → shows answer.
4. Press Enter or click Next → loads new random card.
*/
