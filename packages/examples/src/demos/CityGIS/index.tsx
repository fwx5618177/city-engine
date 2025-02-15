import {
  CallbackProperty,
  CameraEventType,
  Cartesian2,
  Cartesian3,
  Cesium3DTileStyle,
  Color,
  EllipsoidTerrainProvider,
  Entity,
  Ion,
  LabelStyle,
  Math,
  OpenStreetMapImageryProvider,
  PositionProperty,
  SceneMode,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Viewer,
  createOsmBuildingsAsync,
  createWorldTerrainAsync,
} from 'cesium';
import React, { useEffect, useRef, useState } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import styles from './index.module.scss';

// 配置 Cesium ion 访问令牌
Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5NzMyMzEzYi05MTE1LTQwOWItODNiYi1hNTcxMjk5YWIzODEiLCJpZCI6Mjc2MjM1LCJpYXQiOjE3Mzk2MjE1MDZ9.nwHCEKpxx8wwgop-TjIVFPpUZKt1Bkrt875whRBWnI4';

const CityGIS: React.FC = () => {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [showNewBuilding, setShowNewBuilding] = useState(true);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [layers, setLayers] = useState({
    buildings: true,
    terrain: true,
    imagery: true,
  });

  // 测量工具状态
  const measurementRef = useRef<{
    handler?: ScreenSpaceEventHandler;
    positions?: Cartesian3[];
    polyline?: Entity;
    label?: Entity;
  }>({});

  useEffect(() => {
    if (!cesiumContainerRef.current) return;

    console.log('cesiumContainerRef.current', cesiumContainerRef.current);
    // 初始化 Cesium Viewer
    const viewer = new Viewer(cesiumContainerRef.current, {
      terrainProvider: new EllipsoidTerrainProvider(),
      animation: false,
      baseLayerPicker: true,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: true,
      sceneModePicker: false,
      selectionIndicator: true,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      sceneMode: SceneMode.SCENE3D,
      scene3DOnly: true,
    });

    viewer.imageryLayers.addImageryProvider(
      new OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/',
      }),
    );

    // 禁用默认的双击事件
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );

    viewerRef.current = viewer;

    // 初始化地形
    const initTerrain = async () => {
      try {
        if (viewer.isDestroyed()) return;
        const worldTerrain = await createWorldTerrainAsync({
          requestVertexNormals: true,
          requestWaterMask: true,
        });
        if (!viewer.isDestroyed()) {
          viewer.terrainProvider = worldTerrain;
        }
      } catch (error) {
        console.error('Error loading terrain:', error);
      }
    };

    // 添加 Cesium OSM Buildings
    const addOsmBuildings = async () => {
      try {
        if (viewer.isDestroyed()) return;
        const buildingsTileset = await createOsmBuildingsAsync();
        if (!viewer.isDestroyed()) {
          viewer.scene.primitives.add(buildingsTileset);

          // 设置建筑样式
          buildingsTileset.style = new Cesium3DTileStyle({
            color: "color('#ffffff')",
            show: true,
            // 增加建筑高度
            scale: 'max(${height} * 1.5, 20)', // 最小20米高，其他建筑高度放大1.5倍
          });

          // 添加建筑物点击事件
          viewer.screenSpaceEventHandler.setInputAction(
            (movement: ScreenSpaceEventHandler.PositionedEvent) => {
              if (!viewer || viewer.isDestroyed()) return;
              const pickedFeature = viewer.scene.pick(movement.position);
              if (pickedFeature && pickedFeature.getProperty) {
                // 高亮选中的建筑物，增加高亮建筑的高度
                const highlightStyle = new Cesium3DTileStyle({
                  color: {
                    conditions: [
                      [
                        '${id} === "' + pickedFeature.getProperty('id') + '"',
                        'color("#4169E1")',
                      ],
                      [true, 'color("#ffffff")'],
                    ],
                  },
                  scale: 'max(${height} * 1.5, 20)', // 保持与普通建筑一致的高度
                });

                // 确保 buildingsTileset 存在且未被销毁
                const buildingsTileset = viewer.scene.primitives.get(0);
                if (buildingsTileset && !buildingsTileset.isDestroyed()) {
                  buildingsTileset.style = highlightStyle;
                }

                // 显示建筑物信息
                let description = '<table class="cesium-infoBox-defaultTable">';
                try {
                  const properties = Object.keys(
                    pickedFeature.primitive?.properties || {},
                  );
                  properties.forEach((property: string) => {
                    const value = pickedFeature.getProperty(property);
                    if (value !== undefined) {
                      description += `
                    <tr>
                      <td>${property}</td>
                      <td>${value}</td>
                    </tr>`;
                    }
                  });
                } catch (error) {
                  console.warn('Error getting feature properties:', error);
                }
                description += '</table>';

                if (!viewer.isDestroyed()) {
                  viewer.selectedEntity = new Entity({
                    name: '建筑物信息',
                    description: description,
                  });
                }
              }
            },
            ScreenSpaceEventType.LEFT_CLICK,
          );

          // 设置相机位置 (调整视角以更好地观察建筑群)
          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(116.3915, 39.9053, 1500), // 降低高度以更好地观察建筑
            orientation: {
              heading: Math.toRadians(45), // 调整视角
              pitch: Math.toRadians(-25), // 调整俯仰角
              roll: 0.0,
            },
          });
        }
      } catch (error) {
        console.error('Error loading OSM Buildings:', error);
      }
    };

    // 按顺序初始化各个组件
    const initializeAll = async () => {
      await initTerrain();
      await addOsmBuildings();
    };

    initializeAll().catch(console.error);

    // 添加鼠标滚轮缩放事件
    viewer.scene.screenSpaceCameraController.enableZoom = true;
    viewer.scene.screenSpaceCameraController.zoomEventTypes = [
      CameraEventType.WHEEL,
      CameraEventType.PINCH,
    ];

    // 清理函数
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  // 处理图层显示/隐藏
  useEffect(() => {
    if (!viewerRef.current || viewerRef.current.isDestroyed()) return;

    const viewer = viewerRef.current;

    // 控制地形图层
    const updateTerrain = async () => {
      try {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return;

        const terrainProvider = layers.terrain
          ? await createWorldTerrainAsync({
              requestVertexNormals: true,
              requestWaterMask: true,
            })
          : new EllipsoidTerrainProvider();

        if (!viewer.isDestroyed()) {
          viewer.terrainProvider = terrainProvider;
        }
      } catch (error) {
        console.error('Error updating terrain:', error);
      }
    };
    updateTerrain().catch(console.error);

    // 控制影像图层
    const imageryLayer = viewer.imageryLayers.get(0);
    if (imageryLayer) {
      imageryLayer.show = layers.imagery;
    }

    // 控制建筑物图层
    const buildingsPrimitive = viewer.scene.primitives.get(0);
    if (buildingsPrimitive) {
      buildingsPrimitive.show = layers.buildings;
    }
  }, [layers]);

  // 处理测量工具
  useEffect(() => {
    if (!viewerRef.current || viewerRef.current.isDestroyed()) return;
    const viewer = viewerRef.current;

    if (isMeasuring) {
      const positions: Cartesian3[] = [];
      measurementRef.current.positions = positions;

      // 创建测量线
      measurementRef.current.polyline = viewer.entities.add({
        polyline: {
          positions: new CallbackProperty(() => positions, false),
          width: 2,
          material: Color.YELLOW,
        },
      });

      // 创建距离标签
      measurementRef.current.label = viewer.entities.add({
        position: new CallbackProperty(() => {
          if (positions.length < 2) return undefined;
          return Cartesian3.midpoint(
            positions[positions.length - 1],
            positions[positions.length - 2],
            new Cartesian3(),
          );
        }, false) as unknown as PositionProperty,
        label: {
          text: new CallbackProperty(() => {
            if (positions.length < 2) return '';
            const distance = Cartesian3.distance(
              positions[positions.length - 1],
              positions[positions.length - 2],
            );
            return `距离: ${distance.toFixed(2)} 米`;
          }, false),
          font: '14px sans-serif',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(0, -20),
        },
      });

      // 添加点击事件处理
      measurementRef.current.handler = new ScreenSpaceEventHandler(
        viewer.scene.canvas,
      );
      measurementRef.current.handler.setInputAction(
        (event: ScreenSpaceEventHandler.PositionedEvent) => {
          if (!viewer.isDestroyed()) {
            const cartesian = viewer.scene.pickPosition(event.position);
            if (cartesian) {
              positions.push(cartesian);
            }
          }
        },
        ScreenSpaceEventType.LEFT_CLICK,
      );
    } else {
      // 清理测量工具
      if (measurementRef.current.handler) {
        measurementRef.current.handler.destroy();
      }
      if (measurementRef.current.polyline) {
        viewer.entities.remove(measurementRef.current.polyline);
      }
      if (measurementRef.current.label) {
        viewer.entities.remove(measurementRef.current.label);
      }
      measurementRef.current = {};
    }

    return () => {
      if (measurementRef.current.handler) {
        measurementRef.current.handler.destroy();
      }
    };
  }, [isMeasuring]);

  return (
    <div className={styles.cityGisContainer}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <h3>图层控制</h3>
          <label>
            <input
              type="checkbox"
              checked={layers.buildings}
              onChange={(e) =>
                setLayers({ ...layers, buildings: e.target.checked })
              }
            />
            建筑物
          </label>
          <label>
            <input
              type="checkbox"
              checked={layers.terrain}
              onChange={(e) =>
                setLayers({ ...layers, terrain: e.target.checked })
              }
            />
            地形
          </label>
          <label>
            <input
              type="checkbox"
              checked={layers.imagery}
              onChange={(e) =>
                setLayers({ ...layers, imagery: e.target.checked })
              }
            />
            影像
          </label>
        </div>
        <div className={styles.toolGroup}>
          <h3>工具</h3>
          <button
            className={`${styles.toggleButton} ${
              isMeasuring ? styles.active : ''
            }`}
            onClick={() => setIsMeasuring(!isMeasuring)}
          >
            {isMeasuring ? '停止测量' : '开始测量'}
          </button>
          <button
            className={styles.toggleButton}
            onClick={() => setShowNewBuilding(!showNewBuilding)}
          >
            {showNewBuilding ? '隐藏新建筑' : '显示新建筑'}
          </button>
        </div>
      </div>
      <div className={styles.cesiumContainer} ref={cesiumContainerRef} />
    </div>
  );
};

export default CityGIS;
