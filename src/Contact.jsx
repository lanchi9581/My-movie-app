import React, { useState } from 'react';
import Accordion from './components/Accordion';
import './components/Accordion.css';
import emailjs from 'emailjs-com';
import './Contact.css';


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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Technical Support',
    message: '',
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

const handleSubmit = (e) => {
  e.preventDefault();

  emailjs.send(
    'service_j2j128i',      // Your EmailJS Service ID
    'template_0s1ests',   // Your EmailJS Template ID (replace with yours)
    formData,               // Your form data object
    'NfsbwMcql22hO1JC0'    // Your EmailJS User ID (public key)
  )
  .then((response) => {
    console.log('SUCCESS!', response.status, response.text);
    setStatus('Thank you for reaching out! We will get back to you shortly.');
    setFormData({ name: '', email: '', category: 'Technical Support', message: '' });
  })
  .catch((error) => {
    console.error('FAILED...', error);
    setStatus('Oops! Something went wrong. Please try again.');
  });
};


  return (
    <section className="contact-container">
      <h2 className="h2-redish">Customer Support</h2>
      <p>Here to help you enjoy the best movie experience. Find answers, get help, or contact us.   <span className="highlight">Contact Form at the bottom</span> </p>
      <br />
      <hr className="custom-hr" />
      <h2 className="h2-redish">Sections:</h2>

      {/* Accordion */}
      <Accordion sections={sections} />
      <hr className="custom-hr" />
      

      {/* Contact Form */}
      <div className="contactForm">
        <h2 className="h2-redish">Need Help? Contact Us</h2>
        <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
          <label htmlFor="name" style={{fontWeight: 'bold', }}><i className="bx bxs-user" style={{ color: "#ffffff" }}></i>  Name:</label><br />
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: '100%', marginBottom: 12, padding: '10px', borderRadius: '7px', }}
          />
          <br />

          <label htmlFor="email" style={{fontWeight: 'bold', }}><i className="bx bx-at" style={{ color: "#ffffff" }}></i>  Email:</label><br />
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', marginBottom: 12,padding: '10px', borderRadius: '7px',}}
          />
          
          <br />

          <label htmlFor="category" style={{fontWeight: 'bold', }}><i className="bx bxs-category" style={{ color: "#ffffff" }}></i>  Topic:</label><br />
          <select className="contactForm--select"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={{ width: '100%', marginBottom: 12, padding: '10px', borderRadius: '7px',}}
          >
            <option value="Technical Support" >Technical Support</option>
            <option value="Film Recommendation">Film Recommendation</option>
            <option value="Bug Reporting">Bug Reporting</option>
            <option value="Account and Subscription">Account and Subscription</option>
            <option value="Feedback">Feedback</option>
          </select>
          <br />

          <label htmlFor="message" style={{fontWeight: 'bold', }}><i className="bx bxs-message" style={{ color: "#ffffff" }}></i>  Message:</label><br />
          <textarea
            id="message"
            name="message"
            rows={5}                                                
            value={formData.message}
            onChange={handleChange}
            required
            style={{ width: '100%', marginBottom: 12, padding: '20px', borderRadius: '7px',}}
          />
          <br />
          <button
            type="submit"
            style={{
              backgroundColor: '#e50914',
              color: 'white',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              border: 'none',
              padding: '10px 20px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '16px',
            }}>Submit</button>
        </form>
      </div>
        {status && (
          <p style={{ marginTop: '12px', color: '#e50914', fontWeight: 'bold' }}>
            {status}
          </p>
        )}
    </section>
  );
}

