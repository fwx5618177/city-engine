import React, { useState } from 'react';
import { FiMaximize2, FiX } from 'react-icons/fi';

import styles from '@/styles/pages/Gallery.module.scss';

interface GalleryItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  gradient: string;
}

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: 'Modern City Center',
    description:
      'High-detail 3D visualization of a modern city center with skyscrapers.',
    imageUrl: 'https://source.unsplash.com/800x600/?city',
    category: 'Urban',
    gradient: 'linear-gradient(135deg, #3498db, #2ecc71)',
  },
  {
    id: 2,
    title: 'Smart Transportation',
    description: 'Intelligent traffic management system visualization.',
    imageUrl: 'https://source.unsplash.com/800x600/?traffic',
    category: 'Transport',
    gradient: 'linear-gradient(135deg, #e74c3c, #f1c40f)',
  },
  {
    id: 3,
    title: 'Green Spaces',
    description: 'Urban parks and green spaces planning visualization.',
    imageUrl: 'https://source.unsplash.com/800x600/?park',
    category: 'Environment',
    gradient: 'linear-gradient(135deg, #2ecc71, #1abc9c)',
  },
  {
    id: 4,
    title: 'Night City',
    description: 'Dynamic lighting simulation in night city environment.',
    imageUrl: 'https://source.unsplash.com/800x600/?night-city',
    category: 'Urban',
    gradient: 'linear-gradient(135deg, #34495e, #9b59b6)',
  },
  {
    id: 5,
    title: 'Infrastructure Network',
    description: 'City infrastructure and utilities network visualization.',
    imageUrl: 'https://source.unsplash.com/800x600/?infrastructure',
    category: 'Infrastructure',
    gradient: 'linear-gradient(135deg, #f1c40f, #e67e22)',
  },
  {
    id: 6,
    title: 'Waterfront Development',
    description: 'Coastal city development and waterfront planning.',
    imageUrl: 'https://source.unsplash.com/800x600/?waterfront',
    category: 'Urban',
    gradient: 'linear-gradient(135deg, #3498db, #9b59b6)',
  },
];

const Gallery: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const categories = [
    'all',
    ...new Set(galleryItems.map((item) => item.category)),
  ];
  const filteredItems =
    filter === 'all'
      ? galleryItems
      : galleryItems.filter((item) => item.category === filter);

  return (
    <div className={styles.container}>
      <div className={styles.galleryContainer}>
        <h1 className={styles.title}>Gallery</h1>

        {/* Category Filter */}
        <div className={styles.filterContainer}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`${styles.filterButton} ${
                filter === category ? styles.active : styles.secondary
              }`}
              style={{ textTransform: 'capitalize' }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className={styles.grid}>
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={styles.galleryItem}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => setSelectedItem(item)}
            >
              <div
                className={styles.galleryItemGradient}
                style={{ background: item.gradient }}
              />
              <div
                className={styles.galleryItemImage}
                style={{ backgroundImage: `url(${item.imageUrl})` }}
              />
              <div className={styles.galleryItemInfo}>
                <h3 className={styles.galleryItemTitle}>{item.title}</h3>
                <p className={styles.galleryItemDescription}>
                  {item.description}
                </p>
              </div>
              <div className={styles.galleryItemExpand}>
                <FiMaximize2 />
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {selectedItem && (
          <div className={styles.modal} onClick={() => setSelectedItem(null)}>
            <button
              className={styles.modalClose}
              onClick={() => setSelectedItem(null)}
            >
              <FiX />
            </button>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.title}
                className={styles.modalImage}
              />
              <div className={styles.modalInfo}>
                <h2>{selectedItem.title}</h2>
                <p>{selectedItem.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
