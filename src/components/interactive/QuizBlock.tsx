import { useState } from 'react';

type QuizOption = {
  id: string;
  text: string;
  correct: boolean;
  explanation: string;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOption[];
};

type QuizData = {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
};

type QuizBlockProps = {
  data: QuizData;
};

export default function QuizBlock({ data }: QuizBlockProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  return (
    <section className="interactive-block quiz-block" aria-labelledby={`${data.id}-title`}>
      <div className="interactive-header">
        <p className="interactive-kicker">问答模块</p>
        <h4 id={`${data.id}-title`}>{data.title}</h4>
        {data.description ? <p>{data.description}</p> : null}
      </div>

      <div className="quiz-list">
        {data.questions.map((question, questionIndex) => {
          const selectedId = answers[question.id];
          const selectedOption = question.options.find((option) => option.id === selectedId);

          return (
            <article className="quiz-question" key={question.id}>
              <h5>
                {questionIndex + 1}. {question.question}
              </h5>

              <div className="quiz-options">
                {question.options.map((option) => {
                  const isSelected = selectedId === option.id;
                  const resultClass = isSelected
                    ? option.correct
                      ? 'is-correct'
                      : 'is-incorrect'
                    : '';

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`quiz-option ${resultClass}`}
                      key={option.id}
                      onClick={() =>
                        setAnswers((currentAnswers) => ({
                          ...currentAnswers,
                          [question.id]: option.id,
                        }))
                      }
                      type="button"
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>

              {selectedOption ? (
                <p
                  className={`quiz-explanation ${
                    selectedOption.correct ? 'is-correct' : 'is-incorrect'
                  }`}
                >
                  {selectedOption.correct ? '回答正确：' : '再想一下：'}
                  {selectedOption.explanation}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
