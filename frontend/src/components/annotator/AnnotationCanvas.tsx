import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Group } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { useAnnotationStore } from '../../store/annotationStore';
import { useProjectStore } from '../../store/projectStore';
import { normalizedToPixel } from '../../utils/coordinates';
import { hexToRgba } from '../../utils/colors';

interface Props {
  imageUrl: string;
  containerWidth: number;
  containerHeight: number;
}

export function AnnotationCanvas({ imageUrl, containerWidth, containerHeight }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const [image] = useImage(imageUrl, 'anonymous');
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const {
    annotations,
    drawingVertices,
    drawingState,
    selectedAnnotationId,
    selectedVertexIndex,
    activeTool,
    activeClassId,
    stageScale,
    stagePosition,
    imageWidth,
    imageHeight,
    setImageDimensions,
    setStageScale,
    setStagePosition,
    addDrawingVertex,
    closePolygon,
    cancelDrawing,
    selectAnnotation,
    selectVertex,
    moveVertex,
    deleteSelectedAnnotation,
    deleteSelectedVertex,
    undo,
    redo,
    saveAnnotations,
    setActiveTool,
  } = useAnnotationStore();

  const { classes } = useProjectStore();
  const classColorMap = Object.fromEntries(classes.map((c) => [c.id, c.color]));

  // Set image dimensions and auto-fit when loaded
  useEffect(() => {
    if (image) {
      const natW = image.naturalWidth;
      const natH = image.naturalHeight;
      setImageDimensions(natW, natH);

      // Auto-fit: scale image to fit container with padding
      const padding = 40;
      const scaleX = (containerWidth - padding) / natW;
      const scaleY = (containerHeight - padding) / natH;
      const fitScale = Math.min(scaleX, scaleY, 1); // don't upscale small images

      const offsetX = (containerWidth - natW * fitScale) / 2;
      const offsetY = (containerHeight - natH * fitScale) / 2;

      setStageScale(fitScale);
      setStagePosition({ x: offsetX, y: offsetY });
    }
  }, [image, containerWidth, containerHeight, setImageDimensions, setStageScale, setStagePosition]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelDrawing();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedVertexIndex !== null) {
          deleteSelectedVertex();
        } else if (selectedAnnotationId) {
          deleteSelectedAnnotation();
        }
      } else if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        redo();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveAnnotations();
      } else if (e.key === 'd' || e.key === 'D') {
        if (!e.ctrlKey) setActiveTool('draw');
      } else if (e.key === 'e' || e.key === 'E') {
        if (!e.ctrlKey) setActiveTool('edit');
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPanning(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    cancelDrawing, deleteSelectedAnnotation, deleteSelectedVertex,
    undo, redo, saveAnnotations, setActiveTool, selectedAnnotationId, selectedVertexIndex,
  ]);

  const getImagePoint = useCallback(
    (stage: Konva.Stage): { x: number; y: number } | null => {
      const pointer = stage.getPointerPosition();
      if (!pointer) return null;
      const transform = stage.getAbsoluteTransform().copy().invert();
      return transform.point(pointer);
    },
    []
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      if (activeTool === 'pan' || isPanning) return;

      // If clicking on empty area in edit mode, deselect
      if (activeTool === 'edit' && e.target === stage) {
        selectAnnotation(null);
        return;
      }

      if (activeTool === 'draw') {
        if (!activeClassId) return;
        const point = getImagePoint(stage);
        if (!point) return;
        addDrawingVertex(point.x, point.y);
      }
    },
    [activeTool, isPanning, activeClassId, getImagePoint, addDrawingVertex, selectAnnotation]
  );

  const handleDoubleClick = useCallback(() => {
    if (drawingState === 'drawing' && drawingVertices.length >= 3) {
      closePolygon();
    }
  }, [drawingState, drawingVertices.length, closePolygon]);

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const point = getImagePoint(stage);
      if (point) setMousePos(point);
    },
    [getImagePoint]
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.1;
      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      const mousePointTo = {
        x: (pointer.x - stagePosition.x) / oldScale,
        y: (pointer.y - stagePosition.y) / oldScale,
      };

      setStageScale(clampedScale);
      setStagePosition({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      });
    },
    [stageScale, stagePosition, setStageScale, setStagePosition]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (activeTool === 'pan' || isPanning) {
        setStagePosition({ x: e.target.x(), y: e.target.y() });
      }
    },
    [activeTool, isPanning, setStagePosition]
  );

  // Vertex drag handling
  const handleVertexDragEnd = useCallback(
    (annotationId: string, vertexIndex: number, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      moveVertex(annotationId, vertexIndex, node.x(), node.y());
    },
    [moveVertex]
  );

  return (
    <Stage
      ref={stageRef}
      width={containerWidth}
      height={containerHeight}
      scaleX={stageScale}
      scaleY={stageScale}
      x={stagePosition.x}
      y={stagePosition.y}
      draggable={activeTool === 'pan' || isPanning}
      onClick={handleStageClick}
      onDblClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      onDragEnd={handleDragEnd}
      style={{ backgroundColor: 'var(--bg-deep, #0a0c14)' }}
    >
      {/* Layer 1: Background Image */}
      <Layer>
        {image && <KonvaImage image={image} />}
      </Layer>

      {/* Layer 2: Completed Polygons */}
      <Layer>
        {annotations.map((ann) => {
          const color = classColorMap[ann.classId] || '#999';
          const points = ann.vertices.flatMap((v) => {
            const p = normalizedToPixel(v.x, v.y, imageWidth, imageHeight);
            return [p.x, p.y];
          });
          const isSelected = ann.id === selectedAnnotationId;

          return (
            <Group key={ann.id}>
              <Line
                points={points}
                closed
                fill={hexToRgba(color, 0.25)}
                stroke={color}
                strokeWidth={isSelected ? 3 : 2}
                hitStrokeWidth={10}
                onClick={(e) => {
                  if (activeTool === 'edit') {
                    e.cancelBubble = true;
                    selectAnnotation(ann.id);
                  }
                }}
              />
              {/* Vertex handles when selected */}
              {isSelected &&
                activeTool === 'edit' &&
                ann.vertices.map((v, i) => {
                  const p = normalizedToPixel(v.x, v.y, imageWidth, imageHeight);
                  return (
                    <Circle
                      key={i}
                      x={p.x}
                      y={p.y}
                      radius={6 / stageScale}
                      fill={selectedVertexIndex === i ? '#ff0000' : '#fff'}
                      stroke={color}
                      strokeWidth={2 / stageScale}
                      draggable
                      onClick={(e) => {
                        e.cancelBubble = true;
                        selectVertex(i);
                      }}
                      onDragEnd={(e) => handleVertexDragEnd(ann.id, i, e)}
                    />
                  );
                })}
            </Group>
          );
        })}
      </Layer>

      {/* Layer 3: Drawing in Progress */}
      <Layer>
        {drawingState === 'drawing' && drawingVertices.length > 0 && (
          <>
            {/* Completed edges */}
            <Line
              points={drawingVertices.flatMap((v) => {
                const p = normalizedToPixel(v.x, v.y, imageWidth, imageHeight);
                return [p.x, p.y];
              })}
              stroke={classColorMap[activeClassId || ''] || '#228be6'}
              strokeWidth={2}
            />
            {/* Rubber-band line to mouse */}
            {mousePos && (
              <Line
                points={(() => {
                  const last = drawingVertices[drawingVertices.length - 1];
                  const lp = normalizedToPixel(last.x, last.y, imageWidth, imageHeight);
                  return [lp.x, lp.y, mousePos.x, mousePos.y];
                })()}
                stroke={classColorMap[activeClassId || ''] || '#228be6'}
                strokeWidth={1}
                dash={[5, 5]}
              />
            )}
            {/* Vertex dots */}
            {drawingVertices.map((v, i) => {
              const p = normalizedToPixel(v.x, v.y, imageWidth, imageHeight);
              return (
                <Circle
                  key={i}
                  x={p.x}
                  y={p.y}
                  radius={i === 0 ? 8 / stageScale : 4 / stageScale}
                  fill={i === 0 ? '#fff' : classColorMap[activeClassId || ''] || '#228be6'}
                  stroke={classColorMap[activeClassId || ''] || '#228be6'}
                  strokeWidth={2 / stageScale}
                />
              );
            })}
          </>
        )}
      </Layer>
    </Stage>
  );
}
