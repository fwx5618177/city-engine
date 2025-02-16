import {
  CallbackProperty,
  CameraEventType,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Cesium3DTileFeature,
  Cesium3DTileStyle,
  Cesium3DTileset,
  Color,
  EllipsoidTerrainProvider,
  Entity,
  HeightReference,
  Ion,
  KmlDataSource,
  LabelStyle,
  OpenStreetMapImageryProvider,
  PolylineGlowMaterialProperty,
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

// 建筑样式配置
const BUILDING_STYLES = {
  colors: {
    highRise: "color('rgba(102, 204, 255, 0.9)')",
    midRise: "color('rgba(179, 229, 252, 0.9)')",
    commercial: "color('rgba(255, 235, 59, 0.9)')",
    residential: "color('rgba(129, 199, 132, 0.9)')",
    default: "color('rgba(224, 224, 224, 0.9)')",
    selected: "color('rgba(255, 0, 0, 0.9)')",
    hover: "color('rgba(255, 193, 7, 0.8')",
    selectedOutline: "color('rgba(255, 0, 0, 1.0')",
  },
  heights: {
    highRise: 100,
    midRise: 50,
  },
  outlineWidth: {
    default: 1.0,
    selected: 2.0,
  },
};

// 射频信号配置
const RF_SIGNAL_CONFIG = {
  colors: {
    strong: Color.fromCssColorString('rgba(0, 255, 0, 0.8)'),
    medium: Color.fromCssColorString('rgba(255, 255, 0, 0.8)'),
    weak: Color.fromCssColorString('rgba(255, 0, 0, 0.8)'),
  },
  thresholds: {
    strong: -60, // dBm
    medium: -80, // dBm
  },
  propagation: {
    initialPower: 20, // dBm
    frequency: 2400, // MHz
    wallLoss: 5, // dB per wall
    distanceLoss: 20, // dB per decade
    reflectionLoss: 3, // dB per reflection
    diffractionLoss: 6, // dB per diffraction
  },
};

const CityGIS: React.FC = () => {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [showNewBuilding, setShowNewBuilding] = useState(true);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [buildingsTileset, setBuildingsTileset] =
    useState<Cesium3DTileset | null>(null);
  const [layers, setLayers] = useState({
    buildings: true,
    terrain: true,
    imagery: true,
  });
  const [kmzDataSource, setKmzDataSource] = useState<KmlDataSource | null>(
    null,
  );
  const [isLoadingKmz, setIsLoadingKmz] = useState(false);
  const [kmzVisible, setKmzVisible] = useState(true);
  const [hoveredFeature, setHoveredFeature] =
    useState<Cesium3DTileFeature | null>(null);
  const [selectedFeature, setSelectedFeature] =
    useState<Cesium3DTileFeature | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRfSignals, setShowRfSignals] = useState(false);
  const [signalSources, setSignalSources] = useState<Entity[]>([]);
  const [signalPaths, setSignalPaths] = useState<Entity[]>([]);
  const signalEntitiesRef = useRef<Entity[]>([]);

  // 测量工具状态
  const measurementRef = useRef<{
    handler?: ScreenSpaceEventHandler;
    positions?: Cartesian3[];
    polyline?: Entity;
    label?: Entity;
  }>({});

  // 在 CityGIS 组件内部添加新的 CSS 类
  const [cursorStyle, setCursorStyle] = useState('default');

  useEffect(() => {
    if (!cesiumContainerRef.current) return;

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

    // 设置建筑样式
    const applyBuildingStyle = (buildingsTileset: Cesium3DTileset) => {
      const style = new Cesium3DTileStyle({
        color: {
          conditions: [
            [
              'Boolean(${height}) && Number(${height}) > 100.0',
              BUILDING_STYLES.colors.highRise,
            ],
            [
              'Boolean(${height}) && Number(${height}) > 50.0',
              BUILDING_STYLES.colors.midRise,
            ],
            ['${building} === "commercial"', BUILDING_STYLES.colors.commercial],
            [
              '${building} === "residential"',
              BUILDING_STYLES.colors.residential,
            ],
            ['true', BUILDING_STYLES.colors.default],
          ],
        },
        show: true,
        outlineColor: "color('rgba(50, 50, 50, 0.4)')",
        outlineWidth: 2.0,
      });

      buildingsTileset.style = style;

      // 设置相机位置以更好地观察建筑群
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.camera.flyTo({
          destination: Cartesian3.fromDegrees(116.3915, 39.9053, 1500),
          orientation: {
            heading: 0.7853981633974483,
            pitch: -0.4,
            roll: 0.0,
          },
        });
      }
    };

    // 显示错误消息
    const showError = (message: string) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(null), 3000); // 3秒后自动消失
    };

    // 获取建筑详细信息
    const getBuildingDetails = (feature: Cesium3DTileFeature) => {
      try {
        const properties = {
          type:
            feature.getProperty('building') || feature.getProperty('function'),
          height: feature.getProperty('height'),
          levels: feature.getProperty('building:levels'),
          year: feature.getProperty('start_date'),
          address: feature.getProperty('addr:street'),
          usage: feature.getProperty('usage'),
          material: feature.getProperty('building:material'),
          architect: feature.getProperty('architect'),
          name: feature.getProperty('name'),
        };

        let description = '<table class="cesium-infoBox-defaultTable">';
        Object.entries(properties).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            let formattedValue = value;
            if (key === 'height') {
              formattedValue = `${Number(value).toFixed(2)}m`;
            }
            description += `
              <tr>
                <th>${formattedKey}</th>
                <td>${formattedValue}</td>
              </tr>`;
          }
        });
        description += '</table>';

        return description;
      } catch (error) {
        console.warn('Error getting building details:', error);
        return '<p>无法获取建筑信息</p>';
      }
    };

    // 更新建筑交互处理
    const addBuildingInteraction = (viewer: Viewer) => {
      const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

      interface MovementEvent {
        endPosition: Cartesian2;
      }

      interface ClickEvent {
        position: Cartesian2;
      }

      // 鼠标移动事件
      const handleMouseMove = (movement: MovementEvent) => {
        if (!buildingsTileset) return;

        const pickedFeature = viewer.scene.pick(movement.endPosition);

        // 更新鼠标样式
        if (pickedFeature?.primitive) {
          setCursorStyle('pointer');
          document.body.style.cursor = 'pointer';
        } else {
          setCursorStyle('default');
          document.body.style.cursor = 'default';
        }

        // 恢复之前悬停建筑的样式
        if (hoveredFeature && hoveredFeature !== selectedFeature) {
          try {
            hoveredFeature.color = Color.fromCssColorString(
              BUILDING_STYLES.colors.default.slice(6, -2),
            );
            buildingsTileset.style = new Cesium3DTileStyle({
              outlineWidth: BUILDING_STYLES.outlineWidth.default,
            });
          } catch (error: unknown) {
            if (error instanceof Error) {
              console.warn('Error resetting hover style:', error.message);
            }
          }
        }

        // 设置新的悬停建筑样式
        if (pickedFeature?.primitive) {
          const feature =
            pickedFeature.content?.tile?.content?.batchTable?.getFeature?.(
              pickedFeature.batchId,
            );
          if (feature && feature !== selectedFeature) {
            setHoveredFeature(feature);
            try {
              feature.color = Color.fromCssColorString(
                BUILDING_STYLES.colors.hover.slice(6, -2),
              );
              buildingsTileset.style = new Cesium3DTileStyle({
                outlineWidth: BUILDING_STYLES.outlineWidth.default,
              });
            } catch (error: unknown) {
              if (error instanceof Error) {
                showError('无法高亮显示建筑: ' + error.message);
              }
            }
          }
        } else {
          setHoveredFeature(null);
        }
      };

      // 点击选择建筑
      const handleClick = (movement: ClickEvent) => {
        if (!buildingsTileset || !viewerRef.current) return;

        const viewer = viewerRef.current;
        const pickedFeature = viewer.scene.pick(movement.position);
        const pickedPosition = viewer.scene.pickPosition(movement.position);

        // 如果在信号分析模式下
        if (showRfSignals && pickedPosition) {
          // 如果点击到了建筑物
          if (pickedFeature?.primitive) {
            const feature =
              pickedFeature.content?.tile?.content?.batchTable?.getFeature?.(
                pickedFeature.batchId,
              );
            if (feature) {
              // 清除之前选中的建筑物样式
              if (selectedFeature) {
                selectedFeature.color = Color.fromCssColorString(
                  'rgba(224, 224, 224, 0.9)',
                );
              }

              setSelectedFeature(feature);
              // 设置新的样式
              feature.color = Color.fromCssColorString('rgba(255, 0, 0, 0.9)');
            }
          }

          // 添加信号源
          const cartographic = Cartographic.fromCartesian(pickedPosition);
          const adjustedPosition = Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            cartographic.height + 10,
          );
          addSignalSource(adjustedPosition);
          return;
        }

        // 如果点击空白处，清除选中状态
        if (!pickedFeature?.primitive) {
          if (selectedFeature) {
            try {
              selectedFeature.color = Color.fromCssColorString(
                BUILDING_STYLES.colors.default.slice(6, -2),
              );
              buildingsTileset.style = new Cesium3DTileStyle({
                outlineWidth: BUILDING_STYLES.outlineWidth.default,
              });
            } catch (error: unknown) {
              if (error instanceof Error) {
                console.warn('Error resetting selection:', error.message);
              }
            }
            setSelectedFeature(null);
            viewer.selectedEntity = undefined;
          }
          return;
        }

        // 设置新的选中建筑样式
        const feature =
          pickedFeature.content?.tile?.content?.batchTable?.getFeature?.(
            pickedFeature.batchId,
          );
        if (feature) {
          // 如果点击已选中的建筑，取消选中
          if (feature === selectedFeature) {
            try {
              feature.color = Color.fromCssColorString(
                BUILDING_STYLES.colors.default.slice(6, -2),
              );
              buildingsTileset.style = new Cesium3DTileStyle({
                outlineWidth: BUILDING_STYLES.outlineWidth.default,
              });
            } catch (error: unknown) {
              if (error instanceof Error) {
                console.warn('Error resetting selection:', error.message);
              }
            }
            setSelectedFeature(null);
            viewer.selectedEntity = undefined;
            return;
          }

          // 恢复之前选中建筑的样式
          if (selectedFeature) {
            try {
              selectedFeature.color = Color.fromCssColorString(
                BUILDING_STYLES.colors.default.slice(6, -2),
              );
              buildingsTileset.style = new Cesium3DTileStyle({
                outlineWidth: BUILDING_STYLES.outlineWidth.default,
              });
            } catch (error: unknown) {
              if (error instanceof Error) {
                console.warn(
                  'Error resetting previous selection:',
                  error.message,
                );
              }
            }
          }

          setSelectedFeature(feature);
          try {
            // 设置选中建筑的样式
            feature.color = Color.fromCssColorString(
              BUILDING_STYLES.colors.selected.slice(6, -2),
            );
            buildingsTileset.style = new Cesium3DTileStyle({
              outlineColor: BUILDING_STYLES.colors.selectedOutline,
              outlineWidth: BUILDING_STYLES.outlineWidth.selected,
            });

            viewer.selectedEntity = new Entity({
              name: '建筑信息',
              description: getBuildingDetails(feature),
            });
          } catch (error: unknown) {
            if (error instanceof Error) {
              showError('无法显示建筑信息: ' + error.message);
            }
          }
        }
      };

      handler.setInputAction(handleMouseMove, ScreenSpaceEventType.MOUSE_MOVE);
      handler.setInputAction(handleClick, ScreenSpaceEventType.LEFT_CLICK);
      return handler;
    };

    // 添加 Cesium OSM Buildings
    const addOsmBuildings = async () => {
      try {
        if (viewer.isDestroyed()) return;
        const tileset = await createOsmBuildingsAsync();

        if (!viewer.isDestroyed()) {
          viewer.scene.primitives.add(tileset);
          setBuildingsTileset(tileset);

          // 应用建筑样式
          applyBuildingStyle(tileset);

          // 添加建筑交互
          const interactionHandler = addBuildingInteraction(viewer);

          // 在组件卸载时清理
          return () => {
            if (interactionHandler) {
              interactionHandler.destroy();
            }
          };
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

  // 添加加载 KMZ 的函数
  const loadKmzModel = async (file: File) => {
    if (!viewerRef.current || viewerRef.current.isDestroyed()) return;

    try {
      setIsLoadingKmz(true);

      // 如果已有模型，先移除
      if (kmzDataSource) {
        await viewerRef.current.dataSources.remove(kmzDataSource);
      }

      const url = URL.createObjectURL(file);
      const kmlDataSource = await KmlDataSource.load(url, {
        camera: viewerRef.current.scene.camera,
        canvas: viewerRef.current.scene.canvas,
      });

      await viewerRef.current.dataSources.add(kmlDataSource);
      setKmzDataSource(kmlDataSource);
      setKmzVisible(true);

      // 自动定位到模型
      await viewerRef.current.zoomTo(kmlDataSource);

      // 清理 URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error loading KMZ model:', error);
    } finally {
      setIsLoadingKmz(false);
    }
  };

  // 添加文件上传处理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadKmzModel(file);
    }
  };

  // 切换 KMZ 模型显示/隐藏
  const toggleKmzVisibility = () => {
    if (kmzDataSource) {
      kmzDataSource.show = !kmzVisible;
      setKmzVisible(!kmzVisible);
    }
  };

  // 删除 KMZ 模型
  const removeKmz = async () => {
    if (viewerRef.current && kmzDataSource) {
      await viewerRef.current.dataSources.remove(kmzDataSource);
      setKmzDataSource(null);
    }
  };

  // 清理函数
  useEffect(() => {
    return () => {
      if (kmzDataSource && viewerRef.current) {
        viewerRef.current.dataSources.remove(kmzDataSource);
      }
    };
  }, [kmzDataSource]);

  // 添加射频信号源
  const addSignalSource = (position: Cartesian3) => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;

    // 创建一个圆形点作为信号源
    const source = viewer.entities.add({
      position,
      point: {
        pixelSize: 15,
        color: Color.RED.withAlpha(0.8),
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        heightReference: HeightReference.RELATIVE_TO_GROUND,
      },
      label: {
        text: '信号源',
        font: '14px sans-serif',
        style: LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        verticalOrigin: 1,
        pixelOffset: new Cartesian2(0, -20),
        heightReference: HeightReference.RELATIVE_TO_GROUND,
      },
    });

    setSignalSources((prev) => [...prev, source]);
    simulateSignalPropagation(source);
  };

  // 修改信号传播模拟
  const simulateSignalPropagation = (source: Entity) => {
    if (!viewerRef.current || !source.position || !selectedFeature) return;

    const viewer = viewerRef.current;
    const sourcePosition = source.position.getValue(viewer.clock.currentTime);
    if (!sourcePosition) return;

    // 获取建筑物的位置和高度
    const buildingPosition = sourcePosition.clone();
    buildingPosition.z += selectedFeature.getProperty('height') || 30;

    // 创建主信号路径
    const mainPath = viewer.entities.add({
      polyline: {
        positions: [sourcePosition, buildingPosition],
        width: 3,
        material: new PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: Color.YELLOW.withAlpha(0.8),
        }),
      },
    });
    setSignalPaths((prev) => [...prev, mainPath]);

    // 创建信号扩散效果
    const numRings = 5;
    const maxRadius = 50;
    for (let i = 0; i < numRings; i++) {
      const radius = (i + 1) * (maxRadius / numRings);
      const positions = generateCirclePositions(buildingPosition, radius, 36);

      const ring = viewer.entities.add({
        polyline: {
          positions: positions,
          width: 2,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: Color.CYAN.withAlpha(0.6),
          }),
        },
      });
      signalEntitiesRef.current.push(ring);
    }

    // 添加信号强度标签
    const strengthLabel = viewer.entities.add({
      position: Cartesian3.midpoint(
        sourcePosition,
        buildingPosition,
        new Cartesian3(),
      ),
      label: {
        text: '信号强度分析',
        font: '16px sans-serif',
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: 0,
        pixelOffset: new Cartesian2(0, -20),
        showBackground: true,
        backgroundColor: Color.BLACK.withAlpha(0.7),
      },
    });
    signalEntitiesRef.current.push(strengthLabel);
  };

  // 添加辅助函数生成圆形位置
  const generateCirclePositions = (
    center: Cartesian3,
    radius: number,
    segments: number,
  ) => {
    const positions = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      const z = center.z;
      positions.push(new Cartesian3(x, y, z));
    }
    return positions;
  };

  // 修改清理函数
  const clearSignalVisualization = () => {
    if (!viewerRef.current) return;

    // 清理信号源
    signalSources.forEach((source) => {
      viewerRef.current?.entities.remove(source);
    });
    setSignalSources([]);

    // 清理信号路径
    signalPaths.forEach((path) => {
      viewerRef.current?.entities.remove(path);
    });
    setSignalPaths([]);

    // 清理信号实体
    signalEntitiesRef.current.forEach((entity) => {
      viewerRef.current?.entities.remove(entity);
    });
    signalEntitiesRef.current = [];
  };

  // 在组件卸载时清理
  useEffect(() => {
    return () => {
      clearSignalVisualization();
    };
  }, []);

  return (
    <div className={styles.cityGisContainer} style={{ cursor: cursorStyle }}>
      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}
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
        <div className={styles.toolGroup}>
          <h3>KMZ 模型</h3>
          <input
            type="file"
            accept=".kmz,.kml"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="kmz-file-input"
          />
          <button
            className={`${styles.toggleButton} ${
              isLoadingKmz ? styles.active : ''
            }`}
            onClick={() => document.getElementById('kmz-file-input')?.click()}
            disabled={isLoadingKmz}
          >
            {isLoadingKmz ? '加载中...' : '加载 KMZ 模型'}
          </button>
          {kmzDataSource && (
            <>
              <button
                className={`${styles.toggleButton} ${
                  !kmzVisible ? styles.active : ''
                }`}
                onClick={toggleKmzVisibility}
              >
                {kmzVisible ? '隐藏 KMZ' : '显示 KMZ'}
              </button>
              <button className={`${styles.toggleButton}`} onClick={removeKmz}>
                删除 KMZ
              </button>
            </>
          )}
        </div>
        <div className={styles.toolGroup}>
          <h3>信号分析</h3>
          <button
            className={`${styles.toggleButton} ${
              showRfSignals ? styles.active : ''
            }`}
            onClick={() => {
              setShowRfSignals(!showRfSignals);
              if (!showRfSignals) {
                clearSignalVisualization();
              }
            }}
          >
            {showRfSignals ? '停止信号分析' : '开始信号分析'}
          </button>
          {showRfSignals && (
            <div className={styles.signalInfo}>
              <p>点击地图添加信号源</p>
              <p>信号频率: {RF_SIGNAL_CONFIG.propagation.frequency} MHz</p>
              <p>初始功率: {RF_SIGNAL_CONFIG.propagation.initialPower} dBm</p>
            </div>
          )}
        </div>
      </div>
      <div className={styles.cesiumContainer} ref={cesiumContainerRef} />
    </div>
  );
};

export default CityGIS;
