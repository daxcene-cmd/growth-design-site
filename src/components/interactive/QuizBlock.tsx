import { useState } from 'react';
import { optimizedDimensions, optimizedSrc, optimizedSrcSet } from '../../lib/optimizedImages';

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
  caseImages?: QuizCaseImage[];
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
  resultImages?: {
    excellent?: string;
    good?: string;
    retry?: string;
  };
  questions: QuizQuestion[];
};

type QuizBlockProps = {
  data: QuizData;
};

function getQuestionText(question: QuizQuestion) {
  if (!question.caseText) {
    return question.question;
  }

  return `${question.question.replace(/[？?]\s*$/, '')}：${question.caseText}`;
}

function imageProps(src: string, sizes = '(max-width: 900px) 88vw, 320px') {
  const dimensions = optimizedDimensions(src);
  return {
    src: optimizedSrc(src),
    srcSet: optimizedSrcSet(src),
    sizes: optimizedSrcSet(src) ? sizes : undefined,
    width: dimensions?.width,
    height: dimensions?.height,
  };
}

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
  const hasImageQuestions = data.questions.some((question) => question.caseImage || question.caseImages);
  const quizModeClass = hasImageQuestions ? 'is-image-quiz' : 'is-text-quiz';
  const resultImage =
    accuracy === 100
      ? data.resultImages?.excellent
      : accuracy >= 50
        ? data.resultImages?.good
        : data.resultImages?.retry;

  const answerReview = data.questions
    .map((question, index) => {
      const answerId = answers[question.id];
      const answer = question.options.find((option) => option.id === answerId);
      const correct = question.options.find((option) => option.correct);
      return {
        id: question.id,
        number: String(index + 1).padStart(2, '0'),
        question: getQuestionText(question),
        isCorrect: Boolean(answer?.correct),
        correctText: question.correctAnswerText ?? correct?.text ?? '见解析',
        explanation: question.explanation ?? answer?.explanation,
      };
    })
    .filter((item) => !item.isCorrect);

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

      <div
        className={`quiz-result ${answerReview.length > 0 ? 'has-review' : 'has-no-review'}`}
        role="status"
        style={{ display: showResult ? undefined : 'none' }}
      >
        <div className="quiz-result-content">
          <img
            alt=""
            aria-hidden="true"
            className="quiz-result-image"
            decoding="async"
            loading="lazy"
            {...imageProps(resultImage ?? '/growth-design-site/images/01-definition/flower.webp', '180px')}
          />
          <div className="quiz-result-summary">
            <p className="quiz-result-score">
              <span className="quiz-result-accuracy">{accuracy}%</span>
              <span className="quiz-result-label-small">答题准确率</span>
            </p>
          </div>
        </div>
        {answerReview.length > 0 ? (
          <div className="quiz-result-review-wrap">
            <p className="quiz-result-review-title">错题复盘</p>
            <ol className="quiz-result-review">
              {answerReview.map((item) => (
                <li className="quiz-result-review-item" key={item.id}>
                  <span className="quiz-result-review-number">{item.number}</span>
                  <span className="quiz-result-review-body">
                    <span className="quiz-result-review-question">{item.question}</span>
                    <span className="quiz-result-review-answer">正确答案：{item.correctText}</span>
                    {item.explanation ? (
                      <span className="quiz-result-review-note">{item.explanation}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        <div className="quiz-action-area quiz-action-area--center">
          <button className="quiz-restart-button" onClick={handleRestart} type="button">
            重新练习
          </button>
        </div>
      </div>

      <article
        className="quiz-question"
        style={{ display: showResult ? 'none' : undefined }}
      >
        <h5>
          <span className="quiz-question-number">{currentNumber}</span>
          <span className="quiz-question-text">{getQuestionText(currentQuestion)}</span>
        </h5>
        {currentQuestion.description ? (
          <p className="quiz-question-description">{currentQuestion.description}</p>
        ) : null}

        {currentQuestion.caseImages ? (
          <div className="quiz-image-options">
            {currentQuestion.caseImages.map((img, i) => {
              const option = currentQuestion.options[i];
              if (!option) return null;
              const isSelected = selectedId === option.id;
              const isCorrectAnswer = selectedId && option.correct;
              const resultClass = isSelected
                ? option.correct ? 'is-correct' : 'is-incorrect'
                : isCorrectAnswer ? 'is-correct-answer' : '';
              return (
                <div key={img.src} className="quiz-image-option-col">
                  <figure className="quiz-case-image">
                    <img alt={img.alt} loading="lazy" decoding="async" {...imageProps(img.src, '(max-width: 900px) 42vw, 220px')} />
                  </figure>
                  <button
                    aria-pressed={isSelected}
                    className={`quiz-option ${resultClass}`}
                    disabled={Boolean(selectedId)}
                    onClick={() => handleAnswer(currentQuestion, option.id)}
                    type="button"
                  >
                    {option.text}
                  </button>
                </div>
              );
            })}
          </div>
        ) : currentQuestion.caseImage ? (
          <figure className="quiz-case-image">
            <img alt={currentQuestion.caseImage.alt} loading="lazy" decoding="async" {...imageProps(currentQuestion.caseImage.src)} />
          </figure>
        ) : null}

        {!currentQuestion.caseImages ? (
          <div
            className={`quiz-options ${
              currentQuestion.options.length === 2 ? 'is-two-options' :
              currentQuestion.options.length === 3 ? 'is-three-options' :
              currentQuestion.options.length === 4 ? 'is-four-options' : ''
            }`}
          >
            {currentQuestion.options.slice(0, 4).map((option) => {
              const isSelected = selectedId === option.id;
              const isCorrectAnswer = selectedId && option.correct;
              const resultClass = isSelected
                ? option.correct ? 'is-correct' : 'is-incorrect'
                : isCorrectAnswer ? 'is-correct-answer' : '';
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
        ) : null}

        {selectedOption ? (
          <div className="quiz-feedback-area">
            <div
              className={`quiz-explanation ${
                selectedOption.correct ? 'is-correct' : 'is-incorrect'
              }`}
              role="status"
            >
              <p className="quiz-feedback-status">
                {selectedOption.correct
                  ? '回答正确'
                  : `回答错误，正确答案为${currentQuestion.correctAnswerText ?? correctOption?.text ?? '见解析'}`}
              </p>
              {currentQuestion.explanation ?? selectedOption.explanation ? (
                <p className="quiz-feedback-text">{currentQuestion.explanation ?? selectedOption.explanation}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {selectedOption ? (
          <div className="quiz-action-area">
            <button className="quiz-next-button" onClick={handleNext} type="button">
              {currentIndex === data.questions.length - 1 ? '查看结果' : '下一题'}
            </button>
          </div>
        ) : null}
      </article>
    </section>
  );
}
