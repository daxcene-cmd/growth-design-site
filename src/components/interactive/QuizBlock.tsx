import { useState, useEffect, useRef } from 'react';

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

export default function QuizBlock({ data }: QuizBlockProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [bodyHeight, setBodyHeight] = useState<number | null>(null);
  const [feedbackHeight, setFeedbackHeight] = useState<number | null>(null);
  const [actionHeight, setActionHeight] = useState<number | null>(null);
  const [measured, setMeasured] = useState(false);
  const blockRef = useRef<HTMLElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const block = blockRef.current;
    if (!block) return;

    // 创建隐藏测量容器，宽度与 block 一致，完全脱离文档流
    const probe = document.createElement('div');
    probe.style.cssText = `
      position: absolute;
      visibility: hidden;
      pointer-events: none;
      width: ${block.getBoundingClientRect().width}px;
      left: -9999px;
      top: 0;
    `;
    document.body.appendChild(probe);

    // 动态 import ReactDOM 避免 SSR 问题
    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(probe);

      // 渲染结果页副本测量高度
      const ResultPage = () => (
        <div className="quiz-result">
          <div className="quiz-result-content">
            <img alt="" aria-hidden="true" className="quiz-result-image" src="/growth-design-site/images/flower.webp" />
            <p className="quiz-result-label-small">本轮答题准确率为</p>
            <p className="quiz-result-accuracy">100%</p>
            <p className="quiz-result-label">{
              [
                data.resultLabels?.excellent ?? '判断很稳，关键概念已经掌握。',
                data.resultLabels?.good ?? '基本掌握，可以继续校准细节。',
                data.resultLabels?.retry ?? '建议回看关键概念后再练一次。',
              ].reduce((a, b) => a.length >= b.length ? a : b)
            }</p>
          </div>
          <div className="quiz-action-area quiz-action-area--center">
            <button className="quiz-restart-button" type="button">重新练习</button>
          </div>
        </div>
      );

      root.render(<ResultPage />);

      // 等图片加载完成后测量，确保高度准确
      const measureAfterImage = (callback: (h: number) => void) => {
        const img = probe.querySelector('img');
        const doMeasure = () => callback(probe.getBoundingClientRect().height);
        if (img && !img.complete) {
          img.addEventListener('load', doMeasure, { once: true });
          img.addEventListener('error', doMeasure, { once: true });
        } else {
          requestAnimationFrame(() => requestAnimationFrame(doMeasure));
        }
      };

      measureAfterImage((resultHeight) => {

        // 第一轮：测量每道题的反馈区高度
        const feedbackHeights: number[] = [];
        let feedbackMeasured = 0;

        data.questions.forEach((question, i) => {
          const fProbe = document.createElement('div');
          fProbe.style.cssText = probe.style.cssText;
          document.body.appendChild(fProbe);
          const fRoot = createRoot(fProbe);

          const FeedbackPage = () => (
            <div className="quiz-feedback-area" data-feedback>
              <div className="quiz-explanation is-incorrect">
                <p className="quiz-feedback-title">
                  {`回答错误：正确答案是${question.options.find(o => o.correct)?.text ?? '见解析'}`}
                </p>
                {question.explanation ? <p>{question.explanation}</p> : null}
              </div>
            </div>
          );

          fRoot.render(<FeedbackPage />);

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              feedbackHeights[i] = fProbe.getBoundingClientRect().height;
              fRoot.unmount();
              document.body.removeChild(fProbe);
              feedbackMeasured++;

              if (feedbackMeasured === data.questions.length) {
                const maxFeedbackHeight = Math.max(...feedbackHeights);

                // feedbackHeight 先暂存，等第二轮完成后一起 setState

                // 第二轮：用 maxFeedbackHeight 渲染答题页副本测总高度
                const questionHeights: number[] = [];
                let questionMeasured = 0;

                data.questions.forEach((question2, j) => {
                  const qProbe = document.createElement('div');
                  qProbe.style.cssText = probe.style.cssText;
                  document.body.appendChild(qProbe);
                  const qRoot = createRoot(qProbe);

                  const QuestionPage = () => (
                    <article className="quiz-question">
                      <h5><span className="quiz-question-number">{String(j + 1).padStart(2, '0')}</span>{question2.question}</h5>
                      {question2.description ? <p className="quiz-question-description">{question2.description}</p> : null}
                      {question2.caseText ? <div className="quiz-case-text">{question2.caseText}</div> : null}
                      {question2.caseImage ? <figure className="quiz-case-image"><img src={question2.caseImage.src} alt={question2.caseImage.alt} /></figure> : null}
                      <div className={`quiz-options ${question2.options.length === 2 ? 'is-two-options' : question2.options.length === 3 ? 'is-three-options' : question2.options.length === 4 ? 'is-four-options' : ''}`}>
                        {question2.options.slice(0, 4).map((opt) => (
                          <button className="quiz-option" key={opt.id} type="button">{opt.text}</button>
                        ))}
                      </div>
                      <div className="quiz-feedback-area" style={{ minHeight: maxFeedbackHeight + 'px' }} />
                      <div className="quiz-action-area" data-action>
                        <button className="quiz-next-button" type="button">下一题</button>
                      </div>
                    </article>
                  );

                  qRoot.render(<QuestionPage />);

                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      questionHeights[j] = qProbe.getBoundingClientRect().height;
                      const actionEl = qProbe.querySelector('[data-action]');
                      const measuredActionHeight = actionEl ? actionEl.getBoundingClientRect().height : 0;
                      qRoot.unmount();
                      document.body.removeChild(qProbe);
                      questionMeasured++;

                      if (questionMeasured === data.questions.length) {
                        const maxQuestionHeight = Math.max(...questionHeights);
                        const finalHeight = Math.max(resultHeight, maxQuestionHeight);
                        setFeedbackHeight(maxFeedbackHeight);
                        setActionHeight(measuredActionHeight);
                        setBodyHeight(finalHeight);
                        setMeasured(true);
                        root.unmount();
                        document.body.removeChild(probe);
                      }
                    });
                  });
                });
              }
            });
          });
        });
      });
    });
  }, []);

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

  const resultImage =
    accuracy === 100
      ? data.resultImages?.excellent
      : accuracy >= 60
        ? data.resultImages?.good
        : data.resultImages?.retry;

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
      ref={blockRef}
      style={{ visibility: measured ? 'visible' : 'hidden' }}
    >
      <div className="interactive-header quiz-header">
        <h4 id={`${data.id}-title`}>{data.title}</h4>
        <p className="quiz-header-progress">{showResult ? `${totalNumber}/${totalNumber}` : `${currentNumber}/${totalNumber}`}</p>
        {data.description ? <p>{data.description}</p> : null}
      </div>

      <div
        className="quiz-result"
        role="status"
        style={{ display: showResult ? undefined : 'none', minHeight: bodyHeight ?? undefined }}
      >
        <div className="quiz-result-content">
          <img
            alt=""
            aria-hidden="true"
            className="quiz-result-image"
            src={resultImage ?? '/growth-design-site/images/flower.webp'}
          />
          <p className="quiz-result-label-small">本轮答题准确率为</p>
          <p className="quiz-result-accuracy">{accuracy}%</p>
          <p className="quiz-result-label">{resultLabel}</p>
        </div>
        <div className="quiz-action-area quiz-action-area--center">
          <button className="quiz-restart-button" onClick={handleRestart} type="button">
            重新练习
          </button>
        </div>
      </div>

      <article
        className="quiz-question"
        style={{ display: showResult ? 'none' : undefined, minHeight: bodyHeight ?? undefined }}
      >
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
            currentQuestion.options.length === 2 ? 'is-two-options' :
            currentQuestion.options.length === 3 ? 'is-three-options' :
            currentQuestion.options.length === 4 ? 'is-four-options' : ''
          }`}
        >
          {currentQuestion.options.slice(0, 4).map((option) => {
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

        <div className="quiz-feedback-area" style={{ minHeight: feedbackHeight ?? undefined }}>
          {selectedOption ? (
            <div
              className={`quiz-explanation ${
                selectedOption.correct ? 'is-correct' : 'is-incorrect'
              }`}
              role="status"
            >
              <p className="quiz-feedback-title">
                {selectedOption.correct
                  ? '回答正确'
                  : `回答错误：正确答案是${currentQuestion.correctAnswerText ?? correctOption?.text ?? '见解析'}`}
              </p>
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
          ) : (
            <div style={{ height: actionHeight ?? undefined }} />
          )}
        </div>
      </article>
    </section>
  );
}
