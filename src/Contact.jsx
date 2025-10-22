import React from 'react';
import Accordion from './components/Accordion';
import './components/Accordion.css';

const sections = [
  {
    title: 'Account and Subscription',
    qa: [
      { question: 'How do I create an account?', answer: 'Please visit the registration page to create a new account.' },
      { question: 'Is offline viewing available?', answer: 'Currently, offline viewing is not supported.' },
      { question: 'How can I reset my password?', answer: 'You can reset your password directly within the app\'s account settings.' },
      { question: 'What subscription plans are available?', answer: 'At this time, we do not offer subscription plans.' },
      { question: 'Which devices are supported?', answer: 'Currently, our service is available on web browsers via PC.' },
      { question: 'Can I watch movies on multiple devices simultaneously?', answer: 'Yes, simultaneous streaming on multiple devices is supported.' },
      { question: 'How do I report a technical issue or bug?', answer: 'Please use the support form available in the Help Center to report any issues.' },
    ],
  },
  {
    title: 'Customer Support',
    qa: [
      { question: 'How can I contact customer support?', answer: 'You can reach our customer support team via phone or email listed on the Contact Us page.' },
      { question: 'What should I do if a movie does not play?', answer: 'Try switching the streaming provider using the cloud icon in the top-left corner to select an alternative source.' },
      { question: 'How do I update my email or username?', answer: 'Currently, updating your email or username is not supported.' },
    ],
  },
  {
    title: 'Bug Reporting',
    qa: [
      { question: 'How do I report a bug?', answer: 'Please submit a detailed report using the bug reporting form available in the Help Center.' },
    ],
  },
  {
    title: 'Feedback',
    qa: [
      { question: 'How can I submit feedback about the app?', answer: 'You can provide feedback through our dedicated feedback form, accessible via the Feedback section.' },
    ],
  },
  {
    title: 'Film Recommendations',
    qa: [
      { question: 'Can I suggest new movies or features?', answer: 'Yes, please submit your suggestions using the provided feedback form.' },
      { question: 'Does the app recommend movies based on my watch history?', answer: 'This feature is not currently available.' },
      { question: 'Can I customize my movie recommendations?', answer: 'At present, customization of recommendations is not supported.' },
      { question: 'How do I find movies similar to my favorites?', answer: 'You can browse movies by genre or use the available filters to find similar titles.' },
    ],
  },
];

export default function Contact() {
  return (
    <section className="contact-container">
      <h2 className="h2-redish">Customer Support</h2>
      <p>Here to help you enjoy the best movie experience. Find answers, get help, or contact us.</p>
      <br />
      <hr className="custom-hr"/>
      <h3 className="h3-redish">Sections:</h3>

      {/* Accordion inserted here */}
      <Accordion sections={sections} />
      <br />
      <br />
      <br />
    </section>
    
  );
}