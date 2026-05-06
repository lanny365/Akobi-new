import { useState } from 'react';
import { Volume2 } from 'lucide-react';

interface FlashcardProps {
  word: string;
  definition: string;
  example: string;
  pronunciation: string;
}

export function Flashcard({ word, definition, example, pronunciation }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handlePronunciation = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000">
      <div
        className={`relative w-full h-96 cursor-pointer transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front of card */}
        <div
          className="absolute w-full h-full bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center backface-hidden border-2 border-gray-100"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-5xl font-bold text-gray-900">{word}</h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePronunciation();
              }}
              className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              aria-label="Pronounce word"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-500 text-lg">{pronunciation}</p>
          <p className="text-gray-400 mt-8 text-sm">Click to reveal definition</p>
        </div>

        {/* Back of card */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 flex flex-col justify-center backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <h3 className="text-white text-2xl font-semibold mb-4">Definition</h3>
          <p className="text-white text-xl mb-6 leading-relaxed">{definition}</p>
          <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-white/90 text-sm italic">"{example}"</p>
          </div>
          <p className="text-white/60 mt-8 text-sm text-center">Click to flip back</p>
        </div>
      </div>
    </div>
  );
}
