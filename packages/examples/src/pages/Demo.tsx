import React, { useEffect, useRef, useState } from 'react';
import {
  FiEye,
  FiMaximize2,
  FiMinimize2,
  FiSettings,
  FiSun,
  FiWind,
} from 'react-icons/fi';

import styles from '@/styles/pages/Demo.module.scss';

interface Control {
  label: string;
  type: 'range' | 'select';
  value: number | string;
  options?: string[];
  min?: number;
  max?: number;
  icon: React.ReactNode;
}

const controls: Control[] = [
  {
    label: 'Camera Height',
    type: 'range',
    value: 50,
    min: 0,
    max: 100,
    icon: <FiEye />,
  },
  {
    label: 'Lighting Intensity',
    type: 'range',
    value: 75,
    min: 0,
    max: 100,
    icon: <FiSun />,
  },
  {
    label: 'Wind Effect',
    type: 'range',
    value: 30,
    min: 0,
    max: 100,
    icon: <FiWind />,
  },
  {
    label: 'Detail Level',
    type: 'select',
    value: 'medium',
    options: ['low', 'medium', 'high', 'ultra'],
    icon: <FiSettings />,
  },
];

const Demo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlValues, setControlValues] = useState<
    Record<string, number | string>
  >(
    controls.reduce(
      (acc, control) => ({ ...acc, [control.label]: control.value }),
      {},
    ),
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleControlChange = (label: string, value: number | string) => {
    setControlValues((prev) => ({ ...prev, [label]: value }));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.demoContainer} ${
          isFullscreen ? styles.fullscreen : styles.windowed
        }`}
      >
        <canvas ref={canvasRef} className={styles.canvas} />

        {/* Controls Overlay */}
        <div className={styles.controls}>
          <button
            onClick={() => setShowControls(!showControls)}
            className={`${styles.controlsButton} ${
              showControls ? styles.active : ''
            }`}
          >
            <FiSettings />
          </button>
          <button onClick={toggleFullscreen} className={styles.controlsButton}>
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
        </div>

        {/* Control Panel */}
        {showControls && (
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Controls</h3>
            {controls.map((control, index) => (
              <div
                key={control.label}
                className={styles.controlItem}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.controlItemHeader}>
                  <div className={styles.controlItemIcon}>{control.icon}</div>
                  <label className={styles.controlItemLabel}>
                    {control.label}
                  </label>
                </div>
                {control.type === 'range' ? (
                  <div className={styles.controlItemRange}>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      value={controlValues[control.label] as number}
                      onChange={(e) =>
                        handleControlChange(
                          control.label,
                          Number(e.target.value),
                        )
                      }
                      className={styles.rangeInput}
                    />
                    <span className={styles.controlItemValue}>
                      {controlValues[control.label]}%
                    </span>
                  </div>
                ) : (
                  <select
                    value={controlValues[control.label] as string}
                    onChange={(e) =>
                      handleControlChange(control.label, e.target.value)
                    }
                    className={styles.select}
                  >
                    {control.options?.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Demo;
