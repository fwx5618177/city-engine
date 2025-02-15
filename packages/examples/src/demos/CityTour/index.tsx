import React, { useEffect } from 'react';
import * as THREE from 'three';

import { App } from './common/app/app';
import styles from './index.module.scss';

const CityTour: React.FC = () => {
  useEffect(() => {
    // 使用 TextureLoader 加载网格纹理后初始化 App
    new THREE.TextureLoader().load('textures/grid.png', (gridTexture) => {
      const container = document.getElementById('container');
      if (container) {
        const app = new App(container, gridTexture);
        app.start();
      }
    });
  }, []);

  return (
    <div
      id="container"
      className={`${styles.relative} ${styles.widthFull} ${styles.heightFull}`}
    >
      <div
        id="menus-container"
        className={`${styles.absolute} ${styles.top0} ${styles.right0} ${styles.flex} ${styles.flexColumn} ${styles.flexAlignEnd} ${styles.maxHeightFull} ${styles.pointerEventsNone}`}
      >
        <div className={`${styles.flex} ${styles.pointerEventsAuto}`}>
          <button id="menu-newcity-title" className={styles.menuTitle}>
            New City
          </button>
          <button id="menu-about-title" className={styles.menuTitle}>
            About
          </button>
        </div>
        <div
          id="menu-newcity"
          className={`${styles.displayNone} ${styles.menu} ${styles.bgWhite} ${styles.btThin} ${styles.btGray} ${styles.pointerEventsAuto}`}
        >
          <h3>Terrain</h3>
          <span className={styles.block}>
            <input id="terrain-river" type="checkbox" defaultChecked />
            <label htmlFor="terrain-river">Has a River</label>
          </span>
          <h3 className={styles.mt1}>Buildings</h3>
          <span className={`${styles.flex} ${styles.flexAlignCenter}`}>
            <label className={styles.width4}>City Size</label>
            <span className={styles.controlLegend}>&minus;</span>
            <input
              id="buildings-neighborhood-count"
              type="range"
              defaultValue="15"
              min="1"
              max="50"
              step="1"
            />
            <span className={styles.controlLegend}>+</span>
          </span>
          <span className={`${styles.flex} ${styles.flexAlignCenter}`}>
            <label className={styles.width4}>Max Stories</label>
            <span className={styles.controlLegend}>&minus;</span>
            <input
              id="buildings-max-stories"
              type="range"
              defaultValue="40"
              min="1"
              max="80"
              step="1"
            />
            <span className={styles.controlLegend}>+</span>
          </span>
          <span className={`${styles.block} ${styles.mt1} ${styles.center}`}>
            <button id="reset">Create New City</button>
          </span>
        </div>
      </div>
      <div
        id="navigation-controls-container"
        className={`${styles.absolute} ${styles.bottom0} ${styles.right0} ${styles.bgWhite}`}
      >
        <button id="navigation-controls-toggle">&#9650;</button>
        <div
          id="navigation-controls-inner-container"
          className={`${styles.displayNone} ${styles.navigationControlsSection}`}
        >
          <span className={`${styles.flex} ${styles.flexAlignCenter}`}>
            <label className={styles.width3}>Rotation</label>
            <span className={styles.controlLegend}>&orarr;</span>
            <input
              id="azimuth-angle"
              type="range"
              defaultValue="-30"
              min="-180"
              max="180"
              step="1"
            />
            <span className={styles.controlLegend}>&olarr;</span>
          </span>
          <span className={`${styles.flex} ${styles.flexAlignCenter}`}>
            <label className={styles.width3}>Tilt</label>
            <span className={styles.controlLegend}>&rarr;</span>
            <input
              id="tilt-angle-percentage"
              type="range"
              defaultValue="0.2"
              min="0.0"
              max="1.0"
              step="0.001"
            />
            <span className={styles.controlLegend}>&darr;</span>
          </span>
          <span
            className={`${styles.flex} ${styles.flexJustifyCenter}`}
            style={{ paddingTop: '0.5rem' }}
          >
            <button id="zoom-out" className={styles.userSelectNone}>
              Zoom Out
            </button>
            <button id="zoom-in" className={styles.userSelectNone}>
              Zoom In
            </button>
          </span>
        </div>
        <div className={`${styles.center} ${styles.navigationControlsSection}`}>
          <button id="flythrough-toggle" className={styles.width4}>
            Take a Tour
          </button>
        </div>
      </div>
      <div
        id="loading-message"
        className={`${styles.flex} ${styles.absolute} ${styles.top0} ${styles.bottom0} ${styles.left0} ${styles.right0}`}
      >
        Building new city...
      </div>
    </div>
  );
};

export default CityTour;
