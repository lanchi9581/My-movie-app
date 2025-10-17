import React, { useState } from 'react';
import './accordion.css';

export default function Accordion({ sections }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      {sections.map((section, index) => (
        <div key={index}>
          <button
            className="accordion"
            onClick={() => toggleAccordion(index)}
            aria-expanded={openIndex === index}
            aria-controls={`panel-${index}`}
            id={`accordion-${index}`}
          >
            <span className={`arrow ${openIndex === index ? 'down' : ''}`}>
              &#9656;
            </span>
            {section.title}
          </button>

          <div
            className={`panel ${openIndex === index ? 'show' : ''}`}
            id={`panel-${index}`}
            role="region"
            aria-labelledby={`accordion-${index}`}
          >
            {section.qa.map((item, i) => (
              <div key={i} className="qa-bubble">
                <strong className="question">{item.question}</strong>
                <p className="answer">
                  <i className="bx bx-chevron-right" style={{fontSize: '1.2rem', verticalAlign: 'middle'}}></i>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}