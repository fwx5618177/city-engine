import React from 'react';
import { Link } from 'react-router-dom';

import styles from '@/styles/pages/Contact.module.scss';

const Contact: React.FC = () => (
  <div className={styles.container}>
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        City3D
      </Link>
      <div className={styles.navLinks}>
        <Link to="/" className={styles.navLink}>
          Home
        </Link>
        <Link to="/about" className={styles.navLink}>
          About
        </Link>
        <Link to="/gallery" className={styles.navLink}>
          Gallery
        </Link>
        <Link to="/contact" className={`${styles.navLink} ${styles.active}`}>
          Contact
        </Link>
      </div>
    </nav>

    <main className={styles.content}>
      <div className={styles.form}>
        <h2 className={styles.sectionTitle}>Contact Our Team</h2>
        <form>
          <div className={styles.formGroup}>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" placeholder="Enter your name" />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Enter your email" />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="subject">Subject</label>
            <select id="subject">
              <option value="">Select a subject</option>
              <option value="technical">Technical Support</option>
              <option value="sales">Sales Inquiry</option>
              <option value="partnership">Partnership Opportunity</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              rows={5}
              placeholder="Enter your message"
            ></textarea>
          </div>
          <button type="submit" className={styles.submitButton}>
            Send Message
          </button>
        </form>
      </div>

      <div className={styles.mapContainer}>
        <h3>Our Location</h3>
        <p>Shanghai Digital Innovation Center</p>
        <p>Pudong New District, Shanghai</p>
      </div>
    </main>
  </div>
);

export default Contact;
