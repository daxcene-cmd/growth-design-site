import { useState } from 'react';

type QuizCaseImage = {
  src: string;
  alt: string;
};

type QuizOption = {
  id: string;
  text: string;
  correct: boolean;
  explanation?: string;
};

type QuizQuestion = {
  id: string;
  type?: string;
  question: string;
  description?: string;
  caseText?: string;
  caseImage?: QuizCaseImage;
  correctAnswerText?: string;
  explanation?: string;
  options: QuizOption[];
};

type QuizData = {
  id: string;
  title: string;
  description?: string;
  resultLabels?: {
    excellent?: string;
    good?: string;
    retry?: string;
  };
  questions: QuizQuestion[];
};

type QuizBlockProps = {
  data: QuizData;
};

export default function QuizBlock({ data }: QuizBlockProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = data.questions[currentIndex];
  const selectedId = currentQuestion ? answers[currentQuestion.id] : undefined;
  const selectedOption = currentQuestion?.options.find((option) => option.id === selectedId);
  const correctOption = currentQuestion?.options.find((option) => option.correct);
  const correctCount = data.questions.filter((question) => {
    const answerId = answers[question.id];
    const answer = question.options.find((option) => option.id === answerId);
    return answer?.correct;
  }).length;
  const accuracy = data.questions.length > 0 ? Math.round((correctCount / data.questions.length) * 100) : 0;
  const currentNumber = String(currentIndex + 1).padStart(2, '0');
  const totalNumber = String(data.questions.length).padStart(2, '0');
  const hasImageQuestions = data.questions.some((question) => question.caseImage);
  const quizModeClass = hasImageQuestions ? 'is-image-quiz' : 'is-text-quiz';
  const resultLabel =
    accuracy === 100
      ? data.resultLabels?.excellent ?? '判断很稳，关键概念已经掌握。'
      : accuracy >= 60
        ? data.resultLabels?.good ?? '基本掌握，可以继续校准细节。'
        : data.resultLabels?.retry ?? '建议回看关键概念后再练一次。';

  const handleAnswer = (question: QuizQuestion, optionId: string) => {
    if (answers[question.id]) {
      return;
    }

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [question.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < data.questions.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    setShowResult(true);
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowResult(false);
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <section
      className={`interactive-block quiz-block ${quizModeClass}`}
      aria-labelledby={`${data.id}-title`}
    >
      <div className="interactive-header quiz-header">
        <h4 id={`${data.id}-title`}>{data.title}</h4>
        <p className="quiz-header-progress">{showResult ? `${totalNumber}/${totalNumber}` : `${currentNumber}/${totalNumber}`}</p>
        {data.description ? <p>{data.description}</p> : null}
      </div>

      {showResult ? (
        <div className="quiz-result" role="status">
          <div className="quiz-result-content">
            <div className="quiz-result-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" role="img">
                <path d="M17 24.5 22 30 32 18" />
                <path d="M18.5 39.5c-5.3-2.2-9-7.4-9-13.5 0-8 6.5-14.5 14.5-14.5S38.5 18 38.5 26c0 6.1-3.7 11.3-9 13.5" />
                <path d="M17 8.5 14.5 4" />
                <path d="M24 7V2.5" />
                <path d="M31 8.5 33.5 4" />
              </svg>
            </div>
            <p className="quiz-result-title">
              正确率 <span>{accuracy}%</span>
            </p>
            <p className="quiz-result-label">
              本轮答对 {correctCount} 题。{resultLabel}
            </p>
          </div>
          <div className="quiz-action-area">
            <button className="quiz-next-button" onClick={handleRestart} type="button">
              重新练习
            </button>
          </div>
        </div>
      ) : (
        <article className="quiz-question">
          <h5>
            <span className="quiz-question-number">{currentNumber}</span>
            {currentQuestion.question}
          </h5>
          {currentQuestion.description ? (
            <p className="quiz-question-description">{currentQuestion.description}</p>
          ) : null}

          {currentQuestion.caseText ? (
            <div className="quiz-case-text">{currentQuestion.caseText}</div>
          ) : null}

          {currentQuestion.caseImage ? (
            <figure className="quiz-case-image">
              <img src={currentQuestion.caseImage.src} alt={currentQuestion.caseImage.alt} />
            </figure>
          ) : null}

          <div
            className={`quiz-options ${
              currentQuestion.options.length === 2 ? 'is-two-options' : ''
            }`}
          >
            {currentQuestion.options.map((option) => {
              const isSelected = selectedId === option.id;
              const isCorrectAnswer = selectedId && option.correct;
              const resultClass = isSelected
                ? option.correct
                  ? 'is-correct'
                  : 'is-incorrect'
                : isCorrectAnswer
                  ? 'is-correct-answer'
                  : '';

              return (
                <button
                  aria-pressed={isSelected}
                  className={`quiz-option ${resultClass}`}
                  disabled={Boolean(selectedId)}
                  key={option.id}
                  onClick={() => handleAnswer(currentQuestion, option.id)}
                  type="button"
                >
                  {option.text}
                </button>
              );
            })}
          </div>

          <div className="quiz-feedback-area">
            {selectedOption ? (
              <div
                className={`quiz-explanation ${
                  selectedOption.correct ? 'is-correct' : 'is-incorrect'
                }`}
                role="status"
              >
                <p className="quiz-feedback-title">
                  {selectedOption.correct ? '回答正确' : '回答错误'}
                </p>
                {!selectedOption.correct ? (
                  <p>
                    正确答案：
                    {currentQuestion.correctAnswerText ?? correctOption?.text ?? '见解析'}
                  </p>
                ) : null}
                {currentQuestion.explanation ?? selectedOption.explanation ? (
                  <p>{currentQuestion.explanation ?? selectedOption.explanation}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="quiz-action-area">
            {selectedOption ? (
              <button className="quiz-next-button" onClick={handleNext} type="button">
                {currentIndex === data.questions.length - 1 ? '查看结果' : '下一题'}
              </button>
            ) : null}
          </div>
        </article>
      )}
    </section>
  );
}
